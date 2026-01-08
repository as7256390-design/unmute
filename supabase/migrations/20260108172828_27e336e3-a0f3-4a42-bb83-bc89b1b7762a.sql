-- Create crisis response log table
CREATE TABLE public.crisis_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_alert_id UUID REFERENCES public.crisis_alerts(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL,
  responder_user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'contacted_student', 'contacted_parent', 'assigned_counsellor', 'emergency_services', 'follow_up', 'resolved', 'escalated'
  action_details TEXT,
  outcome TEXT, -- 'successful', 'no_response', 'requires_follow_up', 'escalated', 'resolved'
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  notification_type TEXT, -- 'email', 'sms', 'both'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.crisis_response_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only institution admins, counsellors, and listeners can view/create response logs
CREATE POLICY "Admins can manage response logs"
ON public.crisis_response_logs
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'institution_admin') OR
  public.has_role(auth.uid(), 'counsellor') OR
  public.has_role(auth.uid(), 'listener')
)
WITH CHECK (
  public.has_role(auth.uid(), 'institution_admin') OR
  public.has_role(auth.uid(), 'counsellor') OR
  public.has_role(auth.uid(), 'listener')
);

-- Create admin notification preferences table for crisis alerts
CREATE TABLE public.admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  notify_by_email BOOLEAN DEFAULT true,
  notify_by_sms BOOLEAN DEFAULT false,
  notify_critical_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS  
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification settings
CREATE POLICY "Users can manage own notification settings"
ON public.admin_notification_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for crisis_response_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_response_logs;