import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeeklyCalendarProps {
  weekStart: Date
  selectedDays: Set<string>
  onDayToggle: (date: Date) => void
  onWeekChange: (weekStart: Date) => void
  onOpenFullCalendar?: () => void
}

export function WeeklyCalendar({ weekStart, selectedDays, onDayToggle, onWeekChange, onOpenFullCalendar }: WeeklyCalendarProps) {
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return date
    })
  }, [weekStart])

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDays.has(date.toDateString())
  }

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(weekStart)
    newWeekStart.setDate(weekStart.getDate() - 7)
    onWeekChange(newWeekStart)
  }

  const handleNextWeek = () => {
    const newWeekStart = new Date(weekStart)
    newWeekStart.setDate(weekStart.getDate() + 7)
    onWeekChange(newWeekStart)
  }

  const handleToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = today.getDate() - today.getDay() // Sunday-start
    const weekStart = new Date(today)
    weekStart.setDate(diff)
    onWeekChange(weekStart)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="t-section-title">This Week</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousWeek}
            className="h-7 w-7 p-0"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs px-2 h-7"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="h-7 w-7 p-0"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {onOpenFullCalendar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFullCalendar}
              className="h-7 w-7 p-0 ml-2"
              aria-label="Open full calendar"
              title="Open full calendar"
            >
              <Calendar className="h-4 w-4 text-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-2">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((date, index) => {
            const isCurrentDay = isToday(date)
            const isSelectedDay = isSelected(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDayToggle(date)}
                className={[
                  'flex flex-col items-center justify-center rounded-xl py-2 transition-all cursor-pointer',
                  isSelectedDay
                    ? 'bg-primary text-primary-foreground shadow-md font-semibold'
                    : isCurrentDay
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-muted/50',
                ].join(' ')}
                type="button"
                aria-label={`Select ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
              >
                <span className="text-xs font-semibold mb-1">{dayNames[index]}</span>
                <span className="text-lg font-bold leading-none">{date.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
