import { db } from './database';
import { getSetting } from './settings';

export const checkGoalReminders = async () => {
  const notificationsEnabled = await getSetting('notifications_enabled', false);

  if (!notificationsEnabled) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();

  const dueGoals = await db.goals
    .where('reminderDate')
    .belowOrEqual(now)
    .and(goal => !goal.reminderSent)
    .toArray();

  for (const goal of dueGoals) {
    new Notification('Goal Reminder', {
      body: `Don't forget your goal: "${goal.title}"!`,
      icon: '/logo.png',
    });

    // Mark as sent to avoid re-notifying
    await db.goals.update(goal.id!, { reminderSent: true });
  }
};
