const NotificationType = {
  MEAL_PROPOSAL: 1,
  MEAL_FINALIZED: 2,
  MEMBER_JOINED: 3,
  REMINDER: 4,
  COOK_ASSIGNED: 5,
  WELCOME_FAMILY: 6,
};

const SCHEDULE_STATUSES = ['PENDING', 'DONE', 'CANCELED'];

module.exports = { NotificationType, SCHEDULE_STATUSES };
