import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Plus, Timer, Pencil, Vote, MoreVertical, Trash2, Lock, Unlock, CheckCircle2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/Layout'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'
import { useFamily } from '@/context/FamilyContext'
import { useState } from 'react'
import { AddProposalDialog } from './components/AddProposalDialog'
import { MEAL_TYPE_LABELS } from './constants'
import { getAvatarSrc } from '@/assets/avatars'
import { useAuth } from '@/context/AuthContext'
import { EditProposalDialog } from './components/EditProposalDialog'
import { ProposalRankings } from './components/ProposalRankings'
import { RankProposalsDialog } from './components/RankProposalsDialog'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AdminOnly } from '@/components/PermissionGate'
import { EditMealDialog } from './components/EditMealDialog'
import { FinalizeMealDialog } from './components/FinalizeMealDialog'
import { useDeleteMealMutation } from '@/query/hooks/useDeleteMealMutation'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { useCloseVotingMutation, useReopenVotingMutation } from '@/query/hooks/useAdminMealMutations'
import type { Proposal } from '@/types'

function parseMealDateTime(value?: string) {
  if (!value) return null
  // If backend sends YYYY-MM-DD (legacy), parse as local date to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatMealTime(value?: string) {
  if (!value) return null
  // If only a date was provided, treat time as unknown.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatEndsIn(votingClosedAt: string) {
  const now = new Date()
  const closesAt = new Date(votingClosedAt)
  const diffMs = closesAt.getTime() - now.getTime()
  if (Number.isNaN(diffMs)) return null
  if (diffMs <= 0) return 'Ending soon'

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24)
    return `Ends in ${days}d`
  }
  if (diffHours > 0) return `Ends in ${diffHours}h${remainingMins > 0 ? ` ${remainingMins}m` : ''}`
  return `Ends in ${Math.max(1, remainingMins)}m`
}

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const mealSummaryQuery = useMealSummaryQuery(id || null)
  const { families, familyId, family } = useFamily()
  const { user } = useAuth()
  const toast = useToast()
  const [showAddProposal, setShowAddProposal] = useState(false)
  const [showEditProposal, setShowEditProposal] = useState(false)
  const [showVotingDialog, setShowVotingDialog] = useState(false)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showEditMeal, setShowEditMeal] = useState(false)
  const [showDeleteMeal, setShowDeleteMeal] = useState(false)
  const [showCloseVoting, setShowCloseVoting] = useState(false)
  const [showReopenVoting, setShowReopenVoting] = useState(false)
  const [showFinalizeMeal, setShowFinalizeMeal] = useState(false)

  const deleteMealMutation = useDeleteMealMutation()
  const closeVotingMutation = useCloseVotingMutation()
  const reopenVotingMutation = useReopenVotingMutation()

  const summary = mealSummaryQuery.data

  if (mealSummaryQuery.isLoading || !summary || !summary.meal) {
    return (
      <div className="min-h-screen bg-background">
        <PageShell>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </PageShell>
      </div>
    )
  }

	  const meal = summary.meal
	  const proposals = summary.proposals || []
	  const mealDate =
	    parseMealDateTime(meal.scheduledFor) ??
	    parseMealDateTime(meal.date) ??
	    new Date()
	  const votingOpen = meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
	  const canEditProposals = meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
	  const isDiningOut = Boolean(meal.constraints?.isDiningOut)
	  
	  const currentFamily = families.find(f => f.id === familyId)
	  const memberCount = currentFamily?.memberCount
	  
	  // Get time for meal
	  const mealTime = formatMealTime(meal.scheduledFor ?? meal.date) ?? 'Pending'
	  const endsInText = votingOpen && meal.votingClosedAt ? formatEndsIn(meal.votingClosedAt) : null
	  
	  // Determine voting status for rankings
	  const hasVotes = proposals.some(p => p.voteStats.voteCount > 0)
	  const votingStatus: 'active' | 'closed' | 'no-votes' = 
    !hasVotes ? 'no-votes' : 
    votingOpen ? 'active' : 'closed'
  const showRankings = proposals.length > 0 // Show rankings even without votes to encourage voting
  const mealStatus = meal.status


  return (
    <div className="min-h-screen bg-background pb-32">
      <PageShell>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur -mx-4 px-4 py-3 border-b mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/meals')}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold text-lg">
              {mealDate.toLocaleDateString('en-US', { weekday: 'long' })} {MEAL_TYPE_LABELS[meal.mealType]}
            </h2>
            <AdminOnly fallback={<div className="w-10" />}>
              <button
                type="button"
                onClick={() => setShowAdminMenu(true)}
                className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Meal admin actions"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </AdminOnly>
          </div>
        </div>

        {/* Meal Info Card */}
        <div className="bg-card rounded-3xl shadow-sm border overflow-hidden space-y-0">
          <div className="p-6 relative">
            <div className="absolute right-6 top-5 flex gap-2 opacity-30" aria-hidden="true">
              <div className="h-14 w-1.5 rounded-full bg-primary/50" />
              <div className="h-10 w-1.5 rounded-full bg-primary/30 translate-y-2" />
              <div className="h-16 w-1.5 rounded-full bg-primary/20 -translate-y-1" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {votingOpen ? (
                  <Badge
                    variant="outline"
                    className="mb-4 inline-flex items-center gap-2 rounded-full border-primary/30 bg-primary/10 text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="tracking-wide text-xs font-semibold">VOTING OPEN</span>
                  </Badge>
                ) : null}
                <p className="text-muted-foreground mt-2">
                  {mealDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="relative flex-shrink-0">
                <div className="absolute inset-x-0 -top-3 mx-auto h-6 w-10 rounded-b-2xl bg-primary/10" aria-hidden="true" />
                <div className="rounded-3xl border border-border bg-background/60 px-5 py-4 text-center shadow-sm">
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    {mealDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-4xl font-bold leading-none mt-1">{mealDate.getDate()}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{mealTime}</span>
              </div>

              {(memberCount || family?.members?.length) && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{memberCount ?? family?.members?.length} Joining</span>
                </div>
              )}

              {meal.cookUserId && family?.members && (
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  <span>
                    Chef: {(() => {
                      const cook = family.members.find((m) => m.userId === meal.cookUserId)
                      return cook?.name || cook?.username || 'Unknown'
                    })()}
                  </span>
                </div>
              )}
            </div>

            {meal.constraints ? (
              <div className="mt-6 pt-5 border-t border-border/70">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Constraints</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meal.constraints.isDiningOut ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-blue-500/10 text-foreground border-blue-500/25 px-3 py-1"
                    >
                      Dining out
                    </Badge>
                  ) : null}
                  {meal.constraints.maxBudget ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-primary/10 text-foreground border-primary/25 px-3 py-1"
                    >
                      {isDiningOut ? `Up to €${meal.constraints.maxBudget}/person` : `Under $${meal.constraints.maxBudget}`}
                    </Badge>
                  ) : null}
                  {meal.constraints.maxPrepTime || meal.constraints.maxPrepTimeMinutes ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-accent/15 text-foreground border-accent/30 px-3 py-1"
                    >
                      <Timer className="h-3.5 w-3.5 mr-1.5" /> Max {meal.constraints.maxPrepTime ?? meal.constraints.maxPrepTimeMinutes}m
                    </Badge>
                  ) : null}
                  {meal.constraints.servings ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-muted text-foreground border-border/70 px-3 py-1"
                    >
                      {meal.constraints.servings} {isDiningOut ? 'participants' : 'servings'}
                    </Badge>
                  ) : null}
                  {meal.constraints.dietaryRestrictions?.map((r: string) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className="rounded-full bg-destructive/10 text-foreground border-destructive/25 px-3 py-1"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Member Avatars Section with Background */}
          {family?.members && family.members.length > 0 && (
            <div className="bg-muted/30 px-6 py-5 border-t">
              <div className="flex items-center justify-between">
                {/* Member Avatars */}
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {family.members.slice(0, 3).map((member: { userId: string; username: string; name: string; avatarId: string }, idx: number) => (
                      <div
                        key={member.userId}
                        className="relative"
                        style={{ zIndex: 10 - idx }}
                      >
                        <img
                          src={getAvatarSrc(member.avatarId)}
                          alt={member.name}
                          className="h-11 w-11 rounded-full border-3 border-white object-cover ring-2 ring-white"
                        />
                      </div>
                    ))}
                    {family.members.length > 3 && (
                      <div className="h-11 w-11 rounded-full bg-muted border-3 border-white flex items-center justify-center text-sm font-semibold text-muted-foreground ring-2 ring-white">
                        +{family.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Countdown or Status */}
                {endsInText ? (
                  <Badge variant="secondary" className="rounded-full bg-accent/15 text-foreground border border-accent/25">
                    <Timer className="h-3.5 w-3.5 mr-1.5" /> {endsInText}
                  </Badge>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Proposal Rankings - Show when there are votes */}
        {showRankings && (
          <div className="mt-6 space-y-4">
            <ProposalRankings 
              proposals={proposals} 
              votingStatus={votingStatus}
            />
          </div>
        )}


        {/* Proposed Dishes */}
        <div className="mt-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Proposed Dishes</h2>
            <div className="text-sm text-muted-foreground">{proposals.length} total</div>
          </div>
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No proposals yet</p>
              <p className="text-sm mt-1">Be the first to suggest a meal!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {proposals.map((proposal) => {
                const imageUrl = proposal.extra?.imageUrls?.[0]
                const isOwner = Boolean(user?.id) && proposal.userId === user?.id
                const showEdit = canEditProposals && isOwner
                return (
                  <div key={proposal.id} className="rounded-2xl border bg-card shadow-sm relative">
                    <div 
                      className="aspect-square bg-muted relative cursor-pointer"
                      onClick={() => navigate(`/proposals/${proposal.id}`, { state: { mealId: id } })}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                        {imageUrl ? (
                          <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No photo
                          </div>
                        )}
                      </div>

                      {showEdit ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 h-9 w-9 rounded-full bg-background/85 backdrop-blur border border-border shadow-md z-20 pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            setEditingProposal(proposal)
                            setShowEditProposal(true)
                          }}
                          aria-label="Edit proposal"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    <div 
                      className="p-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-b-2xl"
                      onClick={() => navigate(`/proposals/${proposal.id}`, { state: { mealId: id } })}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-snug">{proposal.dishName}</h3>
                        <Badge variant="secondary" className="h-6 rounded-full px-2 text-xs">
                          {proposal.voteStats.voteCount}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {proposal.notes ? proposal.notes : 'votes'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {id && (
          <AddProposalDialog
            open={showAddProposal}
            onOpenChange={setShowAddProposal}
            mealId={id}
            isDiningOut={isDiningOut}
            onSuccess={() => setShowAddProposal(false)}
          />
        )}

        {id && (
          <EditProposalDialog
            open={showEditProposal}
            onOpenChange={(open) => {
              setShowEditProposal(open)
              if (!open) setEditingProposal(null)
            }}
            mealId={id}
            proposal={editingProposal}
            isDiningOut={isDiningOut}
          />
        )}

        {id && (
          <RankProposalsDialog
            open={showVotingDialog}
            onOpenChange={setShowVotingDialog}
            mealId={id}
            mealTitle={`${mealDate.toLocaleDateString('en-US', { weekday: 'long' })} ${MEAL_TYPE_LABELS[meal.mealType]}`}
            proposals={proposals}
          />
        )}

      </PageShell>

      {/* Admin: Edit/Delete Meal */}
      <AdminOnly>
        <Dialog open={showAdminMenu} onOpenChange={setShowAdminMenu}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Meal actions</DialogTitle>
              <DialogClose>
                <Button variant="ghost" size="icon" aria-label="Close meal actions">
                  ✕
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-3">
              {mealStatus === 'PLANNING' ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowAdminMenu(false)
                    setShowCloseVoting(true)
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Close voting
                </Button>
              ) : null}

              {mealStatus === 'LOCKED' ? (
                <>
                  <Button
                    type="button"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setShowAdminMenu(false)
                      setShowFinalizeMeal(true)
                    }}
                    disabled={proposals.length === 0}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finalize meal
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setShowAdminMenu(false)
                      setShowReopenVoting(true)
                    }}
                  >
                    <Unlock className="h-4 w-4" />
                    Reopen voting
                  </Button>
                </>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowAdminMenu(false)
                  setShowEditMeal(true)
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit meal
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowAdminMenu(false)
                  setShowDeleteMeal(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete meal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <EditMealDialog open={showEditMeal} onOpenChange={setShowEditMeal} meal={meal} />

        <Dialog
          open={showDeleteMeal}
          onOpenChange={(open) => {
            if (deleteMealMutation.isPending) return
            setShowDeleteMeal(open)
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete meal?</DialogTitle>
              <DialogClose>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close delete dialog"
                  disabled={deleteMealMutation.isPending}
                >
                  ✕
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                This permanently deletes the meal and its proposals/votes. This action can’t be undone.
              </p>

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={deleteMealMutation.isPending}
                onClick={async () => {
                  if (!id) {
                    toast.error('Missing meal id.')
                    return
                  }
                  try {
                    await deleteMealMutation.mutateAsync({ mealId: id })
                    toast.success('Meal deleted.')
                    setShowDeleteMeal(false)
                    navigate('/meals')
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to delete meal.'))
                  }
                }}
              >
                {deleteMealMutation.isPending ? 'Deleting…' : 'Delete meal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCloseVoting} onOpenChange={setShowCloseVoting}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Close voting?</DialogTitle>
              <DialogClose>
                <Button variant="ghost" size="icon" aria-label="Close close-voting dialog">
                  ✕
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                This locks voting for everyone (PLANNING → LOCKED). You can reopen later.
              </p>

              <Button
                type="button"
                className="w-full"
                disabled={closeVotingMutation.isPending}
                onClick={async () => {
                  if (!id) return
                  try {
                    await closeVotingMutation.mutateAsync(id)
                    toast.success('Voting closed.')
                    setShowCloseVoting(false)
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to close voting.'))
                  }
                }}
              >
                {closeVotingMutation.isPending ? 'Closing…' : 'Close voting'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showReopenVoting} onOpenChange={setShowReopenVoting}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reopen voting?</DialogTitle>
              <DialogClose>
                <Button variant="ghost" size="icon" aria-label="Close reopen-voting dialog">
                  ✕
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">This unlocks voting (LOCKED → PLANNING).</p>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={reopenVotingMutation.isPending}
                onClick={async () => {
                  if (!id) return
                  try {
                    await reopenVotingMutation.mutateAsync(id)
                    toast.success('Voting reopened.')
                    setShowReopenVoting(false)
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to reopen voting.'))
                  }
                }}
              >
                {reopenVotingMutation.isPending ? 'Reopening…' : 'Reopen voting'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <FinalizeMealDialog
          open={showFinalizeMeal}
          onOpenChange={setShowFinalizeMeal}
          mealId={meal.id}
          proposals={proposals}
          members={(family?.members ?? []).map((m) => ({
            userId: m.userId,
            name: m.name,
            username: m.username,
            avatarId: m.avatarId,
          }))}
          finalDecision={summary.finalDecision}
        />
      </AdminOnly>

      {/* Footer Actions */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="app-frame pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="rounded-[28px] bg-background/90 backdrop-blur shadow-xl ring-1 ring-black/5 p-4">
            <div className="flex items-center gap-3">
              {votingOpen ? (
                <Button
                  size="default"
                  onClick={() => setShowVotingDialog(true)}
                  className="flex-1 h-10 rounded-2xl px-6"
                  disabled={proposals.length === 0}
                >
                  <Vote className="h-5 w-5 mr-2" />
                  Vote Now
                </Button>
              ) : null}

              <Button
                type="button"
                size={votingOpen ? 'icon' : 'default'}
                variant={votingOpen ? 'secondary' : 'default'}
                onClick={() => setShowAddProposal(true)}
                className={
                  votingOpen
                    ? 'h-10 w-14 rounded-2xl bg-accent/15 hover:bg-accent/25'
                    : 'flex-1 h-10 rounded-2xl px-6'
                }
                disabled={!canEditProposals}
                aria-label="Propose a dish"
              >
                <Plus className={votingOpen ? 'h-5 w-5' : 'h-5 w-5 mr-2'} />
                {!votingOpen ? 'Propose a Dish' : null}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
