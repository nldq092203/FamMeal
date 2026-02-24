const { User } = require('./User');
const { Family } = require('./Family');
const { FamilyMember } = require('./FamilyMember');
const { Meal } = require('./Meal');
const { Proposal } = require('./Proposal');
const { Vote } = require('./Vote');
const { Notification } = require('./Notification');
const { ScheduledNotification } = require('./ScheduledNotification');
const { PasswordResetToken } = require('./PasswordResetToken');
const { CronState } = require('./CronState');

User.hasMany(FamilyMember, { foreignKey: 'userId', as: 'memberships' });
FamilyMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Family.hasMany(FamilyMember, { foreignKey: 'familyId', as: 'members' });
FamilyMember.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

Family.hasMany(Meal, { foreignKey: 'familyId', as: 'meals' });
Meal.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

Meal.hasMany(Proposal, { foreignKey: 'mealId', as: 'proposals' });
Proposal.belongsTo(Meal, { foreignKey: 'mealId', as: 'meal' });

Proposal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Proposal, { foreignKey: 'userId', as: 'proposals' });

Proposal.hasMany(Vote, { foreignKey: 'proposalId', as: 'votes' });
Vote.belongsTo(Proposal, { foreignKey: 'proposalId', as: 'proposal' });

Vote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Vote, { foreignKey: 'userId', as: 'votes' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Family.hasMany(Notification, { foreignKey: 'familyId', as: 'notifications' });
Notification.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

Family.hasMany(ScheduledNotification, { foreignKey: 'familyId', as: 'scheduledNotifications' });
ScheduledNotification.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Meal.belongsTo(User, { foreignKey: 'cookUserId', as: 'cook' });

module.exports = {
  User,
  Family,
  FamilyMember,
  Meal,
  Proposal,
  Vote,
  Notification,
  ScheduledNotification,
  PasswordResetToken,
  CronState,
};
