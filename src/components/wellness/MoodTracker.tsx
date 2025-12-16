import { useState } from 'react';
import { TrendingUp, Calendar, Download, ChevronLeft, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Very Low', color: 'bg-destructive' },
  { value: 2, emoji: '😞', label: 'Low', color: 'bg-warning' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'bg-hope' },
  { value: 4, emoji: '😊', label: 'Good', color: 'bg-safe' },
  { value: 5, emoji: '🌟', label: 'Great', color: 'bg-primary' },
];

const mockMoodHistory = [
  { date: subDays(new Date(), 6), mood: 3, note: 'Had a stressful exam' },
  { date: subDays(new Date(), 5), mood: 2, note: 'Couldn\'t sleep well' },
  { date: subDays(new Date(), 4), mood: 3, note: '' },
  { date: subDays(new Date(), 3), mood: 4, note: 'Good study session' },
  { date: subDays(new Date(), 2), mood: 3, note: 'Family called, felt better' },
  { date: subDays(new Date(), 1), mood: 4, note: 'Made a new friend' },
  { date: new Date(), mood: null, note: '' },
];

const patterns = [
  { type: 'spike', message: 'Your mood dropped on Tuesday. This often happens after exams.', severity: 'warning' },
  { type: 'positive', message: 'Your mood improved by 40% over the week!', severity: 'success' },
  { type: 'pattern', message: 'You feel better when you connect with family.', severity: 'info' },
];

const weeklyInsights = [
  { label: 'Average Mood', value: '3.2/5', change: '+0.4', positive: true },
  { label: 'Best Day', value: 'Saturday', change: '', positive: true },
  { label: 'Tough Days', value: '2', change: '-1', positive: true },
  { label: 'Check-ins', value: '6/7', change: '', positive: true },
];

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [moodHistory, setMoodHistory] = useState(mockMoodHistory);
  const [weekOffset, setWeekOffset] = useState(0);

  const handleLogMood = () => {
    if (!selectedMood) {
      toast.error('Please select how you\'re feeling');
      return;
    }

    const today = new Date();
    setMoodHistory(prev => prev.map(entry => 
      format(entry.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        ? { ...entry, mood: selectedMood, note: moodNote }
        : entry
    ));

    toast.success('Mood logged! Keep it up 💙');
    setSelectedMood(null);
    setMoodNote('');
  };

  const handleExport = () => {
    const data = moodHistory.map(entry => ({
      date: format(entry.date, 'yyyy-MM-dd'),
      mood: entry.mood,
      note: entry.note,
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

  const averageMood = moodHistory.filter(m => m.mood).reduce((acc, m) => acc + (m.mood || 0), 0) / moodHistory.filter(m => m.mood).length;

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
          disabled={!selectedMood}
        >
          Log Today's Mood
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {weeklyInsights.map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            {stat.change && (
              <Badge variant="secondary" className={cn(
                "mt-1 text-xs",
                stat.positive ? "bg-safe/20 text-safe" : "bg-destructive/20 text-destructive"
              )}>
                {stat.change}
              </Badge>
            )}
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
            <span className="text-sm text-muted-foreground">Week of {format(startOfWeek(subDays(new Date(), weekOffset * 7)), 'MMM d')}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-48 mb-4">
          {moodHistory.map((entry, index) => (
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
          <span className="text-muted-foreground">Average: <strong className="text-foreground">{averageMood.toFixed(1)}/5</strong></span>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Patterns & Insights */}
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
    </div>
  );
}