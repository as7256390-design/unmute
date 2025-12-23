-- Create shared activities table
CREATE TABLE public.shared_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.parent_child_connections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'reflection', -- reflection, discussion, task
  prompt TEXT NOT NULL,
  parent_response TEXT,
  child_response TEXT,
  parent_completed_at TIMESTAMP WITH TIME ZONE,
  child_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.shared_activities ENABLE ROW LEVEL SECURITY;

-- Parents can manage activities for their connections
CREATE POLICY "Parents can manage shared activities"
ON public.shared_activities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM parent_child_connections
    WHERE parent_child_connections.id = shared_activities.connection_id
    AND parent_child_connections.parent_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_child_connections
    WHERE parent_child_connections.id = shared_activities.connection_id
    AND parent_child_connections.parent_user_id = auth.uid()
  )
);

-- Children can view and respond to activities
CREATE POLICY "Children can view and respond to shared activities"
ON public.shared_activities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM parent_child_connections
    WHERE parent_child_connections.id = shared_activities.connection_id
    AND parent_child_connections.child_user_id = auth.uid()
    AND parent_child_connections.status = 'connected'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_child_connections
    WHERE parent_child_connections.id = shared_activities.connection_id
    AND parent_child_connections.child_user_id = auth.uid()
    AND parent_child_connections.status = 'connected'
  )
);

-- Create activity templates table for pre-made prompts
CREATE TABLE public.activity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'reflection',
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'bonding', -- bonding, communication, understanding, gratitude
  difficulty TEXT DEFAULT 'easy', -- easy, medium, deep
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS and allow anyone to view templates
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity templates"
ON public.activity_templates
FOR SELECT
USING (true);

-- Insert default activity templates
INSERT INTO public.activity_templates (title, description, activity_type, prompt, category, difficulty) VALUES
('Gratitude Exchange', 'Share what you appreciate about each other', 'reflection', 'Write 3 things you are grateful for about your parent/child. What qualities do you admire most?', 'gratitude', 'easy'),
('Dream Sharing', 'Discuss your hopes and dreams', 'discussion', 'What is one dream or goal you have for the future? How can we support each other in achieving our dreams?', 'bonding', 'easy'),
('Memory Lane', 'Recall a favorite memory together', 'reflection', 'Describe your favorite memory with your parent/child. What made it special? How did it make you feel?', 'bonding', 'easy'),
('Feelings Check-in', 'Share your current emotional state', 'reflection', 'How are you feeling right now? What has been on your mind lately? Is there anything you need support with?', 'communication', 'easy'),
('Apology & Forgiveness', 'Practice healing conversations', 'discussion', 'Is there something you would like to apologize for or discuss? How can we better communicate when we are upset?', 'communication', 'deep'),
('Understanding Perspectives', 'See things from each other''s view', 'reflection', 'Describe a recent situation from the other person''s perspective. What might they have been feeling? What did you learn?', 'understanding', 'medium'),
('Stress Sharing', 'Open up about challenges', 'discussion', 'What is causing you stress right now? How can we help each other manage stress better?', 'communication', 'medium'),
('Quality Time Planning', 'Plan meaningful time together', 'task', 'Plan one activity you would both enjoy doing together this week. What would make it special?', 'bonding', 'easy'),
('Letter of Love', 'Write heartfelt messages', 'reflection', 'Write a short letter to your parent/child expressing your love and appreciation. Share something you may not say often enough.', 'gratitude', 'deep'),
('Future Together', 'Envision your relationship', 'discussion', 'How do you want your relationship to be in 5 years? What can we both do to make that vision a reality?', 'understanding', 'deep');