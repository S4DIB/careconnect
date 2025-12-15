-- CareConnect Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================
-- USERS TABLE (extends Supabase auth.users)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('elderly_user', 'caregiver')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- CAREGIVER LINKS (connect caregivers to elderly users)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.caregiver_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  elderly_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(caregiver_id, elderly_user_id)
);

-- ====================================================
-- HEALTH CHECK-INS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.health_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  detected_keywords TEXT[], -- Array of detected health keywords
  mood TEXT, -- e.g., 'good', 'bad', 'neutral'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- MEDICATIONS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  time TEXT NOT NULL, -- Format: "HH:MM" (24-hour)
  total_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- MEDICATION LOGS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('taken', 'later', 'skipped')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- VOICE MESSAGES (two-way messaging)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.voice_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL, -- Supabase Storage URL
  duration_seconds INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- STOCK ALERTS
-- ====================================================
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- DAILY HEALTH SUMMARIES
-- ====================================================
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_summary TEXT,
  symptoms TEXT[], -- Detected symptoms
  medication_adherence_rate DECIMAL(5,2), -- Percentage
  total_checkins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- USERS TABLE POLICIES
-- ====================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ====================================================
-- CAREGIVER LINKS POLICIES
-- ====================================================
CREATE POLICY "Caregivers can view their links"
  ON public.caregiver_links FOR SELECT
  USING (
    auth.uid() = caregiver_id OR 
    auth.uid() = elderly_user_id
  );

CREATE POLICY "Caregivers can create links"
  ON public.caregiver_links FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

-- ====================================================
-- HEALTH CHECK-INS POLICIES
-- ====================================================
CREATE POLICY "Users can view own check-ins"
  ON public.health_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view linked user check-ins"
  ON public.health_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid()
      AND elderly_user_id = health_checkins.user_id
    )
  );

CREATE POLICY "Users can insert own check-ins"
  ON public.health_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ====================================================
-- MEDICATIONS POLICIES
-- ====================================================
CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view linked user medications"
  ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid()
      AND elderly_user_id = medications.user_id
    )
  );

CREATE POLICY "Users can manage own medications"
  ON public.medications FOR ALL
  USING (auth.uid() = user_id);

-- ====================================================
-- MEDICATION LOGS POLICIES
-- ====================================================
CREATE POLICY "Users can view own medication logs"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view linked user logs"
  ON public.medication_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid()
      AND elderly_user_id = medication_logs.user_id
    )
  );

CREATE POLICY "Users can insert own medication logs"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ====================================================
-- VOICE MESSAGES POLICIES
-- ====================================================
CREATE POLICY "Users can view messages sent to them"
  ON public.voice_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can send voice messages"
  ON public.voice_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message read status"
  ON public.voice_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ====================================================
-- STOCK ALERTS POLICIES
-- ====================================================
CREATE POLICY "Users can view own stock alerts"
  ON public.stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view linked user alerts"
  ON public.stock_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid()
      AND elderly_user_id = stock_alerts.user_id
    )
  );

CREATE POLICY "System can insert stock alerts"
  ON public.stock_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own alerts"
  ON public.stock_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- ====================================================
-- DAILY SUMMARIES POLICIES
-- ====================================================
CREATE POLICY "Users can view own summaries"
  ON public.daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view linked user summaries"
  ON public.daily_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid()
      AND elderly_user_id = daily_summaries.user_id
    )
  );

CREATE POLICY "System can insert summaries"
  ON public.daily_summaries FOR INSERT
  WITH CHECK (true);

-- ====================================================
-- FUNCTIONS AND TRIGGERS
-- ====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for medications table
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- STORAGE BUCKET FOR VOICE MESSAGES
-- ====================================================
-- Run this separately in Supabase Dashboard or SQL Editor

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages bucket
CREATE POLICY "Users can upload voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-messages' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view voice messages"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-messages' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.voice_messages vm
        WHERE vm.audio_url LIKE '%' || storage.objects.name || '%'
        AND (vm.sender_id = auth.uid() OR vm.recipient_id = auth.uid())
      )
    )
  );

-- ====================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================
CREATE INDEX idx_caregiver_links_caregiver ON public.caregiver_links(caregiver_id);
CREATE INDEX idx_caregiver_links_elderly ON public.caregiver_links(elderly_user_id);
CREATE INDEX idx_health_checkins_user ON public.health_checkins(user_id);
CREATE INDEX idx_health_checkins_created ON public.health_checkins(created_at DESC);
CREATE INDEX idx_medications_user ON public.medications(user_id);
CREATE INDEX idx_medication_logs_user ON public.medication_logs(user_id);
CREATE INDEX idx_medication_logs_medication ON public.medication_logs(medication_id);
CREATE INDEX idx_voice_messages_recipient ON public.voice_messages(recipient_id);
CREATE INDEX idx_voice_messages_sender ON public.voice_messages(sender_id);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date DESC);

