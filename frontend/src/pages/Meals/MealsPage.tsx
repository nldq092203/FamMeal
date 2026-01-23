import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useFamily } from '@/context/FamilyContext'
import { useAuth } from '@/context/AuthContext'
import { AdminOnly } from '@/components/PermissionGate'
import { PageShell } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { ActiveVotingCard } from './components/ActiveVotingCard'
import { WeeklyCalendar } from './components/WeeklyCalendar'
import { FullCalendarSheet, type DateRange } from './components/FullCalendarSheet'
import { MealCard } from './components/MealCard'
import { CreateMealDialog } from './components/CreateMealDialog'
import type { AvatarId } from '@/assets/avatars'
import { getAvatarSrc } from '@/assets/avatars'
import type { Family, Meal, MealSummary, MealType } from '@/types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_TIMES } from './constants'
import { formatLocalDateParam } from '@/query/format'
import { useMealsQuery } from '@/query/hooks/useMealsQuery'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'

// Meal type ordering for chronological sorting
const MEAL_TYPE_ORDER: MealType[] = ['BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'SNACK']

/**
 * Meals page - Dashboard showing active voting and upcoming meals
 */
function computeVotingData(input: {
  activeVoting: Meal | null
  activeMealSummary: MealSummary | null
  members: NonNullable<Family['members']> | null
}) {
  const { activeVoting, activeMealSummary, members } = input
  if (!activeVoting || !activeMealSummary || !members) return null

  const proposals = activeMealSummary.proposals.slice()
  const totalMembers = members.length

  const uniqueVoterIds = new Set<string>()
  proposals.forEach((proposal) => {
    if (proposal.voteStats.voteCount > 0) uniqueVoterIds.add(proposal.userId)
  })

  const currentVotes = uniqueVoterIds.size
  const votesNeeded = totalMembers - currentVotes

  const voters = Array.from(uniqueVoterIds)
    .map((userId) => {
      const member = members.find((m) => m.userId === userId)
      if (!member) return null
      return {
        id: member.userId,
        avatarId: (member.avatarId as AvatarId) || 'panda',
        name: member.name,
      }
    })
    .filter((v): v is { id: string; avatarId: AvatarId; name: string } => v !== null)

  const leadingProposal =
    proposals.length > 0
      ? proposals
          .slice()
          .sort((a, b) => b.voteStats.totalScore - a.voteStats.totalScore)[0]
      : null

  return {
    totalMembers,
    currentVotes,
    votesNeeded,
    voters,
    leadingProposal,
    proposalCount: proposals.length,
  }
}

export default function MealsPage() {
  const { family } = useFamily()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showCreateMeal, setShowCreateMeal] = useState(false)
  const [showLimit, setShowLimit] = useState(10)
  
  // Default: Always fetch 1 week from today (one time fetch)
  const defaultWeekRange = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setDate(today.getDate() + 6) // 7 days total (today + 6 more)
    end.setHours(23, 59, 59, 999)
    return { start: today, end }
  }, [])

  // Selected days for filtering (set of date strings)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  
  // Current week start date for the calendar
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = today.getDate() - today.getDay() // Sunday-start
    const weekStart = new Date(today)
    weekStart.setDate(diff)
    return weekStart
  })

  // FullCalendarSheet state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarSelectionMode, setCalendarSelectionMode] = useState<'day' | 'range'>('day')
  const [calendarRange, setCalendarRange] = useState<DateRange>({ start: null, end: null })

  // Always fetch 1 week of meals (one time)
  const mealsQuery = useMealsQuery({
    familyId: family?.id ?? null,
    startDate: formatLocalDateParam(defaultWeekRange.start),
    endDate: formatLocalDateParam(defaultWeekRange.end),
  })

  // Sort meals in descending order by date (newest first)
  const sortedMeals = useMemo(() => {
    const meals = mealsQuery.data ?? []
    return [...meals].sort((a, b) => {
      const dateA = new Date(a.scheduledFor || a.date || 0).getTime()
      const dateB = new Date(b.scheduledFor || b.date || 0).getTime()
      // Descending order (newest first)
      return dateB - dateA
    })
  }, [mealsQuery.data])

  // Frontend filtering by selected days
  const filteredMeals = useMemo(() => {
    if (selectedDays.size === 0) {
      return sortedMeals
    }

    return sortedMeals.filter((meal) => {
      const mealDate = new Date(meal.scheduledFor || meal.date || new Date())
      const mealDateString = mealDate.toDateString()
      return selectedDays.has(mealDateString)
    })
  }, [sortedMeals, selectedDays])
  
  // Handle day selection toggle
  const handleDayToggle = (date: Date) => {
    const dateString = date.toDateString()
    setSelectedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(dateString)) {
        newSet.delete(dateString)
      } else {
        newSet.add(dateString)
      }
      return newSet
    })
  }
  
  // Clear all selected days
  const handleClearFilter = () => {
    setSelectedDays(new Set())
  }

  // Handle FullCalendarSheet date selection
  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date)
    handleDayToggle(date)
  }

  // Handle FullCalendarSheet range selection
  const handleCalendarRangeChange = (range: DateRange) => {
    setCalendarRange(range)
    
    // Convert range to selected days set
    if (range.start && range.end) {
      const newSelectedDays = new Set<string>()
      const start = new Date(range.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(range.end)
      end.setHours(0, 0, 0, 0)
      
      const current = new Date(start)
      while (current <= end) {
        newSelectedDays.add(current.toDateString())
        current.setDate(current.getDate() + 1)
      }
      
      setSelectedDays(newSelectedDays)
    } else if (range.start) {
      // Only start date selected
      const dateString = range.start.toDateString()
      setSelectedDays((prev) => {
        const newSet = new Set(prev)
        if (!newSet.has(dateString)) {
          newSet.add(dateString)
        }
        return newSet
      })
    }
  }

  // Limit meals display
  const displayedMeals = filteredMeals.slice(0, showLimit)
  const hasMoreMeals = filteredMeals.length > showLimit

  // Find the most upcoming meal with active voting
  const activeVoting = sortedMeals
    .filter(
      (meal) =>
        meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
    )
    .sort((a, b) => {
      const dateA = new Date(a.scheduledFor || a.date || 0).getTime()
      const dateB = new Date(b.scheduledFor || b.date || 0).getTime()
      
      // If dates are different, sort by date (ascending for upcoming)
      if (dateA !== dateB) {
        return dateA - dateB
      }
      
      // If dates are the same, sort by meal type order (breakfast first, dinner last)
      return MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType)
    })[0]

  // Fetch meal summary for the active voting meal
  const activeMealSummaryQuery = useMealSummaryQuery(activeVoting?.id ?? null)
  const activeMealSummary = activeMealSummaryQuery.data

  // Calculate dynamic voting statistics
  const votingData = computeVotingData({
    activeVoting: activeVoting ?? null,
    activeMealSummary: activeMealSummary ?? null,
    members: family?.members ?? null,
  })

  const handleVote = async (mealId: string) => {
    // Navigate to meal detail page for ranked-choice voting
    navigate(`/meals/${mealId}`)
  }

  const displayName = user?.name || user?.username || 'there'
  const firstName = displayName.split(' ')[0] || displayName

  // Group displayed meals by date, then by type
  const mealsByDate = useMemo(() => {
    const grouped: Record<string, Record<MealType, typeof displayedMeals>> = {}
    
    displayedMeals.forEach((meal) => {
      const mealDate = new Date(meal.scheduledFor || meal.date || new Date())
      const dateKey = mealDate.toDateString()
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {} as Record<MealType, typeof displayedMeals>
      }
      
      if (!grouped[dateKey][meal.mealType]) {
        grouped[dateKey][meal.mealType] = []
      }
      
      grouped[dateKey][meal.mealType].push(meal)
    })
    
    return grouped
  }, [displayedMeals])

  // Sort dates in descending order (newest first)
  const sortedDates = useMemo(() => {
    return Object.keys(mealsByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime()
    })
  }, [mealsByDate])

  // Helper function to format date
  const formatMealDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    if (dateOnly.getTime() === today.getTime()) {
      return 'Today'
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  // Helper function to format date and time
  const formatMealDateTime = (meal: Meal) => {
    const mealDate = new Date(meal.scheduledFor || meal.date || new Date())
    const dateStr = formatMealDate(mealDate.toDateString())
    const timeStr = mealDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return `${dateStr} • ${timeStr}`
  }



  return (
    <div className="min-h-screen bg-background">
      <PageShell className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {defaultWeekRange.start.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} - {defaultWeekRange.end.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <h1 className="t-display mt-2 text-heading truncate">Hello, {firstName}!</h1>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {/* Desktop: create meal action belongs in the header (same action, different layout) */}
            <AdminOnly>
              <Button
                size="icon"
                variant="outline"
                className="hidden lg:inline-flex h-11 w-11 rounded-full border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/15 to-accent/20 hover:from-primary/20 hover:to-accent/25 hover:border-primary/60 shadow-sm"
                onClick={() => setShowCreateMeal(true)}
                aria-label="Create Meal"
              >
                <Plus className="h-5 w-5 text-primary" />
              </Button>
            </AdminOnly>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="h-12 w-12 rounded-full border-2 border-card bg-card overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open settings"
            >
              <img
                src={getAvatarSrc(user?.avatarId)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {mealsQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-[340px] bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
              {/* Meals (left on desktop) */}
              <div className="order-2 lg:order-1 flex-1 min-w-0 space-y-6 mt-8 lg:mt-0">
                {/* Weekly Calendar with Day Selection */}
                <div className="space-y-3">
                  <WeeklyCalendar
                    weekStart={currentWeekStart}
                    selectedDays={selectedDays}
                    onDayToggle={handleDayToggle}
                    onWeekChange={setCurrentWeekStart}
                    onOpenFullCalendar={() => setIsCalendarOpen(true)}
                  />
                  {selectedDays.size > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilter}
                        className="text-xs"
                      >
                        Clear ({selectedDays.size} selected)
                      </Button>
                    </div>
                  )}
                  {selectedDays.size > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''} for {selectedDays.size} selected day{selectedDays.size !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Meals by Date */}
                <div className="space-y-8">
                  {sortedDates.map((dateKey) => {
                    const dateMeals = mealsByDate[dateKey]
                    const date = new Date(dateKey)
                    const mealCount = Object.values(dateMeals).reduce((sum, meals) => sum + meals.length, 0)
                    
                    return (
                      <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                          <div>
                            <h2 className="text-lg font-bold text-foreground">
                              {formatMealDate(dateKey)}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {date.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric' 
                              })} • {mealCount} meal{mealCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Meals by Type for this Date */}
                        <div className="space-y-5 pl-2">
                          {MEAL_TYPE_ORDER.map((mealType) => {
                            const mealsOfType = dateMeals[mealType] || []
                            if (mealsOfType.length === 0) return null

                            return (
                              <div key={mealType} className="space-y-3">
                                {/* Meal Type Header with Date & Time */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-base font-semibold text-foreground">
                                      {MEAL_TYPE_LABELS[mealType]}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                      {MEAL_TYPE_TIMES[mealType]}
                                    </span>
                                  </div>
                                </div>

                                {/* Meal Cards */}
                                {mealsOfType.map((meal) => {
                                  const cook = meal.cookUserId 
                                    ? family?.members?.find((m) => m.userId === meal.cookUserId)
                                    : undefined
                                  const cookName = cook && (cook.name || cook.username)
                                  const mealDate = new Date(meal.scheduledFor || meal.date || new Date())
                                  const timeStr = mealDate.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })
                                  
                                  return (
                                    <MealCard
                                      key={meal.id}
                                      meal={{
                                        id: meal.id,
                                        mealType: meal.mealType,
                                        status: meal.status,
                                        scheduledFor: meal.scheduledFor,
                                        date: meal.date,
                                        constraints: meal.constraints,
                                        cookUserId: meal.cookUserId,
                                        cookName: cookName,
                                        mealDateTime: formatMealDateTime(meal),
                                        mealTime: timeStr,
                                        // TODO: Get actual proposal count and selected dish from API
                                        proposalCount: undefined,
                                        selectedDishName: undefined,
                                        selectedDishImage: undefined,
                                      }}
                                      onClick={() => navigate(`/meals/${meal.id}`)}
                                    />
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty State */}
                  {displayedMeals.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No meals found {selectedDays.size > 0 ? 'for selected days' : 'yet'}</p>
                      <p className="text-sm mt-2">
                        {selectedDays.size > 0 
                          ? 'Try selecting different days or create a meal to get started!'
                          : 'Create a meal to get started!'
                        }
                      </p>
                    </div>
                  )}

                  {/* Show More Button */}
                  {hasMoreMeals && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowLimit(prev => prev + 10)}
                      >
                        Show More ({sortedMeals.length - showLimit} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposals / Voting (right on desktop) */}
              <aside className="order-1 lg:order-2 lg:w-[420px] xl:w-[460px] shrink-0 self-stretch lg:self-auto">
                <div className="lg:sticky lg:top-6 space-y-6">
                  {/* Active Voting Card */}
                  {activeVoting ? (
                    votingData ? (
                      <ActiveVotingCard
                        meal={{
                          id: activeVoting.id,
                          mealType: activeVoting.mealType,
                          title:
                            votingData.proposalCount > 0
                              ? (votingData.leadingProposal?.dishName || 'View Proposals')
                              : 'No Proposals Yet',
                          description:
                            votingData.proposalCount > 0
                              ? `${votingData.proposalCount} proposal${votingData.proposalCount > 1 ? 's' : ''} available`
                              : 'Be the first to suggest a meal!',
                          imageUrl: votingData.leadingProposal?.extra?.imageUrls?.[0],
                          votesNeeded: votingData.totalMembers,
                          currentVotes: votingData.currentVotes,
                          voters: votingData.voters,
                        }}
                        onVote={handleVote}
                      />
                    ) : (
                      <div className="h-[340px] bg-muted animate-pulse rounded-lg" aria-label="Loading voting" />
                    )
                  ) : null}
                </div>
              </aside>
            </div>
          </>
        )}

        {/* Create Meal Button(Admin Only) */}
        <AdminOnly>
          <div className="fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] md:bottom-[calc(2rem+env(safe-area-inset-bottom))] lg:hidden z-10 pointer-events-none">
            <div
              className="mx-auto flex justify-end pointer-events-auto"
              style={{
                maxWidth: 'var(--app-max-width)',
                paddingInline: 'var(--spacing-lg)',
                paddingRight: 'calc(var(--spacing-lg) + env(safe-area-inset-right))',
              }}
            >
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/15 to-accent/20 hover:from-primary/20 hover:to-accent/25 hover:border-primary/60 shadow-sm"
                onClick={() => setShowCreateMeal(true)}
                aria-label="Create Meal"
              >
                <Plus className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>
        </AdminOnly>

        {/* Create Meal Dialog */}
        {family && (
          <CreateMealDialog
            open={showCreateMeal}
            onOpenChange={setShowCreateMeal}
            familyId={family.id}
          />
        )}
      </PageShell>

      {/* Full Calendar Sheet */}
      <FullCalendarSheet
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        selectedDate={selectedDate}
        onSelectDate={handleCalendarDateSelect}
        selectionMode={calendarSelectionMode}
        onSelectionModeChange={setCalendarSelectionMode}
        range={calendarRange}
        onRangeChange={handleCalendarRangeChange}
      />
    </div>
  )
}
