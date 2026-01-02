-- Create app_role enum type for role-based authentication
CREATE TYPE public.app_role AS ENUM ('student', 'parent', 'listener', 'counsellor', 'institution_admin');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_verified = true
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id AND is_verified = true
  ORDER BY 
    CASE role 
      WHEN 'counsellor' THEN 1 
      WHEN 'institution_admin' THEN 2 
      WHEN 'listener' THEN 3 
      WHEN 'parent' THEN 4 
      WHEN 'student' THEN 5 
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Institution admins can view roles in their institution"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  institution_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.institutions 
    WHERE id = institution_id 
    AND admin_user_id = auth.uid()
  )
);

CREATE POLICY "Users can request roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Institution admins can verify roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  institution_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.institutions 
    WHERE id = institution_id 
    AND admin_user_id = auth.uid()
  )
);

-- Create student_risk_profiles table for tracking at-risk students
CREATE TABLE public.student_risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    suicide_roadmap_stage TEXT CHECK (suicide_roadmap_stage IN ('trigger', 'spiral', 'distortions', 'isolation', 'ideation', 'planning', 'action')),
    last_crisis_detected_at TIMESTAMP WITH TIME ZONE,
    crisis_count INTEGER DEFAULT 0,
    needs_counselling BOOLEAN DEFAULT false,
    assigned_counsellor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_listener_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    last_mood_score INTEGER,
    emotional_pattern JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on student_risk_profiles
ALTER TABLE public.student_risk_profiles ENABLE ROW LEVEL SECURITY;

-- Create counsellor_assignments table
CREATE TABLE public.counsellor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    counsellor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listener_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    reason TEXT,
    risk_level TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on counsellor_assignments
ALTER TABLE public.counsellor_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_risk_profiles
CREATE POLICY "Students can view their own risk profile"
ON public.student_risk_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Counsellors can view assigned students"
ON public.student_risk_profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'counsellor') 
  OR public.has_role(auth.uid(), 'institution_admin')
);

CREATE POLICY "System can insert risk profiles"
ON public.student_risk_profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Counsellors and admins can update risk profiles"
ON public.student_risk_profiles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'counsellor')
  OR public.has_role(auth.uid(), 'institution_admin')
);

-- RLS policies for counsellor_assignments
CREATE POLICY "Counsellors can view their assignments"
ON public.counsellor_assignments FOR SELECT
TO authenticated
USING (
  counsellor_user_id = auth.uid()
  OR listener_user_id = auth.uid()
  OR student_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'institution_admin')
);

CREATE POLICY "Counsellors can update their assignments"
ON public.counsellor_assignments FOR UPDATE
TO authenticated
USING (
  counsellor_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'institution_admin')
);

CREATE POLICY "System can create assignments"
ON public.counsellor_assignments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger for updating student_risk_profiles updated_at
CREATE TRIGGER update_student_risk_profiles_updated_at
BEFORE UPDATE ON public.student_risk_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update risk profile on crisis detection
CREATE OR REPLACE FUNCTION public.update_risk_on_crisis()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert risk profile
  INSERT INTO public.student_risk_profiles (user_id, risk_level, last_crisis_detected_at, crisis_count, needs_counselling)
  VALUES (
    NEW.user_id,
    NEW.severity,
    NEW.created_at,
    1,
    CASE WHEN NEW.severity IN ('high', 'critical') THEN true ELSE false END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    risk_level = CASE 
      WHEN NEW.severity = 'critical' THEN 'critical'
      WHEN NEW.severity = 'high' AND student_risk_profiles.risk_level != 'critical' THEN 'high'
      ELSE student_risk_profiles.risk_level
    END,
    last_crisis_detected_at = NEW.created_at,
    crisis_count = student_risk_profiles.crisis_count + 1,
    needs_counselling = CASE WHEN NEW.severity IN ('high', 'critical') THEN true ELSE student_risk_profiles.needs_counselling END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on crisis_alerts to update risk profiles
CREATE TRIGGER on_crisis_alert_update_risk
AFTER INSERT ON public.crisis_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_risk_on_crisis();