const SOUND_URL = '/sounds/new-order.mp3';

let audio: HTMLAudioElement | null = null;
let userHasInteracted = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SOUND_URL);
    audio.preload = 'auto';
  }
  return audio;
}

function markInteracted() {
  if (userHasInteracted) return;
  userHasInteracted = true;
  getAudio().load();
  window.removeEventListener('click', markInteracted, true);
  window.removeEventListener('keydown', markInteracted, true);
}

/** Call once at app startup to warm the audio element after first user interaction. */
export function initNotificationSound() {
  if (typeof window === 'undefined') return;
  window.addEventListener('click', markInteracted, true);
  window.addEventListener('keydown', markInteracted, true);
}

/**
 * Play the new-order notification sound.
 * Repeats `count` times with a short gap between plays.
 */
export function playNewOrderSound(count = 2) {
  const el = getAudio();
  let played = 0;

  const playOnce = () => {
    el.currentTime = 0;
    el.play().catch(() => {
      // Autoplay blocked — user hasn't interacted yet; ignore silently
    });
    played++;
    if (played < count) {
      el.onended = () => {
        setTimeout(playOnce, 400);
      };
    } else {
      el.onended = null;
    }
  };

  playOnce();
}

/** Request browser Notification permission (non-blocking). */
export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

/** Show a browser notification (works when tab is in background). */
export function showBrowserNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch {
    // Fallback: some environments don't support Notification constructor
  }
}
