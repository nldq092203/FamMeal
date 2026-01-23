import { useEffect, useMemo, useState } from 'react'
import { Check, X, Award, ChefHat, MessageSquare } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useFinalizeMealMutation } from '@/query/hooks/useAdminMealMutations'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { getAvatarSrc } from '@/assets/avatars'
import type { MealSummary, ProposalWithStats } from '@/types'

type MemberLike = { userId: string; name?: string; username?: string; avatarId?: string }

interface FinalizeMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealId: string
  proposals: ProposalWithStats[]
  members: MemberLike[]
  finalDecision?: MealSummary['finalDecision']
}

export function FinalizeMealDialog({
  open,
  onOpenChange,
  mealId,
  proposals,
  members,
  finalDecision,
}: FinalizeMealDialogProps) {
  const toast = useToast()
  const finalizeMeal = useFinalizeMealMutation()

  const sorted = useMemo(
    () => proposals.slice().sort((a, b) => (b.voteStats.totalScore ?? 0) - (a.voteStats.totalScore ?? 0)),
    [proposals]
  )

  const defaultWinners = useMemo(
    () => finalDecision?.selectedProposalIds ?? (sorted.length > 0 ? [sorted[0].id] : []),
    [finalDecision?.selectedProposalIds, sorted]
  )
  
  const defaultCook = useMemo(
    () => finalDecision?.cookUserId ?? sorted.find((p) => defaultWinners.includes(p.id))?.userId ?? members[0]?.userId ?? '',
    [finalDecision?.cookUserId, sorted, defaultWinners, members]
  )

  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([])
  const [cookUserId, setCookUserId] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    if (!open) return
    setSelectedProposalIds(defaultWinners)
    setCookUserId(defaultCook)
    setReason(finalDecision?.reason ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isSubmitting = finalizeMeal.isPending

  const toggleProposal = (proposalId: string) => {
    setSelectedProposalIds((prev) =>
      prev.includes(proposalId) ? prev.filter((id) => id !== proposalId) : [...prev, proposalId]
    )
  }

  const handleSubmit = async () => {
    if (selectedProposalIds.length === 0) {
      toast.error('Select at least one winning dish.')
      return
    }
    if (!cookUserId) {
      toast.error('Assign a cook.')
      return
    }

    try {
      await finalizeMeal.mutateAsync({
        mealId,
        selectedProposalIds,
        cookUserId,
        reason: reason.trim() ? reason.trim() : undefined,
      })
      toast.success('Meal finalized.')
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to finalize meal.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-hidden p-0 gap-0">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/95 border-b px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-family-display)' }}>
              <Award className="h-6 w-6 text-primary" />
              Finalize Meal
            </DialogTitle>
          </DialogHeader>
          <DialogClose>
            <button
              type="button"
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </div>

        <div className="px-6 py-5 pb-16 space-y-7 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Winner Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Winning Dishes</h3>
              {selectedProposalIds.length > 0 && (
                <Badge variant="outline" className="ml-auto text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                  {selectedProposalIds.length} selected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Select one or more dishes for this meal</p>
            <div className="space-y-2">
              {sorted.map((p) => {
                const selected = selectedProposalIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProposal(p.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                      selected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base truncate">{p.dishName}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">{p.voteStats.voteCount}</span> vote{p.voteStats.voteCount !== 1 ? 's' : ''} • <span className="font-medium text-primary">score {p.voteStats.totalScore}</span>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        selected 
                          ? 'bg-primary border-primary' 
                          : 'border-border bg-background'
                      }`}>
                        {selected && <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assign Cook Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <ChefHat className="h-4 w-4 text-purple-700" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Assign Cook</h3>
            </div>
            <div className="space-y-2">
              {members.map((m) => {
                const selected = m.userId === cookUserId
                const name = m.name || m.username || 'Member'
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => setCookUserId(m.userId)}
                    className={`w-full rounded-xl border-2 p-3 transition-all duration-200 flex items-center gap-3 ${
                      selected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-border overflow-hidden bg-muted shrink-0">
                      <img src={getAvatarSrc(m.avatarId)} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-semibold truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.username ? `@${m.username}` : ''}</div>
                    </div>
                    {selected ? <Check className="h-4 w-4 text-primary shrink-0" strokeWidth={3} /> : null}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-blue-700" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Reason <span className="text-muted-foreground font-normal">(Optional)</span></h3>
            </div>
            <Textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              rows={3} 
              placeholder="E.g., Most votes, best variety, high ratings..."
              className="rounded-xl border-2 resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/95 px-6 py-5">
          <Button 
            size="lg" 
            className="w-full h-12 rounded-xl font-semibold text-base" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Finalizing…' : 'Finalize Meal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
