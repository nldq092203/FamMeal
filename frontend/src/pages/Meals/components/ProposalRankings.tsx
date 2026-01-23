import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProposalWithStats } from '@/types'
import { getAvatarSrc } from '@/assets/avatars'
import { useFamily } from '@/context/FamilyContext'

interface ProposalRankingsProps {
  proposals: ProposalWithStats[]
  votingStatus: 'active' | 'closed' | 'no-votes'
  className?: string
}

/**
 * Displays proposal rankings in a visually appealing podium-style layout
 */
export function ProposalRankings({ proposals, votingStatus, className = '' }: ProposalRankingsProps) {
  const { family } = useFamily()

  // Sort proposals by totalScore (descending)
  const sortedProposals = [...proposals].sort((a, b) => b.voteStats.totalScore - a.voteStats.totalScore)

  // Handle empty or no-votes state
  if (proposals.length === 0 || votingStatus === 'no-votes') {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-3">
          <Trophy className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No votes yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Rankings will appear once voting begins</p>
      </div>
    )
  }

  const top3 = sortedProposals.slice(0, 3)
  const rest = sortedProposals.slice(3)

  // Get member info for proposer
  const getProposerInfo = (userId: string) => {
    const member = family?.members?.find((m) => m.userId === userId)
    return {
      name: member?.name || 'Unknown',
      avatarId: member?.avatarId || 'panda',
    }
  }

  // Rank styling configurations
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          badgeClass: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-0 shadow-lg',
          icon: Trophy,
          iconClass: 'text-yellow-400',
          cardClass: 'ring-2 ring-yellow-400/30 bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10',
          height: 'h-40',
        }
      case 2:
        return {
          badgeClass: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white border-0 shadow-md',
          icon: Medal,
          iconClass: 'text-slate-400',
          cardClass: 'ring-2 ring-slate-300/30 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-800/20 dark:to-slate-900/10',
          height: 'h-32',
        }
      case 3:
        return {
          badgeClass: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white border-0 shadow-md',
          icon: Award,
          iconClass: 'text-orange-400',
          cardClass: 'ring-2 ring-orange-400/30 bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10',
          height: 'h-28',
        }
      default:
        return {
          badgeClass: 'bg-muted text-foreground',
          icon: null,
          iconClass: '',
          cardClass: 'bg-card border',
          height: 'auto',
        }
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {votingStatus === 'closed' ? 'Final Results' : 'Current Standings'}
        </h2>
        <Badge variant="outline" className="rounded-full">
          {sortedProposals.length} {sortedProposals.length === 1 ? 'entry' : 'entries'}
        </Badge>
      </div>

      {/* Top 3 Podium - Desktop: Side by side, Mobile: Vertical */}
      {top3.length > 0 && (
        <div className="mb-6">
          {/* Mobile: Vertical list */}
          <div className="flex flex-col gap-3 md:hidden">
            {top3.map((proposal, idx) => {
              const rank = idx + 1
              const style = getRankStyle(rank)
              const Icon = style.icon
              const proposer = getProposerInfo(proposal.userId)

              return (
                <div
                  key={proposal.id}
                  className={`rounded-2xl p-4 transition-all ${style.cardClass}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <Badge className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${style.badgeClass}`}>
                      {rank}
                    </Badge>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight truncate">
                            {proposal.dishName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <img
                              src={getAvatarSrc(proposer.avatarId)}
                              alt={proposer.name}
                              className="h-4 w-4 rounded-full"
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              by {proposer.name}
                            </span>
                          </div>
                        </div>
                        {Icon && <Icon className={`h-5 w-5 shrink-0 ${style.iconClass}`} />}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{proposal.voteStats.voteCount}</span>
                          <span className="text-muted-foreground">{proposal.voteStats.voteCount === 1 ? 'vote' : 'votes'}</span>
                        </div>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{proposal.voteStats.totalScore}</span>
                          <span className="text-muted-foreground">score</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: Podium layout with 2nd, 1st, 3rd ordering */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 items-end">
            {/* 2nd Place */}
            {top3[1] && (() => {
              const proposal = top3[1]
              const style = getRankStyle(2)
              const Icon = style.icon
              const proposer = getProposerInfo(proposal.userId)
              const imageUrl = proposal.extra?.imageUrls?.[0]

              return (
                <div className={`rounded-2xl overflow-hidden transition-all ${style.cardClass}`}>
                  {/* Image */}
                  {imageUrl && (
                    <div className="aspect-video bg-muted relative">
                      <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge className={`h-8 w-8 rounded-full flex items-center justify-center text-base font-bold ${style.badgeClass}`}>
                          2
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base leading-tight flex-1">
                        {proposal.dishName}
                      </h3>
                      {Icon && <Icon className={`h-5 w-5 shrink-0 ${style.iconClass}`} />}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={getAvatarSrc(proposer.avatarId)}
                        alt={proposer.name}
                        className="h-5 w-5 rounded-full"
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {proposer.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div>
                        <span className="font-semibold">{proposal.voteStats.voteCount}</span>
                        <span className="text-muted-foreground ml-1">{proposal.voteStats.voteCount === 1 ? 'vote' : 'votes'}</span>
                      </div>
                      <div className="h-3 w-px bg-border" />
                      <div>
                        <span className="font-semibold">{proposal.voteStats.totalScore}</span>
                        <span className="text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 1st Place */}
            {top3[0] && (() => {
              const proposal = top3[0]
              const style = getRankStyle(1)
              const Icon = style.icon
              const proposer = getProposerInfo(proposal.userId)
              const imageUrl = proposal.extra?.imageUrls?.[0]

              return (
                <div className={`rounded-2xl overflow-hidden transition-all ${style.cardClass}`}>
                  {/* Image */}
                  {imageUrl && (
                    <div className="aspect-video bg-muted relative">
                      <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${style.badgeClass}`}>
                          1
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-lg leading-tight flex-1">
                        {proposal.dishName}
                      </h3>
                      {Icon && <Icon className={`h-6 w-6 shrink-0 ${style.iconClass}`} />}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <img
                        src={getAvatarSrc(proposer.avatarId)}
                        alt={proposer.name}
                        className="h-6 w-6 rounded-full ring-2 ring-yellow-400/30"
                      />
                      <span className="text-sm text-muted-foreground truncate font-medium">
                        {proposer.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-base">
                      <div>
                        <span className="font-bold text-lg">{proposal.voteStats.voteCount}</span>
                        <span className="text-muted-foreground ml-1.5">{proposal.voteStats.voteCount === 1 ? 'vote' : 'votes'}</span>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div>
                        <span className="font-bold text-lg">{proposal.voteStats.totalScore}</span>
                        <span className="text-muted-foreground ml-1.5">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 3rd Place */}
            {top3[2] && (() => {
              const proposal = top3[2]
              const style = getRankStyle(3)
              const Icon = style.icon
              const proposer = getProposerInfo(proposal.userId)
              const imageUrl = proposal.extra?.imageUrls?.[0]

              return (
                <div className={`rounded-2xl overflow-hidden transition-all ${style.cardClass}`}>
                  {/* Image */}
                  {imageUrl && (
                    <div className="aspect-video bg-muted relative">
                      <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge className={`h-8 w-8 rounded-full flex items-center justify-center text-base font-bold ${style.badgeClass}`}>
                          3
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base leading-tight flex-1">
                        {proposal.dishName}
                      </h3>
                      {Icon && <Icon className={`h-5 w-5 shrink-0 ${style.iconClass}`} />}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={getAvatarSrc(proposer.avatarId)}
                        alt={proposer.name}
                        className="h-5 w-5 rounded-full"
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {proposer.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div>
                        <span className="font-semibold">{proposal.voteStats.voteCount}</span>
                        <span className="text-muted-foreground ml-1">{proposal.voteStats.voteCount === 1 ? 'vote' : 'votes'}</span>
                      </div>
                      <div className="h-3 w-px bg-border" />
                      <div>
                        <span className="font-semibold">{proposal.voteStats.totalScore}</span>
                        <span className="text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Rest of proposals (4th+) */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Other Proposals
          </h3>
          {rest.map((proposal, idx) => {
            const rank = idx + 4
            const proposer = getProposerInfo(proposal.userId)
            const imageUrl = proposal.extra?.imageUrls?.[0]

            return (
              <div
                key={proposal.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center font-semibold shrink-0">
                  {rank}
                </Badge>

                {/* Image thumbnail */}
                {imageUrl && (
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={imageUrl} alt={proposal.dishName} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight truncate">
                    {proposal.dishName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={getAvatarSrc(proposer.avatarId)}
                      alt={proposer.name}
                      className="h-3.5 w-3.5 rounded-full"
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {proposer.name}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="text-right">
                    <div className="font-semibold">{proposal.voteStats.voteCount}</div>
                    <div className="text-muted-foreground">{proposal.voteStats.voteCount === 1 ? 'vote' : 'votes'}</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-right">
                    <div className="font-semibold">{proposal.voteStats.totalScore}</div>
                    <div className="text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
