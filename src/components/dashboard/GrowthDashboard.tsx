import { useState } from 'react';
import { BarChart3, TrendingUp, Award, Calendar, Heart, Brain, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const moodData = [
  { day: 'Mon', value: 3, emoji: '😢' },
  { day: 'Tue', value: 4, emoji: '😐' },
  { day: 'Wed', value: 3, emoji: '😟' },
  { day: 'Thu', value: 5, emoji: '😊' },
  { day: 'Fri', value: 4, emoji: '😌' },
  { day: 'Sat', value: 6, emoji: '🌟' },
  { day: 'Sun', value: 5, emoji: '😊' },
];

const badges = [
  { id: '1', name: 'First Steps', description: 'Completed first session', icon: '🌱', earned: true },
  { id: '2', name: 'Spoke Honestly', description: 'Shared something difficult', icon: '💬', earned: true },
  { id: '3', name: 'Supported a Peer', description: 'Helped someone on the wall', icon: '🤝', earned: true },
  { id: '4', name: 'Week Warrior', description: '7-day streak of check-ins', icon: '🔥', earned: false },
  { id: '5', name: 'Deep Dive', description: 'Completed emotional profile', icon: '🌊', earned: false },
  { id: '6', name: 'Listener Star', description: 'Became a verified listener', icon: '⭐', earned: false },
];

const insights = [
  { id: '1', type: 'pattern', message: 'Tuesdays tend to be harder for you. Consider scheduling something enjoyable.' },
  { id: '2', type: 'positive', message: 'Your mood has improved 15% compared to last week!' },
  { id: '3', type: 'tip', message: 'Journaling before bed might help with your racing thoughts.' },
];

export function GrowthDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

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
          { label: 'Sessions', value: '12', icon: Heart, color: 'text-primary' },
          { label: 'Journal Entries', value: '8', icon: Brain, color: 'text-support' },
          { label: 'Badges Earned', value: '3', icon: Award, color: 'text-hope' },
          { label: 'Day Streak', value: '5', icon: Target, color: 'text-safe' },
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
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-lg">{day.emoji}</span>
                <div 
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    day.value >= 5 ? "bg-safe" : day.value >= 3 ? "bg-hope" : "bg-support"
                  )}
                  style={{ height: `${(day.value / 6) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Average mood: <strong className="text-foreground">4.3/6</strong> (Improving!)
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
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <p className="text-xs font-medium text-center">{badge.name}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Next badge progress</span>
              <span className="text-sm text-muted-foreground">5/7 days</span>
            </div>
            <Progress value={71} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              2 more days to earn "Week Warrior" 🔥
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Button variant="gradient" className="gap-2">
          <Calendar className="h-4 w-4" />
          Log Today's Mood
        </Button>
        <Button variant="secondary" className="gap-2">
          <Brain className="h-4 w-4" />
          Take PHQ-9 Recheck
        </Button>
      </div>
    </div>
  );
}
