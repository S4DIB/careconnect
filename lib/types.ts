// Type definitions for CareConnect

export type UserRole = 'elderly_user' | 'caregiver';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CaregiverLink {
  id: string;
  caregiver_id: string;
  elderly_user_id: string;
  created_at: string;
}

export interface HealthCheckin {
  id: string;
  user_id: string;
  transcript: string;
  detected_keywords: string[];
  mood: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  time: string; // Format: "HH:MM"
  total_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  status: 'taken' | 'later' | 'skipped';
  scheduled_time: string;
  logged_at: string;
}

export interface VoiceMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  audio_url: string;
  duration_seconds: number | null;
  is_read: boolean;
  created_at: string;
}

export interface StockAlert {
  id: string;
  medication_id: string;
  user_id: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  mood_summary: string | null;
  symptoms: string[];
  medication_adherence_rate: number | null;
  total_checkins: number;
  created_at: string;
}

export interface MedicationWithLogs extends Medication {
  logs?: MedicationLog[];
}

export interface LinkedUser extends User {
  link_id: string;
}

