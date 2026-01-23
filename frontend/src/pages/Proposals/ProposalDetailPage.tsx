import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Clock, DollarSign, Star, Crown, Medal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'
import { useMyMealVotesQuery } from '@/query/hooks/useMyMealVotesQuery'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { getAvatarSrc } from '@/assets/avatars'
import { RankProposalsDialog } from '@/pages/Meals/components/RankProposalsDialog'

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [showVotingDialog, setShowVotingDialog] = useState(false)

  // Get mealId from navigation state
  const mealId = location.state?.mealId as string | undefined

  // Fetch meal summary to get proposal data
  const mealSummaryQuery = useMealSummaryQuery(mealId || null)
  const myVotesQuery = useMyMealVotesQuery(mealId || null, Boolean(mealId))
  
  const proposals = mealSummaryQuery.data?.proposals
  const proposal = proposals?.find((p) => p.id === id) ?? null

  const meal = mealSummaryQuery.data?.meal
  const allProposals = proposals ?? []
  
  // Determine if current user is the proposal owner
  const isOwner = Boolean(user?.id) && proposal?.userId === user?.id

  // Extract time and cost from meal constraints (dynamic values)
  const estimatedTime = meal?.constraints?.maxPrepTime 
    ? `${meal.constraints.maxPrepTime}M` 
    : meal?.constraints?.maxPrepTimeMinutes 
    ? `${meal.constraints.maxPrepTimeMinutes}M`
    : null
    
  const estimatedCost = meal?.constraints?.maxBudget 
    ? `${meal.constraints.maxBudget}` 
    : null

  if (mealSummaryQuery.isLoading || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 max-w-md w-full px-4">
          <div className="h-12 bg-muted rounded" />
          <div className="aspect-[4/3] bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const imageUrl = proposal.extra?.imageUrls?.[0]
  const hasMultipleImages = (proposal.extra?.imageUrls?.length || 0) > 1
  
  // Get rank position based on votes using voteSummary
  const voteSummary = mealSummaryQuery.data?.voteSummary || []
  const currentRank = voteSummary.findIndex(v => v.proposalId === proposal.id) + 1
  
  // Calculate star rating from averageRank (lower is better)
  // Convert averageRank (1-5, lower is better) to star rating (1-5, higher is better)
  // If averageRank is 1, stars should be 5; if averageRank is 5, stars should be 1
  const averageRank = proposal.voteStats?.averageRank || 0
  const starRating = averageRank > 0 ? Math.max(1, 6 - averageRank) : 0
  const voteCount = proposal.voteStats?.voteCount || 0

  const votingOpen =
    meal?.status === 'PLANNING' && (!meal?.votingClosedAt || new Date(meal.votingClosedAt) > new Date())

  const myVotes = (myVotesQuery.data ?? []).map((v) => ({ proposalId: v.proposalId, rankPosition: v.rankPosition }))

  const myRankForThisProposal =
    proposal.myVote?.rankPosition ?? myVotes.find((v) => v.proposalId === proposal.id)?.rankPosition ?? null
  
  // Format meal title for voting dialog
  const mealDate = meal?.date ? new Date(meal.date) : new Date()
  const mealTitle = meal ? 
    `${mealDate.toLocaleDateString('en-US', { weekday: 'long' })} ${meal.mealType.charAt(0) + meal.mealType.slice(1).toLowerCase()}` : 
    'Meal'

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="app-frame py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="flex-1 px-2 text-center font-semibold text-lg truncate">{proposal.dishName}</h2>
          <button className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="app-frame">
        {/* Hero Image Section */}
        <div className="relative aspect-[4/3] bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={proposal.dishName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
          
          {/* Improved visibility badges with darker backgrounds */}
          <div className="absolute top-4 right-4 flex gap-2">
            {estimatedTime && (
              <Badge className="bg-black/70 text-white border-0 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-lg">
                <Clock className="h-3 w-3" />
                {estimatedTime}
              </Badge>
            )}
            {estimatedCost && (
              <Badge className="bg-black/70 text-white border-0 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-lg">
                <DollarSign className="h-3 w-3" />
                {estimatedCost}
              </Badge>
            )}
          </div>
        </div>

        {/* Proposer Info */}
        <div className="px-4 py-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarSrc(proposal.userName || 'default')}
              alt={proposal.userName || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <span className="font-semibold block">
                {isOwner ? 'Proposed by You' : `Proposed by ${proposal.userName || 'Member'}`}
              </span>
              {currentRank > 0 && (
                <span className="text-xs text-muted-foreground">
                  Currently ranked #{currentRank} of {allProposals.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{starRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">({voteCount})</span>
          </div>
        </div>

        {/* Current Ranking Display - Shows position among top proposals */}
        <div className="px-4 py-6 bg-card/50">
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-xl mb-1">Current Ranking</h2>
              <p className="text-sm text-muted-foreground">
                This proposal's position among all submissions
              </p>
            </div>

            {/* Visual ranking display with top proposals */}
            <div className="flex items-end justify-center gap-3 py-4">
              {voteSummary.slice(0, 5).map((votedProposal, index) => {
                const rank = index + 1
                const isCurrentProposal = votedProposal.proposalId === proposal.id
                const proposalData = allProposals.find(p => p.id === votedProposal.proposalId)
                const imageUrl = proposalData?.extra?.imageUrls?.[0]
                
                // Get rank icon and colors based on position
                const getRankIcon = () => {
                  if (rank === 1) return <Crown className="h-5 w-5" />
                  if (rank === 2) return <Star className="h-4 w-4" />
                  if (rank === 3) return <Medal className="h-4 w-4" />
                  return null
                }
                
                // Nude color palette
                const getRankColors = () => {
                  if (isCurrentProposal) {
                    return {
                      bg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
                      border: 'border-emerald-300',
                      text: 'text-emerald-800',
                      ring: 'ring-emerald-200',
                    }
                  }
                  if (rank === 1) {
                    return {
                      bg: 'bg-gradient-to-br from-amber-100 to-yellow-100',
                      border: 'border-amber-300',
                      text: 'text-amber-900',
                      ring: 'ring-amber-200',
                    }
                  }
                  if (rank === 2) {
                    return {
                      bg: 'bg-gradient-to-br from-slate-100 to-gray-100',
                      border: 'border-slate-300',
                      text: 'text-slate-700',
                      ring: 'ring-slate-200',
                    }
                  }
                  if (rank === 3) {
                    return {
                      bg: 'bg-gradient-to-br from-orange-100 to-amber-50',
                      border: 'border-orange-300',
                      text: 'text-orange-800',
                      ring: 'ring-orange-200',
                    }
                  }
                  return {
                    bg: 'bg-gradient-to-br from-stone-50 to-neutral-100',
                    border: 'border-stone-200',
                    text: 'text-stone-600',
                    ring: 'ring-stone-100',
                  }
                }
                
                const colors = getRankColors()
                const rankIcon = getRankIcon()
                
                return (
                  <div
                    key={votedProposal.proposalId}
                    className="relative flex flex-col items-center transition-all group"
                  >
                    {/* Ranking Circle with image background */}
                    <div
                      className={`
                        relative rounded-full flex items-center justify-center font-bold
                        transition-all duration-300 ease-out
                        border-2 shadow-md
                        group-hover:scale-110 group-hover:shadow-xl group-hover:ring-4
                        ${colors.bg} ${colors.border} ${colors.text} ${colors.ring}
                        ${
                          isCurrentProposal
                            ? 'h-20 w-20 text-xl ring-4 shadow-lg'
                            : rank === 1
                            ? 'h-16 w-16 text-lg'
                            : 'h-14 w-14 text-base'
                        }
                      `}
                    >
                      {/* Background image with overlay */}
                      {imageUrl && (
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={votedProposal.dishName} 
                            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" 
                          />
                        </div>
                      )}
                      
                      {/* Rank number or icon */}
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        {rankIcon && (
                          <div className="mb-0.5 group-hover:scale-110 transition-transform">
                            {rankIcon}
                          </div>
                        )}
                        <span className={rankIcon ? 'text-sm' : ''}>{rank}</span>
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        text-xs font-medium text-center max-w-[60px] truncate mt-2
                        transition-colors duration-200
                        ${isCurrentProposal ? 'text-emerald-700 font-semibold' : 'text-stone-600 group-hover:text-stone-900'}
                      `}
                    >
                      {isCurrentProposal ? 'This Dish' : votedProposal.dishName}
                    </span>
                    
                    {/* Vote count badge */}
                    {votedProposal.voteCount > 0 && (
                      <span className="text-xs text-muted-foreground mt-1 transition-opacity group-hover:opacity-100 opacity-70">
                        {votedProposal.voteCount} vote{votedProposal.voteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )
              })}
              
              {/* Show ellipsis if there are more proposals */}
              {allProposals.length > 5 && (
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center text-muted-foreground bg-stone-50 border border-stone-200">
                    ...
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">
                    +{allProposals.length - 5}
                  </span>
                </div>
              )}
            </div>

            {/* Stats summary */}
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              {voteCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {voteCount} vote{voteCount !== 1 ? 's' : ''} received • Average rank: {averageRank.toFixed(1)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No votes yet for this proposal
                </p>
              )}
            </div>

            {/* My vote */}
            {myRankForThisProposal ? (
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Your vote</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You ranked this dish <span className="font-semibold text-foreground">#{myRankForThisProposal}</span>.
                    </p>
                    {votingOpen ? (
                      <p className="text-xs text-muted-foreground mt-1">Want to change? Update your ranking.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Voting is closed.</p>
                    )}
                  </div>

                  {votingOpen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setShowVotingDialog(true)}
                    >
                      Change
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Ingredients + Notes */}
        <div className="px-4 py-6 space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <span className="text-base">🧄</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</div>
                <div className="text-sm text-muted-foreground">What you’ll need</div>
              </div>
            </div>
            <div className="mt-3 text-sm leading-relaxed">
              {proposal.ingredients ? (
                <p className="text-foreground">{proposal.ingredients}</p>
              ) : (
                <p className="text-muted-foreground">No ingredients provided.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-accent/15 flex items-center justify-center" aria-hidden="true">
                <span className="text-base">📝</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
                <div className="text-sm text-muted-foreground">Preferences & tips</div>
              </div>
            </div>
            <div className="mt-3 text-sm leading-relaxed">
              {proposal.notes ? (
                <p className="text-foreground">{proposal.notes}</p>
              ) : (
                <p className="text-muted-foreground">No notes provided.</p>
              )}
            </div>
          </div>

          {hasMultipleImages ? (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">More Photos</div>
                  <div className="text-sm text-muted-foreground">Additional images</div>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {(proposal.extra?.imageUrls?.length ?? 1) - 1}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {proposal.extra?.imageUrls?.slice(1).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${proposal.dishName} ${idx + 2}`}
                    className="aspect-square object-cover rounded-xl border"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Voting Dialog */}
      {mealId && (
        <RankProposalsDialog
          open={showVotingDialog}
          onOpenChange={setShowVotingDialog}
          mealId={mealId}
          mealTitle={mealTitle}
          proposals={allProposals}
        />
      )}
    </div>
  )
}
