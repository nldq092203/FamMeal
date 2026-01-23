import { useState, useEffect } from 'react'
import { X, GripVertical, Check } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ProposalWithStats } from '@/types'
import { useCastVotesMutation } from '@/query/hooks/useCastVotesMutation'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { useMyMealVotesQuery } from '@/query/hooks/useMyMealVotesQuery'

interface RankProposalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealId: string
  mealTitle: string
  proposals: ProposalWithStats[]
}

/**
 * Modal dialog for ranked-choice voting with drag-and-drop
 */
export function RankProposalsDialog({
  open,
  onOpenChange,
  mealId,
  mealTitle,
  proposals,
}: RankProposalsDialogProps) {
  const toast = useToast()
  const [rankedProposals, setRankedProposals] = useState<ProposalWithStats[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const castVotes = useCastVotesMutation()
  const myVotesQuery = useMyMealVotesQuery(mealId, open)

  const isSubmitting = castVotes.isPending
  const isVotesLoading = myVotesQuery.isLoading
  const myVotesData = myVotesQuery.data
  const hasExistingVotes =
    (myVotesData ?? []).some((v) => Number.isInteger(v.rankPosition) && v.rankPosition >= 1)

  // Initialize ranked proposals based on existing votes
  useEffect(() => {
    if (!open || proposals.length === 0) return
    if (isVotesLoading) return

    const sortedProposals = [...proposals]
    const myVotes = myVotesData ?? []
    const normalizedMyVotes = myVotes
      .filter((v) => Number.isInteger(v.rankPosition) && v.rankPosition >= 1)
      .map((v) => ({ proposalId: v.proposalId, rankPosition: v.rankPosition }))
    const hasMyVotes = normalizedMyVotes.length > 0
    const myVoteMap = hasMyVotes ? new Map(normalizedMyVotes.map((v) => [v.proposalId, v.rankPosition])) : null

    sortedProposals.sort((a, b) => {
      const aRank = myVoteMap?.get(a.id)
      const bRank = myVoteMap?.get(b.id)

      if (typeof aRank === 'number' && typeof bRank === 'number') return aRank - bRank
      if (typeof aRank === 'number') return -1
      if (typeof bRank === 'number') return 1

      return (b.voteStats.totalScore ?? 0) - (a.voteStats.totalScore ?? 0)
    })

    setRankedProposals(sortedProposals)
  }, [open, proposals, myVotesData, isVotesLoading])

  const handleDragStart = (index: number) => {
    if (isSubmitting) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (isSubmitting) return
    if (draggedIndex === null || draggedIndex === index) return

    const newProposals = [...rankedProposals]
    const draggedItem = newProposals[draggedIndex]
    newProposals.splice(draggedIndex, 1)
    newProposals.splice(index, 0, draggedItem)

    setRankedProposals(newProposals)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = async () => {
    try {
      await castVotes.mutateAsync({ mealId, rankedProposalIds: rankedProposals.map((p) => p.id) })
      toast.success('Your votes have been saved!')
      onOpenChange(false)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit votes.')
      toast.error(message)
    }
  }

  if (proposals.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute left-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">Rank Proposals</h2>
            <p className="text-sm text-muted-foreground mt-1">{mealTitle}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-muted/30 border-b">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            {isVotesLoading ? (
              'Loading your votes...'
            ) : hasExistingVotes ? (
              <>
                You have already voted.
                <br />
                Drag to change it, then <span className="font-semibold text-foreground">Save</span>.
              </>
            ) : (
              <>
                You haven’t voted yet.
                <br />
                Make your choice, then <span className="font-semibold text-foreground">Save</span>.
              </>
            )}
          </p>
        </div>

        {/* Draggable list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isVotesLoading ? (
            <div className="py-10 flex items-center justify-center text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mr-2" />
              Loading your votes...
            </div>
          ) : (
            <div className="space-y-3">
              {rankedProposals.map((proposal, index) => {
                const imageUrl = proposal.extra?.imageUrls?.[0]
                const isDragging = draggedIndex === index

                return (
                  <div
                    key={proposal.id}
                    draggable={!isSubmitting}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-move
                      ${isDragging ? 'opacity-50 border-primary' : 'border-border hover:border-primary/50'}
                      ${index === 0 ? 'bg-primary/5 border-primary/30' : 'bg-card'}
                    `}
                  >
                    {/* Rank badge */}
                    <div
                      className={`
                        flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full font-bold text-lg
                        ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      `}
                    >
                      {index + 1}
                    </div>

                    {/* Image */}
                    {imageUrl ? (
                      <div className="flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-muted">
                        <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-muted border border-border" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">{proposal.dishName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground truncate">
                          Proposed by {proposal.userName || 'You'}
                        </p>
                      </div>
                    </div>

                    {/* Drag handle */}
                    <button
                      className="flex-shrink-0 p-2 -mr-1 hover:bg-muted rounded-lg transition-colors touch-none"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </button>

                    {/* Green checkmark for #1 */}
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with submit button */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4">
          <Button
            size="lg"
            className="w-full h-12 rounded-xl"
            onClick={handleSubmit}
            disabled={isVotesLoading || isSubmitting || rankedProposals.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Save Ranking
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
