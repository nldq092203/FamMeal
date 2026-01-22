import { create } from 'zustand'
import type { DateRange } from '@/pages/Meals/components/FullCalendarSheet'

type CalendarMode = 'day' | 'range'

type MealsUiState = {
  selectedDate: Date
  selectedRange: DateRange
  calendarMode: CalendarMode
  isCalendarOpen: boolean
  setSelectedDate: (date: Date) => void
  setSelectedRange: (range: DateRange) => void
  setCalendarMode: (mode: CalendarMode) => void
  setCalendarOpen: (open: boolean) => void
  resetToDay: (date: Date) => void
}

export const useMealsUiStore = create<MealsUiState>((set) => ({
  selectedDate: new Date(),
  selectedRange: { start: null, end: null },
  calendarMode: 'day',
  isCalendarOpen: false,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedRange: (selectedRange) => set({ selectedRange }),
  setCalendarMode: (calendarMode) => set({ calendarMode }),
  setCalendarOpen: (isCalendarOpen) => set({ isCalendarOpen }),
  resetToDay: (date) =>
    set({
      selectedDate: date,
      selectedRange: { start: null, end: null },
      calendarMode: 'day',
    }),
}))

