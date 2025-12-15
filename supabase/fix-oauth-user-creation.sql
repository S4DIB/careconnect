-- Fix RLS policy to allow OAuth user creation
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow signup insert" ON public.users;

-- Create new policy that allows user creation during OAuth
-- This allows authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to create profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- Also ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE caregiver_id = auth.uid() AND elderly_user_id = users.id
    ) OR
    EXISTS (
      SELECT 1 FROM public.caregiver_links
      WHERE elderly_user_id = auth.uid() AND caregiver_id = users.id
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

