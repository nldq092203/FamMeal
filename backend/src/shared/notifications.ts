export const notificationTypeIds = [1, 2, 3, 4, 5, 6] as const;
export type NotificationTypeId = (typeof notificationTypeIds)[number];

export const NotificationType = {
  MEAL_PROPOSAL: 1,
  MEAL_FINALIZED: 2,
  MEMBER_JOINED: 3,
  REMINDER: 4,
  COOK_ASSIGNED: 5,
  WELCOME_FAMILY: 6,
} as const satisfies Record<string, NotificationTypeId>;

export const scheduleStatuses = ['PENDING', 'DONE', 'CANCELED'] as const;
export type ScheduleStatus = (typeof scheduleStatuses)[number];

