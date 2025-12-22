-- Add UPDATE policy for room_messages - users can update their own messages
CREATE POLICY "Users can update their own messages" 
ON public.room_messages FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for room_messages - users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
ON public.room_messages FOR DELETE 
USING (auth.uid() = user_id);

-- Add UPDATE policy for admins/listeners to moderate messages
CREATE POLICY "Moderators can update messages" 
ON public.room_messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type IN ('admin', 'listener')
  )
);

-- Add DELETE policy for admins/listeners to remove harmful content
CREATE POLICY "Moderators can delete messages" 
ON public.room_messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type IN ('admin', 'listener')
  )
);