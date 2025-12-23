import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Calendar, Heart, Brain, Target, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/contexts/AppContext';
import { subDays, format, isSameDay } from 'date-fns';

interface UserStats {
  total_chat_sessions: number;
  total_journal_entries: number;
  total_checkins: number;
  current_streak: number;
  xp_points: number;
  level: number;
}

interface MoodLog {
  mood_score: number;
  logged_at: string;
}

interface UserBadge {
  id: string;
  badge: {
    name: string;
    description: string;
    icon: string;
  };
}

export function GrowthDashboard() {
  const { user } = useAuth();
  const { setCurrentView } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [moodData, setMoodData] = useState<{ day: string; value: number | null; emoji: string }[]>([]);
  const [badges, setBadges] = useState<{ id: string; name: string; description: string; icon: string; earned: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  const loadData = async () => {
    if (!user) return;

    // Load user gamification stats
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (gamification) {
      setStats({
        total_chat_sessions: gamification.total_chat_sessions || 0,
        total_journal_entries: gamification.total_journal_entries || 0,
        total_checkins: gamification.total_checkins || 0,
        current_streak: gamification.current_streak || 0,
        xp_points: gamification.xp_points || 0,
        level: gamification.level || 1,
      });
    }

    // Load mood data for chart
    const days = selectedPeriod === 'week' ? 7 : 30;
    const startDate = subDays(new Date(), days - 1);
    
    const { data: moods } = await supabase
      .from('mood_logs')
      .select('mood_score, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    // Generate mood data for last 7 days
    const moodMap = new Map((moods || []).map(m => [
      format(new Date(m.logged_at), 'yyyy-MM-dd'),
      m.mood_score
    ]));

    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const value = moodMap.get(dateKey) || null;
      return {
        day: format(date, 'EEE'),
        value,
        emoji: value ? getMoodEmoji(value) : '❓'
      };
    });

    setMoodData(chartData);

    // Load user badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('id, badge:badges(name, description, icon)')
      .eq('user_id', user.id);

    // Load all available badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('id, name, description, icon')
      .limit(6);

    const earnedBadgeIds = new Set((userBadges || []).map(ub => ub.badge?.name));
    
    const badgesList = (allBadges || []).map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      earned: earnedBadgeIds.has(b.name)
    }));

    // Add some default badges if none exist
    if (badgesList.length === 0) {
      setBadges([
        { id: '1', name: 'First Steps', description: 'Completed first session', icon: '🌱', earned: (stats?.total_chat_sessions || 0) > 0 },
        { id: '2', name: 'Journaler', description: 'Wrote 5 journal entries', icon: '📝', earned: (stats?.total_journal_entries || 0) >= 5 },
        { id: '3', name: 'Check-in Champ', description: '10 mood check-ins', icon: '💙', earned: (stats?.total_checkins || 0) >= 10 },
        { id: '4', name: 'Week Warrior', description: '7-day streak', icon: '🔥', earned: (stats?.current_streak || 0) >= 7 },
        { id: '5', name: 'Explorer', description: 'Tried 3 different tools', icon: '🧭', earned: false },
        { id: '6', name: 'Helper', description: 'Supported a peer', icon: '🤝', earned: false },
      ]);
    } else {
      setBadges(badgesList);
    }

    setLoading(false);
  };

  const getMoodEmoji = (value: number) => {
    const emojis: Record<number, string> = { 1: '😢', 2: '😞', 3: '😐', 4: '😊', 5: '🌟' };
    return emojis[value] || '😐';
  };

  const getMoodColor = (value: number | null) => {
    if (!value) return 'bg-muted';
    if (value >= 4) return 'bg-safe';
    if (value >= 3) return 'bg-hope';
    return 'bg-support';
  };

  // Generate insights based on data
  const insights = [];
  if (moodData.filter(d => d.value !== null).length >= 5) {
    const avg = moodData.filter(d => d.value).reduce((a, d) => a + (d.value || 0), 0) / moodData.filter(d => d.value).length;
    if (avg >= 3.5) {
      insights.push({ id: '1', type: 'positive', message: `Your average mood this week is ${avg.toFixed(1)}/5. Great job!` });
    }
  }
  if (stats && stats.current_streak >= 3) {
    insights.push({ id: '2', type: 'positive', message: `You're on a ${stats.current_streak}-day streak! Keep it going.` });
  }
  if (stats && stats.total_journal_entries > 0) {
    insights.push({ id: '3', type: 'tip', message: 'Regular journaling helps process emotions. Keep writing!' });
  }

  const earnedBadgesCount = badges.filter(b => b.earned).length;
  const streakProgress = stats ? Math.min((stats.current_streak / 7) * 100, 100) : 0;
  const daysToWeekWarrior = stats ? Math.max(7 - stats.current_streak, 0) : 7;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to see your progress</h2>
        <p className="text-muted-foreground">Track your growth journey.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-hero mb-4">
          <BarChart3 className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Your Growth Journey</h1>
        <p className="text-muted-foreground">
          Track your emotional progress and celebrate your wins
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Chat Sessions', value: stats?.total_chat_sessions || 0, icon: Heart, color: 'text-primary' },
          { label: 'Journal Entries', value: stats?.total_journal_entries || 0, icon: Brain, color: 'text-support' },
          { label: 'Badges Earned', value: earnedBadgesCount, icon: Award, color: 'text-hope' },
          { label: 'Day Streak', value: stats?.current_streak || 0, icon: Target, color: 'text-safe' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <stat.icon className={cn("h-6 w-6 mx-auto mb-2", stat.color)} />
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood Chart */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mood Tracker
            </h2>
            <div className="flex gap-1">
              <Button 
                variant={selectedPeriod === 'week' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                Week
              </Button>
              <Button 
                variant={selectedPeriod === 'month' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                Month
              </Button>
            </div>
          </div>
          
          {/* Chart */}
          <div className="flex items-end justify-between gap-2 h-40 mb-4">
            {moodData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-lg">{day.emoji}</span>
                <div 
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    getMoodColor(day.value)
                  )}
                  style={{ height: day.value ? `${(day.value / 5) * 100}%` : '10%' }}
                />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            {moodData.filter(d => d.value).length > 0 ? (
              <>Average mood: <strong className="text-foreground">
                {(moodData.filter(d => d.value).reduce((a, d) => a + (d.value || 0), 0) / moodData.filter(d => d.value).length).toFixed(1)}/5
              </strong></>
            ) : (
              'No mood data yet. Start logging!'
            )}
          </p>
        </div>

        {/* Badges */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-hope" />
            Your Badges
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            {badges.map(badge => (
              <div 
                key={badge.id}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all",
                  badge.earned 
                    ? "bg-primary/10" 
                    : "opacity-40 grayscale"
                )}
                title={badge.description}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className="text-xs font-medium text-center">{badge.name}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Next badge progress</span>
              <span className="text-sm text-muted-foreground">{stats?.current_streak || 0}/7 days</span>
            </div>
            <Progress value={streakProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {daysToWeekWarrior > 0 
                ? `${daysToWeekWarrior} more day${daysToWeekWarrior > 1 ? 's' : ''} to earn "Week Warrior" 🔥`
                : 'You earned Week Warrior! 🎉'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="glass rounded-2xl p-6 mt-6">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalized Insights
          </h2>
          
          <div className="space-y-3">
            {insights.map(insight => (
              <div 
                key={insight.id}
                className={cn(
                  "rounded-xl p-4",
                  insight.type === 'positive' ? "bg-safe/10 border border-safe/30" :
                  insight.type === 'pattern' ? "bg-support/10 border border-support/30" :
                  "bg-hope/10 border border-hope/30"
                )}
              >
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Button variant="gradient" className="gap-2" onClick={() => setCurrentView('mood')}>
          <Calendar className="h-4 w-4" />
          Log Today's Mood
        </Button>
        <Button variant="secondary" className="gap-2" onClick={() => setCurrentView('assessments')}>
          <Brain className="h-4 w-4" />
          Take Assessment
        </Button>
      </div>
    </div>
  );
}