-- RLS policies for caregiver alerts and monitoring
-- Run this in Supabase SQL Editor after fix-caregiver-links.sql

-- Allow caregivers to view stock alerts of linked users
DROP POLICY IF EXISTS "Caregivers can view linked user alerts" ON public.stock_alerts;
CREATE POLICY "Caregivers can view linked user alerts"
  ON public.stock_alerts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = stock_alerts.user_id
    )
  );

-- Allow caregivers to update (resolve) stock alerts of linked users
DROP POLICY IF EXISTS "Caregivers can resolve linked user alerts" ON public.stock_alerts;
CREATE POLICY "Caregivers can resolve linked user alerts"
  ON public.stock_alerts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = stock_alerts.user_id
    )
  );

-- Allow caregivers to view medication logs of linked users
DROP POLICY IF EXISTS "Caregivers can view linked user logs" ON public.medication_logs;
CREATE POLICY "Caregivers can view linked user logs"
  ON public.medication_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.caregiver_links 
      WHERE caregiver_id = auth.uid() 
      AND elderly_user_id = medication_logs.user_id
    )
  );

-- Ensure users can view their own alerts and logs
DROP POLICY IF EXISTS "Users can view own alerts" ON public.stock_alerts;
CREATE POLICY "Users can view own alerts"
  ON public.stock_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own logs" ON public.medication_logs;
CREATE POLICY "Users can view own logs"
  ON public.medication_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure users can manage their own logs
DROP POLICY IF EXISTS "Users can insert own logs" ON public.medication_logs;
CREATE POLICY "Users can insert own logs"
  ON public.medication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

