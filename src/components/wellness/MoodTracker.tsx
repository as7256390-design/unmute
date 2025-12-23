import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Low', color: 'bg-destructive' },
  { value: 2, emoji: '😞', label: 'Low', color: 'bg-warning' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'bg-hope' },
  { value: 4, emoji: '😊', label: 'Good', color: 'bg-safe' },
  { value: 5, emoji: '🌟', label: 'Great', color: 'bg-primary' },
];

interface MoodLog {
  id: string;
  mood_score: number;
  notes: string | null;
  logged_at: string;
  stress_level: string | null;
  energy_level: number | null;
}

export function MoodTracker() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadMoodHistory();
    } else {
      setLoading(false);
    }
  }, [user, weekOffset]);

  const loadMoodHistory = async () => {
    if (!user) return;

    const startDate = subDays(startOfWeek(new Date()), weekOffset * 7);
    const endDate = addDays(startDate, 7);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('Error loading mood history:', error);
    } else {
      setMoodHistory(data || []);
    }
    setLoading(false);
  };

  const handleLogMood = async () => {
    if (!selectedMood || !user) {
      toast.error('Please select how you\'re feeling');
      return;
    }

    setSubmitting(true);

    // Check if already logged today
    const today = new Date();
    const existingToday = moodHistory.find(m => 
      isSameDay(new Date(m.logged_at), today)
    );

    if (existingToday) {
      // Update existing entry
      const { error } = await supabase
        .from('mood_logs')
        .update({ mood_score: selectedMood, notes: moodNote || null })
        .eq('id', existingToday.id);

      if (error) {
        toast.error('Failed to update mood');
      } else {
        toast.success('Mood updated! 💙');
        await loadMoodHistory();
      }
    } else {
      // Create new entry
      const { error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: user.id,
          mood_score: selectedMood,
          notes: moodNote || null
        });

      if (error) {
        toast.error('Failed to log mood');
      } else {
        toast.success('Mood logged! Keep it up 💙');
        await loadMoodHistory();
        
        // Update gamification
        const { data: stats } = await supabase
          .from('user_gamification')
          .select('total_checkins, xp_points')
          .eq('user_id', user.id)
          .single();

        if (stats) {
          await supabase
            .from('user_gamification')
            .update({ 
              total_checkins: (stats.total_checkins || 0) + 1,
              xp_points: (stats.xp_points || 0) + 5
            })
            .eq('user_id', user.id);
        }
      }
    }

    setSelectedMood(null);
    setMoodNote('');
    setSubmitting(false);
  };

  const handleExport = () => {
    const data = moodHistory.map(entry => ({
      date: format(new Date(entry.logged_at), 'yyyy-MM-dd'),
      mood: entry.mood_score,
      note: entry.notes,
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    toast.success('Mood history exported!');
  };

  const getMoodEmoji = (value: number | null) => {
    if (!value) return '❓';
    return moodEmojis.find(m => m.value === value)?.emoji || '😐';
  };

  const getMoodColor = (value: number | null) => {
    if (!value) return 'bg-muted';
    return moodEmojis.find(m => m.value === value)?.color || 'bg-muted';
  };

  // Generate week data
  const weekStart = subDays(startOfWeek(new Date()), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const log = moodHistory.find(m => isSameDay(new Date(m.logged_at), date));
    return { date, mood: log?.mood_score || null, note: log?.notes || '' };
  });

  const moodsWithValues = weekDays.filter(d => d.mood !== null);
  const averageMood = moodsWithValues.length > 0 
    ? moodsWithValues.reduce((acc, d) => acc + (d.mood || 0), 0) / moodsWithValues.length 
    : 0;

  // Calculate insights
  const checkinsThisWeek = moodsWithValues.length;
  const bestDay = weekDays.reduce((best, day) => 
    (day.mood || 0) > (best.mood || 0) ? day : best
  , weekDays[0]);
  const toughDays = weekDays.filter(d => d.mood && d.mood <= 2).length;

  const weeklyInsights = [
    { label: 'Average Mood', value: averageMood > 0 ? `${averageMood.toFixed(1)}/5` : '—', change: '', positive: true },
    { label: 'Best Day', value: bestDay.mood ? format(bestDay.date, 'EEEE') : '—', change: '', positive: true },
    { label: 'Tough Days', value: toughDays.toString(), change: '', positive: toughDays === 0 },
    { label: 'Check-ins', value: `${checkinsThisWeek}/7`, change: '', positive: checkinsThisWeek >= 5 },
  ];

  // Generate patterns based on data
  const patterns = [];
  if (averageMood > 0 && averageMood >= 3.5) {
    patterns.push({ type: 'positive', message: `Your average mood this week is ${averageMood.toFixed(1)}! Keep up the good work.`, severity: 'success' });
  }
  if (toughDays > 0) {
    patterns.push({ type: 'spike', message: `You had ${toughDays} tough day${toughDays > 1 ? 's' : ''} this week. Remember, it's okay to have hard days.`, severity: 'warning' });
  }
  if (checkinsThisWeek >= 5) {
    patterns.push({ type: 'pattern', message: 'Great consistency! Regular check-ins help you understand yourself better.', severity: 'info' });
  } else if (checkinsThisWeek > 0) {
    patterns.push({ type: 'pattern', message: `You've checked in ${checkinsThisWeek} time${checkinsThisWeek > 1 ? 's' : ''} this week. Try to log daily!`, severity: 'info' });
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to track your mood</h2>
        <p className="text-muted-foreground">See patterns and understand yourself better.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-hope mb-4">
          <TrendingUp className="h-7 w-7 text-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Mood Tracker</h1>
        <p className="text-muted-foreground">
          Track how you feel daily. See patterns. Understand yourself better.
        </p>
      </div>

      {/* Today's Check-in */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display font-semibold text-lg mb-4">How are you feeling today?</h2>
        
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {moodEmojis.map(mood => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[80px]",
                selectedMood === mood.value
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-3xl mb-1">{mood.emoji}</span>
              <span className="text-xs text-muted-foreground">{mood.label}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Add a note (optional) - What happened today?"
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-sm mb-4"
        />

        <Button 
          variant="gradient" 
          className="w-full"
          onClick={handleLogMood}
          disabled={!selectedMood || submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Log Today's Mood
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {weeklyInsights.map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Mood Chart */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Week of {format(weekStart, 'MMM d')}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-2 h-48 mb-4">
              {weekDays.map((entry, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                  <div 
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      getMoodColor(entry.mood)
                    )}
                    style={{ height: entry.mood ? `${(entry.mood / 5) * 100}%` : '10%' }}
                  />
                  <span className="text-xs text-muted-foreground">{format(entry.date, 'EEE')}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Average: <strong className="text-foreground">{averageMood > 0 ? `${averageMood.toFixed(1)}/5` : '—'}</strong>
              </span>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={moodHistory.length === 0}>
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Patterns & Insights */}
      {patterns.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            What We Notice
          </h2>

          <div className="space-y-3">
            {patterns.map((pattern, index) => (
              <div 
                key={index}
                className={cn(
                  "rounded-xl p-4 flex items-start gap-3",
                  pattern.severity === 'warning' && "bg-warning/10 border border-warning/30",
                  pattern.severity === 'success' && "bg-safe/10 border border-safe/30",
                  pattern.severity === 'info' && "bg-primary/10 border border-primary/30"
                )}
              >
                {pattern.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />}
                {pattern.severity === 'success' && <TrendingUp className="h-5 w-5 text-safe flex-shrink-0" />}
                {pattern.severity === 'info' && <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />}
                <p className="text-sm">{pattern.message}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            These patterns are based on your mood logs. The more you log, the better insights we can give.
          </p>
        </div>
      )}
    </div>
  );
}