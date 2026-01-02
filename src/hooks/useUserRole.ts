import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'student' | 'parent' | 'listener' | 'counsellor' | 'institution_admin';

interface UserRoleData {
  id: string;
  role: AppRole;
  institution_id: string | null;
  is_verified: boolean;
}

interface UseUserRoleReturn {
  roles: UserRoleData[];
  primaryRole: AppRole | null;
  hasRole: (role: AppRole) => boolean;
  isListener: boolean;
  isCounsellor: boolean;
  isInstitutionAdmin: boolean;
  isVerified: boolean;
  loading: boolean;
  requestRole: (role: AppRole, institutionId?: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role, institution_id, is_verified')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } else {
        setRoles((data || []) as UserRoleData[]);
      }
    } catch (err) {
      console.error('Error:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.some(r => r.role === role && r.is_verified);
  }, [roles]);

  const requestRole = useCallback(async (role: AppRole, institutionId?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role,
          institution_id: institutionId || null,
          is_verified: false,
        });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'You already have this role' };
        }
        return { success: false, error: error.message };
      }

      await fetchRoles();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [user, fetchRoles]);

  const primaryRole: AppRole | null = roles.length > 0 
    ? roles.find(r => r.is_verified)?.role || roles[0].role
    : null;

  const isListener = hasRole('listener');
  const isCounsellor = hasRole('counsellor');
  const isInstitutionAdmin = hasRole('institution_admin');
  const isVerified = roles.some(r => r.is_verified);

  return {
    roles,
    primaryRole,
    hasRole,
    isListener,
    isCounsellor,
    isInstitutionAdmin,
    isVerified,
    loading,
    requestRole,
    refetch: fetchRoles,
  };
}
