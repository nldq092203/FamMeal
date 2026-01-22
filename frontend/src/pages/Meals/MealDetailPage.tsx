import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Plus, Timer, Pencil, Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageShell } from '@/components/Layout'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'
import { useFamily } from '@/context/FamilyContext'
import { useState } from 'react'
import { AddProposalDialog } from './components/AddProposalDialog'
import { MEAL_TYPE_LABELS, MEAL_TYPE_TIMES } from './constants'
import { getAvatarSrc } from '@/assets/avatars'
import { useAuth } from '@/context/AuthContext'
import { EditProposalDialog } from './components/EditProposalDialog'
import { ProposalRankings } from './components/ProposalRankings'
import { RankProposalsDialog } from './components/RankProposalsDialog'
import type { Proposal } from '@/types'

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
  const [showAddProposal, setShowAddProposal] = useState(false)
  const [showEditProposal, setShowEditProposal] = useState(false)
  const [showVotingDialog, setShowVotingDialog] = useState(false)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)

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
  const mealDate = new Date(meal.date || meal.scheduledFor || new Date())
  const votingOpen = meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
  const canEditProposals = meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
  
  const currentFamily = families.find(f => f.id === familyId)
  const memberCount = currentFamily?.memberCount
  
  // Get default time for meal type
  const mealTime = MEAL_TYPE_TIMES[meal.mealType] || '12:00 PM'
  const endsInText = votingOpen && meal.votingClosedAt ? formatEndsIn(meal.votingClosedAt) : null
  
  // Determine voting status for rankings
  const hasVotes = proposals.some(p => p.voteStats.voteCount > 0)
  const votingStatus: 'active' | 'closed' | 'no-votes' = 
    !hasVotes ? 'no-votes' : 
    votingOpen ? 'active' : 'closed'
  const showRankings = proposals.length > 0 // Show rankings even without votes to encourage voting


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
            <div className="w-10"></div>
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

                <h1 className="text-4xl font-bold tracking-tight leading-[1.05]">
                  {mealDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  <br />
                  {MEAL_TYPE_LABELS[meal.mealType]}
                </h1>
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
            </div>

            {meal.constraints ? (
              <div className="mt-6 pt-5 border-t border-border/70">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Constraints</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meal.constraints.maxBudget ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-primary/10 text-foreground border-primary/25 px-3 py-1"
                    >
                      <span className="mr-1">$</span>Under ${meal.constraints.maxBudget}
                    </Badge>
                  ) : null}
                  {meal.constraints.maxPrepTime ? (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-accent/15 text-foreground border-accent/30 px-3 py-1"
                    >
                      <Timer className="h-3.5 w-3.5 mr-1.5" /> Max {meal.constraints.maxPrepTime}m
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
            
            {/* Vote Now Button - Show when voting is open */}
            {votingOpen && (
              <Button
                size="lg"
                onClick={() => setShowVotingDialog(true)}
                className="w-full h-12 rounded-xl"
              >
                <Vote className="h-5 w-5 mr-2" />
                Vote Now
              </Button>
            )}
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
            <div className="grid grid-cols-2 gap-3">
              {proposals.map((proposal) => {
                const imageUrl = proposal.extra?.imageUrls?.[0]
                const isOwner = Boolean(user?.id) && proposal.userId === user?.id
                const showEdit = canEditProposals && isOwner
                return (
                  <div key={proposal.id} className="rounded-2xl overflow-hidden border bg-card shadow-sm relative">
                    <div className="aspect-square bg-muted relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          No photo
                        </div>
                      )}

                      {showEdit ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 h-9 w-9 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm"
                          onClick={() => {
                            setEditingProposal(proposal)
                            setShowEditProposal(true)
                          }}
                          aria-label="Edit proposal"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    <div className="p-3">
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

        {/* Propose Button */}
        <div className="mt-6">
          <Button
            size="lg"
            onClick={() => setShowAddProposal(true)}
            className="w-full h-12 rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Propose a Dish
          </Button>
        </div>

        {id && (
          <AddProposalDialog
            open={showAddProposal}
            onOpenChange={setShowAddProposal}
            mealId={id}
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
    </div>
  )
}
