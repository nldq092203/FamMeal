import { useMemo } from 'react'
import type { DateRange } from './FullCalendarSheet'

interface WeeklyCalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onOpenFullCalendar?: () => void
  range?: DateRange
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function isBetweenInclusive(date: Date, start: Date, end: Date) {
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

export function WeeklyCalendar({ selectedDate, onDateSelect, onOpenFullCalendar, range }: WeeklyCalendarProps) {
  const currentWeekStart = useMemo(() => {
    const base = new Date(selectedDate)
    const diff = base.getDate() - base.getDay() // Sunday-start
    return new Date(base.setDate(diff))
  }, [selectedDate])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + i)
    return date
  })

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    if (range?.start) {
      if (range.end) return sameDay(date, range.start) || sameDay(date, range.end)
      return sameDay(date, range.start)
    }
    return sameDay(date, selectedDate)
  }

  const isInRange = (date: Date) => {
    if (!range?.start || !range.end) return false
    return isBetweenInclusive(date, range.start, range.end)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="t-section-title">This Week</div>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:text-primary/80"
          onClick={onOpenFullCalendar}
        >
          Full Calendar
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-2">
        <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const isCurrentDay = isToday(date)
          const isSelectedDay = isSelected(date)
          const inRange = isInRange(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={[
                'flex flex-col items-center justify-center rounded-xl py-2 transition-all',
                isSelectedDay
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : inRange
                  ? 'bg-primary/10 text-primary'
                  : isCurrentDay
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
              type="button"
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
