// Health analysis utilities (rule-based, no AI API)
import { HEALTH_KEYWORDS, MOOD_PATTERNS } from '@/lib/constants';

/**
 * Detect health-related keywords in transcript
 */
export function detectHealthKeywords(transcript: string): string[] {
  const lowerTranscript = transcript.toLowerCase();
  const detected: string[] = [];

  HEALTH_KEYWORDS.forEach((keyword) => {
    if (lowerTranscript.includes(keyword)) {
      detected.push(keyword);
    }
  });

  return detected;
}

/**
 * Analyze mood from transcript
 */
export function analyzeMood(transcript: string): string {
  const lowerTranscript = transcript.toLowerCase();

  // Count positive and negative indicators
  let goodCount = 0;
  let badCount = 0;

  MOOD_PATTERNS.good.forEach((word) => {
    if (lowerTranscript.includes(word)) goodCount++;
  });

  MOOD_PATTERNS.bad.forEach((word) => {
    if (lowerTranscript.includes(word)) badCount++;
  });

  // Determine mood
  if (goodCount > badCount) return 'good';
  if (badCount > goodCount) return 'bad';
  return 'neutral';
}

/**
 * Generate daily summary based on check-ins and medication logs
 */
export function generateDailySummary(
  checkins: Array<{ transcript: string; detected_keywords: string[]; mood: string | null }>,
  medicationLogs: Array<{ status: string }>
): {
  mood_summary: string;
  symptoms: string[];
  medication_adherence_rate: number;
  total_checkins: number;
} {
  const total_checkins = checkins.length;

  // Aggregate moods
  const moodCounts: Record<string, number> = { good: 0, bad: 0, neutral: 0 };
  checkins.forEach((checkin) => {
    if (checkin.mood) {
      moodCounts[checkin.mood] = (moodCounts[checkin.mood] || 0) + 1;
    }
  });

  const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
    moodCounts[a] > moodCounts[b] ? a : b
  );
  const mood_summary = `Overall mood: ${dominantMood}`;

  // Aggregate symptoms
  const symptomsSet = new Set<string>();
  checkins.forEach((checkin) => {
    checkin.detected_keywords.forEach((kw) => symptomsSet.add(kw));
  });
  const symptoms = Array.from(symptomsSet);

  // Calculate medication adherence
  const takenCount = medicationLogs.filter((log) => log.status === 'taken').length;
  const totalLogs = medicationLogs.length;
  const medication_adherence_rate = totalLogs > 0 ? (takenCount / totalLogs) * 100 : 100;

  return {
    mood_summary,
    symptoms,
    medication_adherence_rate: Math.round(medication_adherence_rate * 100) / 100,
    total_checkins,
  };
}

