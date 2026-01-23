import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import './FullCalendarSheet.css'

type SelectionMode = 'day' | 'range'

export type DateRange = {
  start: Date | null
  end: Date | null
}

const MAX_RANGE_DAYS = 30

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function clampRange(range: DateRange) {
  if (!range.start) return range
  if (!range.end) return range
  return range.start <= range.end ? range : { start: range.end, end: range.start }
}

function isBetweenInclusive(date: Date, start: Date, end: Date) {
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function daysInclusive(a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000
  const start = new Date(a)
  start.setHours(0, 0, 0, 0)
  const end = new Date(b)
  end.setHours(0, 0, 0, 0)
  return Math.floor(Math.abs(end.getTime() - start.getTime()) / msPerDay) + 1
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date)
}

export function FullCalendarSheet({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  selectionMode,
  onSelectionModeChange,
  range,
  onRangeChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
  selectionMode: SelectionMode
  onSelectionModeChange: (mode: SelectionMode) => void
  range: DateRange
  onRangeChange: (range: DateRange) => void
}) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(selectedDate))

  const normalizedRange = useMemo(() => clampRange(range), [range])
  const normalizedRangeLength = useMemo(() => {
    if (!normalizedRange.start) return 0
    if (!normalizedRange.end) return 0
    return daysInclusive(normalizedRange.start, normalizedRange.end)
  }, [normalizedRange.end, normalizedRange.start])

  useEffect(() => {
    if (!open) return
    setMonthCursor(startOfMonth(selectedDate))
  }, [open, selectedDate])

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthCursor)
    const end = endOfMonth(monthCursor)

    const leadingEmpty = start.getDay() // Sunday-first
    const daysInMonth = end.getDate()

    const cells: Array<Date | null> = []
    for (let i = 0; i < leadingEmpty; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(start.getFullYear(), start.getMonth(), d))
    while (cells.length % 7 !== 0) cells.push(null)

    return cells
  }, [monthCursor])

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const handleDayClick = (date: Date) => {
    if (selectionMode === 'day') {
      onRangeChange({ start: null, end: null })
      onSelectDate(date)
      onOpenChange(false)
      return
    }

    const { start, end } = normalizedRange
    if (!start || (start && end)) {
      onRangeChange({ start: date, end: null })
      onSelectDate(date)
      return
    }

    const rawDays = daysInclusive(start, date)
    const clampedEnd =
      rawDays > MAX_RANGE_DAYS ? addDays(start, (date >= start ? 1 : -1) * (MAX_RANGE_DAYS - 1)) : date

    onRangeChange({ start, end: clampedEnd })
    onSelectDate(start <= clampedEnd ? start : clampedEnd)
  }

  const handleDone = () => {
    if (selectionMode === 'range' && normalizedRange.start && !normalizedRange.end) return
    onOpenChange(false)
  }

  const handleClear = () => {
    onRangeChange({ start: null, end: null })
  }

  const handleRangeLengthChange = (days: number) => {
    if (!normalizedRange.start) return
    const safeDays = Math.max(1, Math.min(MAX_RANGE_DAYS, Math.round(days)))
    onRangeChange({ start: normalizedRange.start, end: addDays(normalizedRange.start, safeDays - 1) })
    onSelectDate(normalizedRange.start)
  }

  const isSelectedCell = (date: Date) => {
    if (selectionMode === 'range' && normalizedRange.start) {
      if (normalizedRange.end) return sameDay(date, normalizedRange.start) || sameDay(date, normalizedRange.end)
      return sameDay(date, normalizedRange.start)
    }
    return sameDay(date, selectedDate)
  }

  const isInRangeCell = (date: Date) => {
    if (selectionMode !== 'range') return false
    if (!normalizedRange.start || !normalizedRange.end) return false
    return isBetweenInclusive(date, normalizedRange.start, normalizedRange.end)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        containerClassName="items-end justify-center p-0"
        className="w-full max-w-[var(--app-max-width)] rounded-t-3xl rounded-b-none border-x-0 border-b-0"
      >
        <div className="pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <DialogHeader className="p-4">
            <div className="flex items-center justify-between gap-3 w-full">
              <DialogTitle style={{ fontFamily: 'var(--font-family-display)' }}>Calendar</DialogTitle>
              <DialogClose>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={selectionMode === 'day' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => onSelectionModeChange('day')}
              >
                Day
              </Button>
              <Button
                type="button"
                variant={selectionMode === 'range' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => onSelectionModeChange('range')}
              >
                Range
              </Button>

              <div className="flex-1" />

              <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!range.start && !range.end}>
                Clear
              </Button>
            </div>

            {selectionMode === 'range' && normalizedRange.start ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-foreground">Range length</div>
                  <div className="text-muted-foreground">
                    {normalizedRange.end ? `${normalizedRangeLength} days` : `Up to ${MAX_RANGE_DAYS} days`}
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={MAX_RANGE_DAYS}
                  step={1}
                  value={normalizedRange.end ? Math.min(normalizedRangeLength || 1, MAX_RANGE_DAYS) : 7}
                  onChange={(e) => handleRangeLengthChange(Number(e.target.value))}
                  className="calendar-range-slider"
                  aria-label="Range length"
                  style={{
                    ['--slider-percent' as never]: `${((normalizedRange.end ? Math.min(normalizedRangeLength || 1, MAX_RANGE_DAYS) : 7) / MAX_RANGE_DAYS) * 100}%`,
                  }}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="t-section-title text-center">{formatMonthTitle(monthCursor)}</div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
              {weekdayLabels.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((date, i) => {
                if (!date) return <div key={`e-${i}`} className="h-10" />

                const selected = isSelectedCell(date)
                const inRange = isInRangeCell(date)

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className={cn(
                      'h-10 rounded-xl text-sm font-semibold transition-colors',
                      selected ? 'bg-primary text-primary-foreground shadow-sm' : inRange ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleDone}
                disabled={selectionMode === 'range' && Boolean(normalizedRange.start) && !normalizedRange.end}
                className="rounded-full px-6"
              >
                Done
              </Button>
            </div>

            {selectionMode === 'range' && normalizedRange.start && !normalizedRange.end ? (
              <div className="text-xs text-muted-foreground">
                Pick an end date to finish the range.
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
