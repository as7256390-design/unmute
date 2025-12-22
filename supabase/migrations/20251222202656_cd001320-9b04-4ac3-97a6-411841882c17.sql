-- =============================================
-- INSTITUTIONAL DASHBOARD & GAMIFICATION TABLES
-- =============================================

-- Institutions table for schools/colleges
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'school', -- school, college, coaching
  code TEXT UNIQUE NOT NULL, -- join code for students
  admin_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student-Institution mapping
CREATE TABLE public.institution_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- student, counselor, admin
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, user_id)
);

-- Anonymized mood aggregates for institutions
CREATE TABLE public.institution_mood_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_checkins INTEGER DEFAULT 0,
  avg_mood_score NUMERIC(3,2) DEFAULT 0,
  stress_high_count INTEGER DEFAULT 0,
  stress_medium_count INTEGER DEFAULT 0,
  stress_low_count INTEGER DEFAULT 0,
  crisis_alerts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, date)
);

-- User gamification stats
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_journal_entries INTEGER DEFAULT 0,
  total_chat_sessions INTEGER DEFAULT 0,
  total_breathing_exercises INTEGER DEFAULT 0,
  total_grounding_exercises INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Badges/Achievements
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- streak, milestone, activity, special
  requirement_type TEXT NOT NULL, -- streak_days, total_checkins, etc.
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Daily mood logs for analytics
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level TEXT, -- low, medium, high
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- GUIDED WELLNESS PROGRAMS
-- =============================================

CREATE TABLE public.wellness_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- anxiety, stress, depression, sleep, resilience
  duration_days INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.program_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.wellness_programs(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  exercise_type TEXT NOT NULL, -- breathing, journaling, meditation, activity
  exercise_content JSONB NOT NULL, -- detailed exercise instructions
  duration_minutes INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, day_number)
);

CREATE TABLE public.user_program_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.wellness_programs(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, completed, paused
  UNIQUE(user_id, program_id)
);

CREATE TABLE public.user_day_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, program_day_id)
);

-- =============================================
-- COUNSELOR BOOKING SYSTEM
-- =============================================

CREATE TABLE public.counselors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT[],
  bio TEXT,
  qualifications TEXT,
  experience_years INTEGER,
  is_available BOOLEAN DEFAULT true,
  session_duration_minutes INTEGER DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.counselor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.counseling_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_user_id UUID NOT NULL,
  counselor_id UUID NOT NULL REFERENCES public.counselors(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  notes TEXT,
  student_feedback TEXT,
  counselor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PEER LISTENER TRAINING
-- =============================================

CREATE TABLE public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL, -- slides, videos, quizzes
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  badge_id UUID REFERENCES public.badges(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, failed
  UNIQUE(user_id, module_id)
);

CREATE TABLE public.peer_listeners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMP WITH TIME ZONE,
  total_sessions INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SLEEP & RELAXATION CONTENT
-- =============================================

CREATE TABLE public.relaxation_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- sleep_story, ambient_sound, meditation, bedtime_routine
  duration_minutes INTEGER,
  audio_url TEXT,
  thumbnail_url TEXT,
  content_text TEXT,
  is_premium BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.relaxation_content(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN DEFAULT false
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_mood_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_day_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_listeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relaxation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_history ENABLE ROW LEVEL SECURITY;

-- Institutions policies
CREATE POLICY "Admins can manage their institutions" ON public.institutions
  FOR ALL USING (auth.uid() = admin_user_id);

CREATE POLICY "Members can view their institution" ON public.institutions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.institution_members WHERE institution_id = institutions.id AND user_id = auth.uid())
  );

-- Institution members policies
CREATE POLICY "Users can view institution members" ON public.institution_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.institutions WHERE id = institution_members.institution_id AND admin_user_id = auth.uid())
  );

CREATE POLICY "Users can join institutions" ON public.institution_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON public.institution_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.institutions WHERE id = institution_members.institution_id AND admin_user_id = auth.uid())
  );

-- Institution mood stats (admins only)
CREATE POLICY "Admins can view institution stats" ON public.institution_mood_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.institutions WHERE id = institution_mood_stats.institution_id AND admin_user_id = auth.uid())
  );

-- User gamification
CREATE POLICY "Users can view and update their gamification" ON public.user_gamification
  FOR ALL USING (auth.uid() = user_id);

-- Badges (public read)
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- User badges
CREATE POLICY "Users can view their badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mood logs
CREATE POLICY "Users can manage their mood logs" ON public.mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Wellness programs (public read)
CREATE POLICY "Anyone can view programs" ON public.wellness_programs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view program days" ON public.program_days
  FOR SELECT USING (true);

-- User program progress
CREATE POLICY "Users can manage their program progress" ON public.user_program_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their day completions" ON public.user_day_completions
  FOR ALL USING (auth.uid() = user_id);

-- Counselors (public read for available)
CREATE POLICY "Anyone can view available counselors" ON public.counselors
  FOR SELECT USING (is_available = true);

CREATE POLICY "Counselors can update their profile" ON public.counselors
  FOR UPDATE USING (auth.uid() = user_id);

-- Counselor availability
CREATE POLICY "Anyone can view counselor availability" ON public.counselor_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Counselors can manage their availability" ON public.counselor_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.counselors WHERE id = counselor_availability.counselor_id AND user_id = auth.uid())
  );

-- Counseling sessions
CREATE POLICY "Users can view their sessions" ON public.counseling_sessions
  FOR SELECT USING (
    student_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.counselors WHERE id = counseling_sessions.counselor_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can book sessions" ON public.counseling_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Users can update their sessions" ON public.counseling_sessions
  FOR UPDATE USING (
    student_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.counselors WHERE id = counseling_sessions.counselor_id AND user_id = auth.uid())
  );

-- Training modules (public read)
CREATE POLICY "Anyone can view training modules" ON public.training_modules
  FOR SELECT USING (true);

-- User training progress
CREATE POLICY "Users can manage their training progress" ON public.user_training_progress
  FOR ALL USING (auth.uid() = user_id);

-- Peer listeners
CREATE POLICY "Anyone can view certified listeners" ON public.peer_listeners
  FOR SELECT USING (is_certified = true AND is_active = true);

CREATE POLICY "Users can manage their listener profile" ON public.peer_listeners
  FOR ALL USING (auth.uid() = user_id);

-- Relaxation content (public read)
CREATE POLICY "Anyone can view relaxation content" ON public.relaxation_content
  FOR SELECT USING (true);

-- User content history
CREATE POLICY "Users can manage their content history" ON public.user_content_history
  FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counseling_sessions_updated_at BEFORE UPDATE ON public.counseling_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();