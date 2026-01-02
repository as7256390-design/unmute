-- Enable realtime for student_risk_profiles to support crisis alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_risk_profiles;