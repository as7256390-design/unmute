-- Previous attempt failed with:
-- ERROR:  0A000: extension "pg_net" does not support SET SCHEMA
-- This migration focuses on fixing institution RLS recursion.

-- SECURITY DEFINER helper functions to avoid recursive RLS checks
CREATE OR REPLACE FUNCTION public.is_institution_admin(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institutions i
    WHERE i.id = _institution_id
      AND i.admin_user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_institution_member(_user_id uuid, _institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institution_members m
    WHERE m.institution_id = _institution_id
      AND m.user_id = _user_id
  )
$$;

-- Drop policies that can cause recursion/overlap
DROP POLICY IF EXISTS "Admins can manage their institutions" ON public.institutions;
DROP POLICY IF EXISTS "Members can view their institution" ON public.institutions;

DROP POLICY IF EXISTS "Admins can manage members" ON public.institution_members;
DROP POLICY IF EXISTS "Users can view institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can view institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can manage institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can update/delete institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can update institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can delete institution members" ON public.institution_members;
DROP POLICY IF EXISTS "Admins can insert institution members" ON public.institution_members;

-- Institutions
CREATE POLICY "Admins can manage their institutions"
ON public.institutions
FOR ALL
TO authenticated
USING (auth.uid() = admin_user_id)
WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Members can view their institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (
  auth.uid() = admin_user_id
  OR public.is_institution_member(auth.uid(), id)
);

-- Institution members (keep existing join policy if present: "Users can join institutions")
CREATE POLICY "Users can view own membership"
ON public.institution_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view institution members"
ON public.institution_members
FOR SELECT
TO authenticated
USING (public.is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Admins can update institution members"
ON public.institution_members
FOR UPDATE
TO authenticated
USING (public.is_institution_admin(auth.uid(), institution_id))
WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Admins can delete institution members"
ON public.institution_members
FOR DELETE
TO authenticated
USING (public.is_institution_admin(auth.uid(), institution_id));

CREATE POLICY "Admins can insert institution members"
ON public.institution_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_institution_admin(auth.uid(), institution_id));