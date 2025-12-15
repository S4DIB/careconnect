// Health-related keywords to detect in check-ins
export const HEALTH_KEYWORDS = [
  'pain',
  'tired',
  'headache',
  'dizzy',
  'fever',
  'sad',
  'anxious',
  'depressed',
  'nausea',
  'cough',
  'cold',
  'weak',
  'sick',
  'hurt',
  'ache',
  'worry',
  'upset',
  'lonely',
  'sleepy',
  'exhausted',
];

// Mood detection patterns
export const MOOD_PATTERNS = {
  good: ['good', 'great', 'excellent', 'fine', 'well', 'happy', 'better', 'okay'],
  bad: ['bad', 'terrible', 'awful', 'worse', 'poor', 'sick', 'ill'],
  neutral: ['okay', 'alright', 'so-so', 'fine'],
};

// Default TTS voice settings
export const TTS_CONFIG = {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
};

// Notification settings
export const NOTIFICATION_CONFIG = {
  icon: '/icon-192x192.png',
  badge: '/icon-192x192.png',
  requireInteraction: true,
};

