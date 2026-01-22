import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MealType } from '@/types'
import { MEAL_TYPE_ICONS } from '../constants'

interface MealCardProps {
  meal: {
    id: string
    mealType: MealType
    status: 'PLANNING' | 'LOCKED' | 'COMPLETED'
    scheduledFor?: string
    proposalCount?: number
    selectedDishName?: string
    selectedDishImage?: string
    constraints?: {
      maxBudget?: number
      maxPrepTime?: number
      servings?: number
      dietaryRestrictions?: string[]
      cuisinePreferences?: string[]
    }
  }
  onClick?: () => void
}

export function MealCard({ meal, onClick }: MealCardProps) {
  // Determine dynamic status text
  const getStatusText = () => {
    if (meal.status === 'PLANNING') {
      if (!meal.proposalCount || meal.proposalCount === 0) {
        return 'Awaiting Proposals'
      }
      return 'Voting Open'
    }
    if (meal.status === 'LOCKED') {
      return 'Voting Closed'
    }
    if (meal.status === 'COMPLETED') {
      return 'Completed'
    }
    return 'Planning'
  }

  const getStatusSubtext = () => {
    if (meal.status === 'PLANNING') {
      if (!meal.proposalCount || meal.proposalCount === 0) {
        return 'Click to add meal suggestions'
      }
      return `${meal.proposalCount} proposal${meal.proposalCount > 1 ? 's' : ''} • Click to vote`
    }
    if (meal.status === 'LOCKED') {
      return 'Meal has been decided'
    }
    if (meal.status === 'COMPLETED') {
      return 'This meal is complete'
    }
    return 'Click to view details'
  }

  // Show "Awaiting Proposals" state for PLANNING meals without a selected dish
  if (meal.status === 'PLANNING' && !meal.selectedDishName) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow bg-muted/10"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Meal Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex items-center justify-center text-4xl">
                {MEAL_TYPE_ICONS[meal.mealType]}
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-semibold text-base mb-1">
                {getStatusText()}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {getStatusSubtext()}
              </p>
              
              {/* Show constraints as badges */}
              {meal.constraints && (
                <div className="flex flex-wrap gap-1.5">
                  {meal.constraints.maxBudget && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ${meal.constraints.maxBudget}
                    </Badge>
                  )}
                  {meal.constraints.maxPrepTime && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      {meal.constraints.maxPrepTime}m
                    </Badge>
                  )}
                  {meal.constraints.cuisinePreferences?.map((cuisine) => (
                    <Badge key={cuisine} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show selected dish if available
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Meal Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
              {meal.selectedDishImage ? (
                <img 
                  src={meal.selectedDishImage} 
                  alt={meal.selectedDishName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {MEAL_TYPE_ICONS[meal.mealType]}
                </div>
              )}
            </div>
          </div>

          {/* Meal Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-2">
              {meal.selectedDishName}
            </h3>

            {/* Tags/Badges */}
            <div className="flex flex-wrap gap-1.5">
              {meal.constraints?.maxBudget && (
                <Badge variant="secondary" className="text-xs font-medium bg-green-50 text-green-700">
                  ${meal.constraints.maxBudget}
                </Badge>
              )}
              {meal.constraints?.maxPrepTime && (
                <Badge variant="secondary" className="text-xs font-medium bg-orange-50 text-orange-700">
                  {meal.constraints.maxPrepTime}m
                </Badge>
              )}
              {meal.constraints?.servings && (
                <Badge variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700">
                  {meal.constraints.servings} servings
                </Badge>
              )}
              {meal.status === 'LOCKED' && (
                <Badge variant="secondary" className="text-xs font-medium bg-green-50 text-green-700">
                  Confirmed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
