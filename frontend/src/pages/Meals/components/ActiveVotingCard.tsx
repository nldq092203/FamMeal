import { X, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAvatarSrc, type AvatarId } from '@/assets/avatars'
import type { MealType } from '@/types'
import { MEAL_TYPE_LABELS } from '../constants'

interface ActiveVotingCardProps {
  meal: {
    id: string
    title: string
    description?: string
    imageUrl?: string
    mealType: MealType
    votesNeeded: number
    currentVotes: number
    voters: Array<{ id: string; avatarId: AvatarId; name: string }>
  }
  onVote: (mealId: string) => void
  onDismiss: () => void
}

// Generate contextual meal type label with time reference
const getMealTypeLabel = (mealType: MealType): string => {
  const timeContexts: Record<MealType, string> = {
    BREAKFAST: "This Morning's",
    BRUNCH: "Today's",
    LUNCH: "Today's",
    DINNER: "Tonight's",
    SNACK: "Today's",
    OTHER: "Upcoming"
  }
  const context = timeContexts[mealType] || "Upcoming"
  const label = MEAL_TYPE_LABELS[mealType] || "Meal"
  return `${context} ${label}`
}

export function ActiveVotingCard({ meal, onVote, onDismiss }: ActiveVotingCardProps) {
  const remainingVotes = meal.votesNeeded - meal.currentVotes

  return (
    <Card className="overflow-hidden relative">
      <CardContent className="p-0">
        {/* Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-primary text-primary-foreground shadow-md">
            🔥 Voting Open
          </Badge>
        </div>

        {/* Meal Image with Gradient Overlay */}
        <div className="relative h-48 overflow-hidden">
          {meal.imageUrl ? (
            <img 
              src={meal.imageUrl} 
              alt={meal.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-green-500/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
          
          {/* Meal Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs text-white/80 mb-1">{getMealTypeLabel(meal.mealType)}</p>
            <h3 className="text-xl font-bold text-white">{meal.title}</h3>
            {meal.description && (
              <p className="text-sm text-white/90 mt-1">{meal.description}</p>
            )}
          </div>
        </div>

        {/* Voters and Vote Count */}
        <div className="px-4 py-3 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            {/* Voter Avatars */}
            <div className="flex -space-x-2">
              {meal.voters.slice(0, 3).map((voter) => (
                <img
                  key={voter.id}
                  src={getAvatarSrc(voter.avatarId)}
                  alt={voter.name}
                  className="h-8 w-8 rounded-full border-2 border-background"
                  title={voter.name}
                />
              ))}
              {meal.voters.length > 3 && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{meal.voters.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Votes Needed */}
          <p className="text-sm text-muted-foreground">
            {remainingVotes} {remainingVotes === 1 ? 'vote' : 'votes'} needed
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 flex gap-2">
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
            onClick={() => onVote(meal.id)}
          >
            <Check className="h-5 w-5 mr-2" />
            View & Rank Proposals
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={onDismiss}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
