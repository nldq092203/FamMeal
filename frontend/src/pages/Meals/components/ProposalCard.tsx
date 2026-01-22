import { ThumbsUp, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Proposal } from '@/types'

interface ProposalCardProps {
  proposal: Proposal
  voteCount?: number
  myVote?: { id: string; rankPosition: number }
  onVote?: (proposalId: string, rank: number) => void
  onDelete?: (proposalId: string) => void
  isAdmin?: boolean
  votingClosed?: boolean
}

export function ProposalCard({
  proposal,
  voteCount = 0,
  myVote,
  onVote,
  onDelete,
  isAdmin,
  votingClosed
}: ProposalCardProps) {
  const hasVoted = !!myVote

  return (
    <Card className={`${hasVoted ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base">{proposal.dishName}</h4>
              {proposal.ingredients && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {proposal.ingredients}
                </p>
              )}
            </div>
            
            {/* Vote Count Badge */}
            {voteCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {voteCount}
              </Badge>
            )}
          </div>

          {/* Notes */}
          {proposal.notes && (
            <p className="text-sm text-muted-foreground italic">
              "{proposal.notes}"
            </p>
          )}

          {/* Images */}
          {proposal.extra?.imageUrls && proposal.extra.imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {proposal.extra.imageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${proposal.dishName} ${idx + 1}`}
                  className="h-20 w-20 rounded object-cover"
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!votingClosed && onVote && (
              <Button
                size="sm"
                variant={hasVoted ? 'default' : 'outline'}
                onClick={() => onVote(proposal.id, 1)}
                className="flex-1"
              >
                {hasVoted ? (
                  <>
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    Voted
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Vote
                  </>
                )}
              </Button>
            )}
            
            {isAdmin && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(proposal.id)}
                className="text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            )}
          </div>

          {/* My Vote Indicator */}
          {hasVoted && (
            <div className="text-xs text-primary font-medium">
              ✓ You voted for this proposal
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
