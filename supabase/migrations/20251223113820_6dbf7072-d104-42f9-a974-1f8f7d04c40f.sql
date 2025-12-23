-- Parent-related tables for full functionality

-- Parent journal entries table
CREATE TABLE IF NOT EXISTS public.parent_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their parent journal entries"
ON public.parent_journal_entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Parent module progress table
CREATE TABLE IF NOT EXISTS public.parent_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.parent_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their parent module progress"
ON public.parent_module_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Parent badges table
CREATE TABLE IF NOT EXISTS public.parent_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.parent_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their parent badges"
ON public.parent_badges FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Parent-child connections table
CREATE TABLE IF NOT EXISTS public.parent_child_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  child_user_id UUID NOT NULL,
  connection_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, connected, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(parent_user_id, child_user_id)
);

ALTER TABLE public.parent_child_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their connections"
ON public.parent_child_connections FOR ALL
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Children can view and accept connections"
ON public.parent_child_connections FOR SELECT
USING (auth.uid() = child_user_id);

CREATE POLICY "Children can update connection status"
ON public.parent_child_connections FOR UPDATE
USING (auth.uid() = child_user_id)
WITH CHECK (auth.uid() = child_user_id);

-- Alignment responses table (for parent-student alignment dashboard)
CREATE TABLE IF NOT EXISTS public.alignment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.parent_child_connections(id),
  area_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  user_type TEXT NOT NULL CHECK (user_type IN ('parent', 'student')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id, connection_id)
);

ALTER TABLE public.alignment_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alignment responses"
ON public.alignment_responses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Connected users can view each other's alignment"
ON public.alignment_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_connections 
    WHERE id = connection_id 
    AND status = 'connected'
    AND (parent_user_id = auth.uid() OR child_user_id = auth.uid())
  )
);

-- Weekly reflection responses table
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.parent_child_connections(id),
  week_start DATE NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, connection_id)
);

ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their weekly reflections"
ON public.weekly_reflections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Child mood sharing preferences (for parents to see child's emotional state)
CREATE TABLE IF NOT EXISTS public.child_mood_sharing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.parent_child_connections(id) NOT NULL,
  share_mood BOOLEAN NOT NULL DEFAULT false,
  share_mood_history BOOLEAN NOT NULL DEFAULT false,
  share_weekly_summary BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_user_id, connection_id)
);

ALTER TABLE public.child_mood_sharing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Children can manage their sharing preferences"
ON public.child_mood_sharing FOR ALL
USING (auth.uid() = child_user_id)
WITH CHECK (auth.uid() = child_user_id);

CREATE POLICY "Parents can view sharing preferences for their connections"
ON public.child_mood_sharing FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_connections 
    WHERE id = connection_id 
    AND parent_user_id = auth.uid()
    AND status = 'connected'
  )
);