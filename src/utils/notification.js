export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    return await Notification.requestPermission();
  } catch (error) {
    return 'denied';
  }
}

export function sendMedicationNotification(drugName) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification('慢病用药小管家', {
      body: `您该服用 ${drugName} 了`,
      tag: `housekeeper-${drugName}`,
      renotify: true,
    });
    return true;
  } catch (error) {
    return false;
  }
}
