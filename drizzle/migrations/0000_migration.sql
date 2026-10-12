DROP POLICY IF EXISTS "System can insert risk profiles" ON public.student_risk_profiles;
CREATE POLICY "Users insert own risk profile or staff insert" ON public.student_risk_profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'counsellor') OR public.has_role(auth.uid(),'institution_admin'));

DROP POLICY IF EXISTS "System can create assignments" ON public.counsellor_assignments;
CREATE POLICY "Staff can create assignments" ON public.counsellor_assignments
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'counsellor') OR public.has_role(auth.uid(),'institution_admin') OR public.has_role(auth.uid(),'listener'));

DROP POLICY IF EXISTS "Anyone can view rooms" ON public.support_rooms;
CREATE POLICY "Signed-in users can view rooms" ON public.support_rooms
FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.support_rooms FROM anon;