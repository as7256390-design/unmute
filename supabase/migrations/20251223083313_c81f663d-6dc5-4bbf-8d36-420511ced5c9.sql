-- Drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Members can view their institution" ON public.institutions;
DROP POLICY IF EXISTS "Admins can manage their institutions" ON public.institutions;
DROP POLICY IF EXISTS "Admins can manage members" ON public.institution_members;
DROP POLICY IF EXISTS "Users can view institution members" ON public.institution_members;

-- Recreate institutions policies without circular reference
CREATE POLICY "Admins can manage their institutions" 
ON public.institutions 
FOR ALL 
USING (auth.uid() = admin_user_id)
WITH CHECK (auth.uid() = admin_user_id);

-- Simple SELECT policy for institutions - allow anyone to see institutions they're a member of
-- Use a subquery that doesn't trigger institution_members policies
CREATE POLICY "Members can view their institution" 
ON public.institutions 
FOR SELECT 
USING (
  admin_user_id = auth.uid() 
  OR id IN (
    SELECT institution_id FROM public.institution_members WHERE user_id = auth.uid()
  )
);

-- Recreate institution_members policies without circular reference
CREATE POLICY "Users can view own membership" 
ON public.institution_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view institution members" 
ON public.institution_members 
FOR SELECT 
USING (
  institution_id IN (
    SELECT id FROM public.institutions WHERE admin_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage institution members" 
ON public.institution_members 
FOR ALL 
USING (
  institution_id IN (
    SELECT id FROM public.institutions WHERE admin_user_id = auth.uid()
  )
)
WITH CHECK (
  institution_id IN (
    SELECT id FROM public.institutions WHERE admin_user_id = auth.uid()
  )
);