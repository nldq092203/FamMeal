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
import { MealCard } from './components/MealCard'
import { CreateMealDialog } from './components/CreateMealDialog'
import { FullCalendarSheet } from './components/FullCalendarSheet'
import type { AvatarId } from '@/assets/avatars'
import { getAvatarSrc } from '@/assets/avatars'
import type { Family, Meal, MealSummary, MealType } from '@/types'
import { MEAL_TYPE_LABELS, MEAL_TYPE_TIMES } from './constants'
import { formatLocalDateParam } from '@/query/format'
import { useMealsQuery } from '@/query/hooks/useMealsQuery'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'
import { useMealsUiStore } from '@/stores/mealsUiStore'

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

  const selectedDate = useMealsUiStore((s) => s.selectedDate)
  const selectedRange = useMealsUiStore((s) => s.selectedRange)
  const calendarMode = useMealsUiStore((s) => s.calendarMode)
  const isCalendarOpen = useMealsUiStore((s) => s.isCalendarOpen)
  const setCalendarOpen = useMealsUiStore((s) => s.setCalendarOpen)
  const setCalendarMode = useMealsUiStore((s) => s.setCalendarMode)
  const setSelectedDate = useMealsUiStore((s) => s.setSelectedDate)
  const setSelectedRange = useMealsUiStore((s) => s.setSelectedRange)
  const resetToDay = useMealsUiStore((s) => s.resetToDay)

  const [showCreateMeal, setShowCreateMeal] = useState(false)

  const effectiveRange = useMemo(() => {
    if (calendarMode === 'range' && selectedRange.start && selectedRange.end) {
      const start = selectedRange.start <= selectedRange.end ? selectedRange.start : selectedRange.end
      const end = selectedRange.start <= selectedRange.end ? selectedRange.end : selectedRange.start
      return { start, end }
    }
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - start.getDay()) // Sunday-start
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }, [calendarMode, selectedDate, selectedRange.end, selectedRange.start])

  const mealsQuery = useMealsQuery({
    familyId: family?.id ?? null,
    startDate: formatLocalDateParam(effectiveRange.start),
    endDate: formatLocalDateParam(effectiveRange.end),
  })

  const meals = mealsQuery.data ?? []

  // Find the most upcoming meal with active voting
  const activeVoting = meals
    .filter(
      (meal) =>
        meal.status === 'PLANNING' && (!meal.votingClosedAt || new Date(meal.votingClosedAt) > new Date())
    )
    .sort((a, b) => {
      const dateA = new Date(a.scheduledFor || a.date || 0).getTime()
      const dateB = new Date(b.scheduledFor || b.date || 0).getTime()
      
      // If dates are different, sort by date
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

  const handleDismiss = () => {
    // TODO: Implement dismiss logic (hide voting card for this session)
    console.log('Dismissed voting card')
  }

  const displayName = user?.name || user?.username || 'there'
  const firstName = displayName.split(' ')[0] || displayName

  const dateString = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })

  const headerDateText = (() => {
    if (calendarMode === 'range' && selectedRange.start && selectedRange.end) {
      const start = selectedRange.start <= selectedRange.end ? selectedRange.start : selectedRange.end
      const end = selectedRange.start <= selectedRange.end ? selectedRange.end : selectedRange.start
      return `${dateString(start)} – ${dateString(end)}`
    }
    return dateString(selectedDate)
  })()

  // Group meals by type
  const mealsByType = meals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) acc[meal.mealType] = []
    acc[meal.mealType].push(meal)
    return acc
  }, {} as Record<string, typeof meals>)



  return (
    <div className="min-h-screen bg-background">
      <PageShell className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{headerDateText}</p>
            <h1 className="t-display mt-2 text-heading truncate">Hello, {firstName}!</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="shrink-0 h-12 w-12 rounded-full border-2 border-card bg-card overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

        {/* Loading State */}
        {mealsQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-[340px] bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : (
          <>
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
                  onDismiss={handleDismiss}
                />
              ) : (
                <div className="h-[340px] bg-muted animate-pulse rounded-lg" aria-label="Loading voting" />
              )
            ) : null}

            {/* Weekly Calendar */}
            <WeeklyCalendar
              selectedDate={selectedDate}
              onDateSelect={(date) => resetToDay(date)}
              onOpenFullCalendar={() => setCalendarOpen(true)}
              range={calendarMode === 'range' ? selectedRange : undefined}
            />

            {/* Meals by Type */}
            <div className="space-y-6">
              {MEAL_TYPE_ORDER.map((mealType) => {
                const mealsOfType = mealsByType[mealType] || []
                if (mealsOfType.length === 0) return null

                return (
                  <div key={mealType} className="space-y-3">
                    {/* Meal Type Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="t-section-title">
                        {MEAL_TYPE_LABELS[mealType]}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        {MEAL_TYPE_TIMES[mealType]}
                      </span>
                    </div>

                    {/* Meal Cards */}
                    {mealsOfType.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={{
                          id: meal.id,
                          mealType: meal.mealType,
                          status: meal.status,
                          scheduledFor: meal.scheduledFor,
                          constraints: meal.constraints,
                          // TODO: Get actual proposal count and selected dish from API
                          proposalCount: undefined,
                          selectedDishName: undefined,
                          selectedDishImage: undefined,
                        }}
                        onClick={() => navigate(`/meals/${meal.id}`)}
                      />
                    ))}
                  </div>
                )
              })}

              {/* Empty State */}
              {meals.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No meals scheduled yet</p>
                  <p className="text-sm mt-2">Create a meal to get started!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Meal Button(Admin Only) */}
        <AdminOnly>
          <div className="fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] md:bottom-[calc(2rem+env(safe-area-inset-bottom))] z-10 pointer-events-none">
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
                className="h-12 w-12 rounded-full border-2 border-dashed border-primary/60 bg-transparent hover:bg-primary/5 hover:border-primary shadow-sm"
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

      <FullCalendarSheet
        open={isCalendarOpen}
        onOpenChange={setCalendarOpen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        selectionMode={calendarMode}
        onSelectionModeChange={setCalendarMode}
        range={selectedRange}
        onRangeChange={setSelectedRange}
      />
    </div>
  )
}
