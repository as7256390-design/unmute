-- =====================================================
-- CRITICAL SECURITY FIX: Strengthen RLS policies for sensitive tables
-- =====================================================

-- 1. DROP overly broad policies and recreate with proper granularity for mood_logs
DROP POLICY IF EXISTS "Users can manage their mood logs" ON public.mood_logs;

CREATE POLICY "Users can view their own mood logs"
ON public.mood_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood logs"
ON public.mood_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs"
ON public.mood_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs"
ON public.mood_logs
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add missing UPDATE and DELETE policies for chat_messages
CREATE POLICY "Users can update their own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Strengthen crisis_alerts - remove overly permissive moderator policy and make more restrictive
DROP POLICY IF EXISTS "Moderators can view crisis alerts" ON public.crisis_alerts;

-- Create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.is_crisis_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND user_type IN ('admin', 'listener')
  )
$$;

-- Moderators can only view crisis alerts, not other data
CREATE POLICY "Moderators can view crisis alerts for moderation"
ON public.crisis_alerts
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_crisis_moderator(auth.uid())
);

-- Add UPDATE policy for moderators to mark alerts as reviewed
CREATE POLICY "Moderators can update crisis alerts"
ON public.crisis_alerts
FOR UPDATE
USING (public.is_crisis_moderator(auth.uid()))
WITH CHECK (public.is_crisis_moderator(auth.uid()));