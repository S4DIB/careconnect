-- Fix RLS policy for users table to allow signup
-- Run this in Supabase SQL Editor

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new policy that allows INSERT during signup
-- This checks if the user_id matches OR if it's being created by the signup process
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() = id OR 
    auth.uid() IS NULL  -- Allow during signup before session is established
  );

-- Alternative: Use service role for signup API route
-- Or create policy that allows authenticated users to insert
CREATE POLICY "Allow signup insert"
  ON public.users FOR INSERT
  WITH CHECK (true);  -- Temporarily allow all inserts

-- Note: After testing, you may want to restrict this further
-- For production, use service role key in the API route instead

