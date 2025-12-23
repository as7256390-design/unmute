-- Cognitive Domains for tracking proficiency
CREATE TABLE public.cognitive_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('attention', 'memory', 'speed', 'flexibility', 'problem_solving')),
  proficiency_score NUMERIC NOT NULL DEFAULT 500,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  total_practice_time_seconds INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Game definitions (static reference)
CREATE TABLE public.cognitive_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  primary_domain TEXT NOT NULL CHECK (primary_domain IN ('attention', 'memory', 'speed', 'flexibility', 'problem_solving')),
  secondary_domain TEXT CHECK (secondary_domain IN ('attention', 'memory', 'speed', 'flexibility', 'problem_solving')),
  icon TEXT NOT NULL DEFAULT '🧠',
  min_duration_seconds INTEGER NOT NULL DEFAULT 60,
  max_duration_seconds INTEGER NOT NULL DEFAULT 180,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual game sessions
CREATE TABLE public.cognitive_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES public.cognitive_games(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  starting_difficulty NUMERIC NOT NULL DEFAULT 1.0,
  ending_difficulty NUMERIC,
  score INTEGER,
  accuracy NUMERIC,
  avg_reaction_time_ms INTEGER,
  correct_responses INTEGER DEFAULT 0,
  incorrect_responses INTEGER DEFAULT 0,
  domain_points_earned INTEGER DEFAULT 0,
  feedback_shown BOOLEAN DEFAULT false,
  session_data JSONB DEFAULT '{}'::jsonb
);

-- User's overall cognitive profile
CREATE TABLE public.cognitive_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_session_date DATE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_practice_time_seconds INTEGER NOT NULL DEFAULT 0,
  preferred_session_length TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Personal bests per game
CREATE TABLE public.cognitive_personal_bests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL REFERENCES public.cognitive_games(id) ON DELETE CASCADE,
  best_score INTEGER,
  best_accuracy NUMERIC,
  best_reaction_time_ms INTEGER,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE public.cognitive_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_personal_bests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cognitive_domains
CREATE POLICY "Users can view own domains" ON public.cognitive_domains FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own domains" ON public.cognitive_domains FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own domains" ON public.cognitive_domains FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cognitive_games (public read)
CREATE POLICY "Anyone can view active games" ON public.cognitive_games FOR SELECT USING (is_active = true);

-- RLS Policies for cognitive_sessions
CREATE POLICY "Users can view own sessions" ON public.cognitive_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.cognitive_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.cognitive_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cognitive_profiles
CREATE POLICY "Users can view own profile" ON public.cognitive_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.cognitive_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.cognitive_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cognitive_personal_bests
CREATE POLICY "Users can view own bests" ON public.cognitive_personal_bests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bests" ON public.cognitive_personal_bests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bests" ON public.cognitive_personal_bests FOR UPDATE USING (auth.uid() = user_id);

-- Seed initial games
INSERT INTO public.cognitive_games (name, slug, description, instructions, primary_domain, secondary_domain, icon) VALUES
('Pattern Match', 'pattern-match', 'Test your visual attention by identifying matching patterns quickly', 'Match the center pattern with one of the options. Speed and accuracy both matter.', 'attention', 'speed', '🎯'),
('Memory Grid', 'memory-grid', 'Remember the sequence and positions of items in a grid', 'Watch the highlighted cells, then recall them in order. The sequence grows as you improve.', 'memory', 'attention', '🔲'),
('Speed Sort', 'speed-sort', 'Rapidly categorize items under time pressure', 'Sort items into correct categories as fast as you can. Quick decisions are key.', 'speed', 'flexibility', '⚡'),
('Rule Switch', 'rule-switch', 'Adapt to changing rules and shift your thinking', 'Follow the current rule to respond. Rules change - stay flexible and adapt quickly.', 'flexibility', 'attention', '🔄'),
('Logic Chain', 'logic-chain', 'Solve increasingly complex logical sequences', 'Find the pattern and predict what comes next. Patterns become more abstract over time.', 'problem_solving', 'memory', '🧩');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_cognitive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cognitive_domains_updated_at
  BEFORE UPDATE ON public.cognitive_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_profiles_updated_at
  BEFORE UPDATE ON public.cognitive_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_cognitive_updated_at();