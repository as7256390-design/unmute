-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'parent', 'listener')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create support rooms table
CREATE TABLE public.support_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" ON public.support_rooms FOR SELECT USING (true);

-- Create room memberships table
CREATE TABLE public.room_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.support_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their memberships" ON public.room_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join rooms" ON public.room_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_memberships FOR DELETE USING (auth.uid() = user_id);

-- Create room messages table
CREATE TABLE public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.support_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Only room members can see messages
CREATE POLICY "Room members can view messages" ON public.room_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.room_memberships WHERE room_id = room_messages.room_id AND user_id = auth.uid()));
CREATE POLICY "Room members can send messages" ON public.room_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.room_memberships WHERE room_id = room_messages.room_id AND user_id = auth.uid()));

-- Create AI chat conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  emotional_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Create AI chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create crisis alerts table for flagged content
CREATE TABLE public.crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('chat', 'room', 'journal', 'wall')),
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  keywords_matched TEXT[],
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Only allow insert, no read by regular users (for safety)
CREATE POLICY "System can create alerts" ON public.crisis_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for room messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default support rooms
INSERT INTO public.support_rooms (name, emoji, description, category) VALUES
  ('Exam Panic Zone', '📚', 'Feeling overwhelmed by exams? Join others who understand.', 'academic'),
  ('Social Anxiety Circle', '🫂', 'A safe space for those who find social situations challenging.', 'anxiety'),
  ('Let''s Just Talk', '💬', 'No specific topic. Just chat about life, feelings, anything.', 'general'),
  ('Relationship Pain', '💔', 'Heartbreak, family issues, friendship struggles - all welcome.', 'relationships'),
  ('LGBTQ+ Safe Space', '🏳️‍🌈', 'A supportive community for LGBTQ+ students.', 'identity'),
  ('Career Confusion', '🎯', 'Not sure about your future? Let''s figure it out together.', 'career'),
  ('Living Away from Home', '🏠', 'For students dealing with homesickness and independence.', 'lifestyle'),
  ('Late Night Thoughts', '🌙', 'Can''t sleep? Overthinking? You''re not alone tonight.', 'general'),
  ('Parent Pressure', '👨‍👩‍👧', 'Dealing with expectations and family dynamics.', 'family');