export const queryKeys = {
  families: {
    all: ['families'] as const,
    list: () => [...queryKeys.families.all, 'list'] as const,
    byId: (familyId: string) => [...queryKeys.families.all, 'byId', familyId] as const,
    history: (familyId: string, params?: { limit?: number; offset?: number }) =>
      [...queryKeys.families.all, 'history', familyId, params ?? {}] as const,
  },
  users: {
    all: ['users'] as const,
    suggestions: (query: string) => [...queryKeys.users.all, 'suggestions', query] as const,
  },
  meals: {
    all: ['meals'] as const,
    list: (params: { familyId: string; startDate?: string; endDate?: string }) =>
      [...queryKeys.meals.all, 'list', params] as const,
    active: (familyId: string) => [...queryKeys.meals.all, 'active', familyId] as const,
  },
  mealSummary: {
    all: ['mealSummary'] as const,
    byId: (mealId: string) => [...queryKeys.mealSummary.all, mealId] as const,
  },
  mealVotes: {
    all: ['mealVotes'] as const,
    myByMealId: (mealId: string) => [...queryKeys.mealVotes.all, 'myByMealId', mealId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (familyId: string, params: { limit: number }) =>
      [...queryKeys.notifications.all, 'list', familyId, params] as const,
    unreadCount: (familyId: string) => [...queryKeys.notifications.all, 'unreadCount', familyId] as const,
  },
} as const
