-- Fix RLS policies for caregiver linking functionality
-- Run this in Supabase SQL Editor

-- Allow authenticated users to read other users (for finding elderly users by email)
DROP POLICY IF EXISTS "Users can view other users" ON public.users;
CREATE POLICY "Users can view other users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow caregivers to create links
DROP POLICY IF EXISTS "Caregivers can create links" ON public.caregiver_links;
CREATE POLICY "Caregivers can create links"
  ON public.caregiver_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caregiver_id);

-- Allow caregivers to view their links
DROP POLICY IF EXISTS "Caregivers can view their links" ON public.caregiver_links;
CREATE POLICY "Caregivers can view their links"
  ON public.caregiver_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id);

-- Allow caregivers to delete their links
DROP POLICY IF EXISTS "Caregivers can delete their links" ON public.caregiver_links;
CREATE POLICY "Caregivers can delete their links"
  ON public.caregiver_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = caregiver_id);

-- Allow caregivers to view health summaries of linked users
DROP POLICY IF EXISTS "Caregivers can view linked user summaries" ON public.daily_summaries;
CREATE POLICY "Caregivers can view linked user summaries"
  ON public.daily_summaries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = daily_summaries.user_id
    )
  );

-- Allow caregivers to view health check-ins of linked users
DROP POLICY IF EXISTS "Caregivers can view linked user checkins" ON public.health_checkins;
CREATE POLICY "Caregivers can view linked user checkins"
  ON public.health_checkins
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = health_checkins.user_id
    )
  );

-- Allow caregivers to view medications of linked users
DROP POLICY IF EXISTS "Caregivers can view linked user medications" ON public.medications;
CREATE POLICY "Caregivers can view linked user medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = medications.user_id
    )
  );

-- Voice messages: users can view messages where they are sender OR recipient
DROP POLICY IF EXISTS "Users can view their messages" ON public.voice_messages;
CREATE POLICY "Users can view their messages"
  ON public.voice_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id 
    OR 
    auth.uid() = recipient_id
  );

-- Voice messages: users can send messages
DROP POLICY IF EXISTS "Users can send messages" ON public.voice_messages;
CREATE POLICY "Users can send messages"
  ON public.voice_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Voice messages: recipients can update (mark as read)
DROP POLICY IF EXISTS "Recipients can update messages" ON public.voice_messages;
CREATE POLICY "Recipients can update messages"
  ON public.voice_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id);

-- Ensure caregiver_links has RLS enabled
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;

