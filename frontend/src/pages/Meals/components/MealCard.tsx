import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChefHat, CheckCircle2, Award, Calendar, Clock } from 'lucide-react'
import type { MealType } from '@/types'
import { MEAL_TYPE_ICONS } from '../constants'

interface MealCardProps {
  meal: {
    id: string
    mealType: MealType
    status: 'PLANNING' | 'LOCKED' | 'COMPLETED'
    scheduledFor?: string
    date?: string
    mealDateTime?: string
    mealTime?: string
    proposalCount?: number
    selectedDishName?: string
    selectedDishImage?: string
    cookUserId?: string
    cookName?: string
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

// Helper function to check if a meal is outdated (older than 3 hours)
function isOutdatedMeal(scheduledFor?: string): boolean {
  if (!scheduledFor) return false
  const mealTime = new Date(scheduledFor)
  const now = new Date()
  const threeHoursMs = 3 * 60 * 60 * 1000
  const timeDifference = now.getTime() - mealTime.getTime()
  return timeDifference > threeHoursMs
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

  const isOutdated = isOutdatedMeal(meal.scheduledFor)

  // Show "Awaiting Proposals" state for PLANNING meals without a selected dish
  if (meal.status === 'PLANNING' && !meal.selectedDishName) {
    return (
      <Card 
        className={`cursor-pointer transition-all overflow-hidden relative ${
          isOutdated 
            ? 'bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-stone-50/40 border-2 border-slate-300/40 shadow-sm' 
            : 'hover:shadow-md bg-muted/10'
        }`}
        onClick={onClick}
      >
        {/* Outdated meal overlay effects */}
        {isOutdated && (
          <>
            {/* Faded overlay */}
            <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-[1px] pointer-events-none rounded-lg" />
            
            {/* Subtle diagonal lines pattern */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-lg"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  135deg,
                  transparent,
                  transparent 8px,
                  currentColor 8px,
                  currentColor 10px
                )`
              }}
            />
            
            {/* Clock icon badge */}
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <Clock className="h-4 w-4 text-slate-500/70" />
            </div>
          </>
        )}

        <CardContent className="p-4 relative">
          <div className="flex gap-4">
            {/* Meal Icon */}
            <div className="flex-shrink-0 relative">
              <div className={`w-24 h-24 rounded-xl overflow-hidden bg-muted flex items-center justify-center text-4xl transition-all ${
                isOutdated ? 'grayscale-[60%] opacity-60 blur-[1px]' : ''
              }`}>
                {MEAL_TYPE_ICONS[meal.mealType]}
              </div>
              {/* Clock overlay on outdated icon */}
              {isOutdated && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <Clock className="h-8 w-8 text-slate-600/50" strokeWidth={2} />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`font-semibold text-base ${
                  isOutdated ? 'text-muted-foreground/70' : ''
                }`}>
                  {getStatusText()}
                </h3>
                {isOutdated && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-semibold bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-300/50 flex items-center gap-1 flex-shrink-0 shadow-sm"
                  >
                    <Clock className="h-3 w-3" />
                    Expired
                  </Badge>
                )}
              </div>
              <p className={`text-sm mb-2 ${
                isOutdated ? 'text-muted-foreground/60' : 'text-muted-foreground'
              }`}>
                {getStatusSubtext()}
              </p>
              
              {/* Show constraints as badges */}
              {meal.constraints && (
                <div className={`flex flex-wrap gap-1.5 transition-opacity ${isOutdated ? 'opacity-60' : ''}`}>
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
  const isCompleted = meal.status === 'COMPLETED'
  
  return (
    <Card 
      className={`cursor-pointer transition-all overflow-hidden relative ${
        isCompleted 
          ? 'bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/40 border-2 border-green-200/50 shadow-sm' 
          : isOutdated
          ? 'bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-stone-50/40 border-2 border-slate-300/40 shadow-sm'
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {/* Completed meal overlay effects */}
      {isCompleted && (
        <>
          {/* Blurred background overlay */}
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] pointer-events-none rounded-lg" />
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-lg"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                currentColor 10px,
                currentColor 11px
              )`
            }}
          />
          
          {/* Corner ribbon/badge */}
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-green-500/20 rounded-tr-lg pointer-events-none" />
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <Award className="h-4 w-4 text-green-600/80" />
          </div>
        </>
      )}

      {/* Outdated meal overlay effects */}
      {isOutdated && !isCompleted && (
        <>
          {/* Faded overlay */}
          <div className="absolute inset-0 bg-slate-100/20 backdrop-blur-[1px] pointer-events-none rounded-lg" />
          
          {/* Subtle diagonal lines pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-lg"
            style={{
              backgroundImage: `repeating-linear-gradient(
                135deg,
                transparent,
                transparent 8px,
                currentColor 8px,
                currentColor 10px
              )`
            }}
          />
          
          {/* Clock icon badge */}
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <Clock className="h-4 w-4 text-slate-500/70" />
          </div>
        </>
      )}
      
      <CardContent className={`p-4 relative ${isCompleted || isOutdated ? '' : ''}`}>
        <div className="flex gap-4">
          {/* Meal Image */}
          <div className="flex-shrink-0 relative">
            <div className={`w-24 h-24 rounded-xl overflow-hidden bg-muted transition-all ${
              isCompleted ? 'grayscale-[30%] opacity-75 blur-[1.5px] ring-2 ring-green-200/50' : isOutdated ? 'grayscale-[60%] opacity-60 blur-[1px] ring-2 ring-slate-300/40' : ''
            }`}>
              {meal.selectedDishImage ? (
                <img 
                  src={meal.selectedDishImage} 
                  alt={meal.selectedDishName}
                  className={`w-full h-full object-cover ${isCompleted ? 'scale-105' : isOutdated ? 'scale-100' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {MEAL_TYPE_ICONS[meal.mealType]}
                </div>
              )}
            </div>
            {/* Checkmark overlay on image */}
            {isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-green-600/60" strokeWidth={2.5} />
              </div>
            )}
            {/* Clock overlay on outdated image */}
            {isOutdated && !isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-500/10 rounded-xl">
                <Clock className="h-8 w-8 text-slate-600/50" strokeWidth={2} />
              </div>
            )}
          </div>

          {/* Meal Info */}
          <div className="flex-1 min-w-0">
            {/* Date & Time Display */}
            {meal.mealDateTime && (
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar className={`h-3.5 w-3.5 ${isOutdated && !isCompleted ? 'text-slate-400' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${isOutdated && !isCompleted ? 'text-slate-500/70' : 'text-muted-foreground'}`}>
                  {meal.mealDateTime}
                </span>
              </div>
            )}
            
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-semibold text-base transition-colors ${
                isCompleted ? 'text-muted-foreground/80 line-through decoration-2 decoration-green-400/40' : isOutdated ? 'text-muted-foreground/70 line-through decoration-2 decoration-slate-300/40' : ''
              }`}>
                {meal.selectedDishName}
              </h3>
              {isCompleted && (
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300/50 flex items-center gap-1 flex-shrink-0 shadow-sm"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              )}
              {isOutdated && !isCompleted && (
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-300/50 flex items-center gap-1 flex-shrink-0 shadow-sm"
                >
                  <Clock className="h-3 w-3" />
                  Expired
                </Badge>
              )}
            </div>

            {/* Tags/Badges */}
            <div className={`flex flex-wrap gap-1.5 transition-opacity ${isCompleted || isOutdated ? 'opacity-60' : ''}`}>
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
              {meal.status === 'LOCKED' && !isCompleted && (
                <Badge variant="secondary" className="text-xs font-medium bg-green-50 text-green-700">
                  Confirmed
                </Badge>
              )}
              {meal.cookName && (
                <Badge variant="secondary" className="text-xs font-medium bg-purple-50 text-purple-700 flex items-center gap-1">
                  <ChefHat className="h-3 w-3" />
                  {meal.cookName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
