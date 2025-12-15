// Browser notification utilities
import { NOTIFICATION_CONFIG } from '@/lib/constants';

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      ...NOTIFICATION_CONFIG,
      ...options,
    });
  }
}

/**
 * Show medication reminder notification
 */
export function showMedicationReminder(medicationName: string, dosage: string, medicationId: string) {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Medication Reminder', {
      body: `Time to take ${medicationName} (${dosage})`,
      tag: `medication-${medicationId}`,
      ...NOTIFICATION_CONFIG,
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      window.location.href = '/medications';
      notification.close();
    };

    return notification;
  }
}

