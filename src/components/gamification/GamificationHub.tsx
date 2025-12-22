import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flame, 
  Trophy, 
  Star, 
  Zap,
  Target,
  Calendar,
  Award,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_journal_entries: number;
  total_chat_sessions: number;
  total_breathing_exercises: number;
  total_grounding_exercises: number;
  xp_points: number;
  level: number;
  last_activity_date: string;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

const XP_PER_LEVEL = 100;

export function GamificationHub() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load user stats
    const { data: statsData } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsData) {
      setStats(statsData);
    } else {
      // Create initial stats
      const { data: newStats } = await supabase
        .from('user_gamification')
        .insert({ user_id: user.id })
        .select()
        .single();
      setStats(newStats);
    }

    // Load all badges
    const { data: badgesData } = await supabase
      .from('badges')
      .select('*')
      .order('requirement_value');

    if (badgesData) setBadges(badgesData);

    // Load earned badges
    const { data: earnedData } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (earnedData) setEarnedBadges(earnedData);

    setLoading(false);
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const xpInCurrentLevel = stats.xp_points % XP_PER_LEVEL;
    return (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  };

  const getXpToNextLevel = () => {
    if (!stats) return XP_PER_LEVEL;
    return XP_PER_LEVEL - (stats.xp_points % XP_PER_LEVEL);
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some(b => b.badge_id === badgeId);
  };

  const getBadgeProgress = (badge: BadgeData) => {
    if (!stats) return 0;
    const typeMapping: Record<string, number> = {
      'total_checkins': stats.total_checkins,
      'streak_days': stats.current_streak,
      'total_journal_entries': stats.total_journal_entries,
      'total_breathing': stats.total_breathing_exercises,
      'total_grounding': stats.total_grounding_exercises,
      'total_chats': stats.total_chat_sessions,
      'level': stats.level,
    };
    const current = typeMapping[badge.requirement_type] || 0;
    return Math.min((current / badge.requirement_value) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const dailyChallenges = [
    { id: 1, title: 'Daily Check-in', description: 'Log your mood today', xp: 10, icon: '📊', completed: false },
    { id: 2, title: 'Breathing Break', description: 'Complete one breathing exercise', xp: 15, icon: '🌬️', completed: false },
    { id: 3, title: 'Gratitude Moment', description: 'Write something you\'re grateful for', xp: 10, icon: '🙏', completed: false },
    { id: 4, title: 'Connect', description: 'Send a message in a support room', xp: 20, icon: '💬', completed: false },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-2">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <p className="text-3xl font-bold">{stats?.current_streak || 0}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-2">
              <Star className="h-7 w-7 text-white" />
            </div>
            <p className="text-3xl font-bold">{stats?.level || 1}</p>
            <p className="text-sm text-muted-foreground">Level</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mx-auto mb-2">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <p className="text-3xl font-bold">{stats?.xp_points || 0}</p>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <p className="text-3xl font-bold">{earnedBadges.length}</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="glass">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-medium">Level {stats?.level || 1}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getXpToNextLevel()} XP to Level {(stats?.level || 1) + 1}
            </span>
          </div>
          <Progress value={getLevelProgress()} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
          <TabsTrigger value="badges">Badges ({earnedBadges.length}/{badges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4 mt-4">
          <div className="grid gap-3">
            {dailyChallenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`glass ${challenge.completed ? 'border-safe/50 bg-safe/5' : ''}`}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{challenge.icon}</span>
                      <div>
                        <p className="font-medium">{challenge.title}</p>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={challenge.completed ? 'default' : 'secondary'}>
                        +{challenge.xp} XP
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge, i) => {
              const earned = isBadgeEarned(badge.id);
              const progress = getBadgeProgress(badge);

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`glass text-center ${earned ? 'border-primary/50' : 'opacity-70'}`}>
                    <CardContent className="pt-6 pb-4">
                      <div className="relative inline-block mb-3">
                        <span className={`text-4xl ${!earned && 'grayscale opacity-50'}`}>
                          {badge.icon}
                        </span>
                        {!earned && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                      {!earned && (
                        <Progress value={progress} className="h-1.5" />
                      )}
                      {earned && (
                        <Badge variant="default" className="bg-primary/20 text-primary text-xs">
                          Earned!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats?.total_checkins || 0}</p>
              <p className="text-xs text-muted-foreground">Check-ins</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_journal_entries || 0}</p>
              <p className="text-xs text-muted-foreground">Journal Entries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_breathing_exercises || 0}</p>
              <p className="text-xs text-muted-foreground">Breathing</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.longest_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
