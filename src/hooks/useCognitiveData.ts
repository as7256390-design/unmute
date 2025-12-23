import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  CognitiveGame, 
  CognitiveDomainProgress, 
  CognitiveProfile,
  PersonalBest,
  CognitiveDomain,
  GameResult 
} from '@/types/cognitive';

export function useCognitiveGames() {
  return useQuery({
    queryKey: ['cognitive-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cognitive_games')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as CognitiveGame[];
    }
  });
}

export function useCognitiveProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['cognitive-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('cognitive_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as CognitiveProfile | null;
    },
    enabled: !!user?.id
  });

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cognitive_profiles')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-profile'] });
    }
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    createProfile: createProfileMutation.mutate
  };
}

export function useDomainProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const domainsQuery = useQuery({
    queryKey: ['cognitive-domains', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('cognitive_domains')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as CognitiveDomainProgress[];
    },
    enabled: !!user?.id
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ 
      domain, 
      pointsEarned, 
      practiceTime 
    }: { 
      domain: CognitiveDomain; 
      pointsEarned: number; 
      practiceTime: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Try to get existing domain record
      const { data: existing } = await supabase
        .from('cognitive_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', domain)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const newScore = Math.min(1000, existing.proficiency_score + pointsEarned * 0.5);
        const { error } = await supabase
          .from('cognitive_domains')
          .update({
            proficiency_score: newScore,
            sessions_completed: existing.sessions_completed + 1,
            total_practice_time_seconds: existing.total_practice_time_seconds + practiceTime,
            last_practiced_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('cognitive_domains')
          .insert({
            user_id: user.id,
            domain,
            proficiency_score: 500 + pointsEarned * 0.5,
            sessions_completed: 1,
            total_practice_time_seconds: practiceTime,
            last_practiced_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-domains'] });
    }
  });

  return {
    domains: domainsQuery.data || [],
    isLoading: domainsQuery.isLoading,
    updateDomain: updateDomainMutation.mutate
  };
}

export function usePersonalBests(gameId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bestsQuery = useQuery({
    queryKey: ['personal-bests', user?.id, gameId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('cognitive_personal_bests')
        .select('*')
        .eq('user_id', user.id);
      
      if (gameId) {
        query = query.eq('game_id', gameId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PersonalBest[];
    },
    enabled: !!user?.id
  });

  const updateBestMutation = useMutation({
    mutationFn: async ({ 
      gameId, 
      result 
    }: { 
      gameId: string; 
      result: GameResult;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('cognitive_personal_bests')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .maybeSingle();
      
      const shouldUpdate = !existing || 
        result.score > (existing.best_score || 0) ||
        result.accuracy > (existing.best_accuracy || 0) ||
        (result.avgReactionTime > 0 && result.avgReactionTime < (existing.best_reaction_time_ms || Infinity));
      
      if (shouldUpdate) {
        if (existing) {
          const { error } = await supabase
            .from('cognitive_personal_bests')
            .update({
              best_score: Math.max(result.score, existing.best_score || 0),
              best_accuracy: Math.max(result.accuracy, existing.best_accuracy || 0),
              best_reaction_time_ms: result.avgReactionTime > 0 
                ? Math.min(result.avgReactionTime, existing.best_reaction_time_ms || Infinity)
                : existing.best_reaction_time_ms,
              achieved_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('cognitive_personal_bests')
            .insert({
              user_id: user.id,
              game_id: gameId,
              best_score: result.score,
              best_accuracy: result.accuracy,
              best_reaction_time_ms: result.avgReactionTime > 0 ? result.avgReactionTime : null
            });
          
          if (error) throw error;
        }
      }
      
      return shouldUpdate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-bests'] });
    }
  });

  return {
    bests: bestsQuery.data || [],
    isLoading: bestsQuery.isLoading,
    updateBest: updateBestMutation.mutate
  };
}

export function useSessionHistory(gameId?: string, limit: number = 10) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['cognitive-sessions', user?.id, gameId, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('cognitive_sessions')
        .select('*')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit);
      
      if (gameId) {
        query = query.eq('game_id', gameId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const saveSessionMutation = useMutation({
    mutationFn: async ({ 
      gameId, 
      result, 
      startingDifficulty 
    }: { 
      gameId: string; 
      result: GameResult;
      startingDifficulty: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cognitive_sessions')
        .insert({
          user_id: user.id,
          game_id: gameId,
          completed_at: new Date().toISOString(),
          duration_seconds: result.durationSeconds,
          starting_difficulty: startingDifficulty,
          ending_difficulty: result.endingDifficulty,
          score: result.score,
          accuracy: result.accuracy,
          avg_reaction_time_ms: result.avgReactionTime,
          correct_responses: result.correctResponses,
          incorrect_responses: result.incorrectResponses,
          domain_points_earned: result.domainPointsEarned
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cognitive-profile'] });
    }
  });

  const recentAvgScore = sessionsQuery.data && sessionsQuery.data.length > 0
    ? sessionsQuery.data.reduce((sum, s) => sum + (s.score || 0), 0) / sessionsQuery.data.length
    : null;

  return {
    sessions: sessionsQuery.data || [],
    recentAvgScore,
    isLoading: sessionsQuery.isLoading,
    saveSession: saveSessionMutation.mutate
  };
}

export function useUpdateStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profile } = await supabase
        .from('cognitive_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!profile) {
        // Create profile
        await supabase
          .from('cognitive_profiles')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_session_date: today,
            total_sessions: 1
          });
        return;
      }
      
      let newStreak = 1;
      const lastDate = profile.last_session_date;
      
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(today);
        const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day, just increment sessions
          newStreak = profile.current_streak;
        } else if (diffDays === 1) {
          // Consecutive day
          newStreak = profile.current_streak + 1;
        }
        // Otherwise reset to 1
      }
      
      await supabase
        .from('cognitive_profiles')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, profile.longest_streak),
          last_session_date: today,
          total_sessions: profile.total_sessions + 1
        })
        .eq('id', profile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-profile'] });
    }
  });
}
