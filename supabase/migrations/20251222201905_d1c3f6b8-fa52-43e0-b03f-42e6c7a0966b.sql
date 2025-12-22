-- Allow users to view only their own crisis alerts
CREATE POLICY "Users can view their own alerts" 
ON public.crisis_alerts FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins and listeners to view all crisis alerts for review
CREATE POLICY "Moderators can view crisis alerts" 
ON public.crisis_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type IN ('admin', 'listener')
  )
);