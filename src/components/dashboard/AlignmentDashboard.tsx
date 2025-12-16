import { useState } from 'react';
import { Users, TrendingUp, AlertTriangle, Heart, MessageCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const alignmentAreas = [
  { 
    id: 'academic', 
    label: 'Academic Expectations',
    studentScore: 3, // 1-5 scale
    parentScore: 4,
    description: 'How aligned are views on academic goals?'
  },
  { 
    id: 'career', 
    label: 'Career Choices',
    studentScore: 2,
    parentScore: 4,
    description: 'Agreement on future career path'
  },
  { 
    id: 'emotional', 
    label: 'Emotional Understanding',
    studentScore: 3,
    parentScore: 4,
    description: 'How well do parents understand feelings?'
  },
  { 
    id: 'communication', 
    label: 'Open Communication',
    studentScore: 2,
    parentScore: 3,
    description: 'Comfort level in sharing thoughts'
  },
  { 
    id: 'independence', 
    label: 'Independence',
    studentScore: 4,
    parentScore: 2,
    description: 'Views on personal freedom & decisions'
  },
];

const improvementTips = [
  {
    area: 'Career Choices',
    gap: 'high',
    tip: 'Try sharing a career interest article with your parent/child and discuss it together.',
    icon: '💼'
  },
  {
    area: 'Independence',
    gap: 'high',
    tip: 'Small steps help. Agree on one new responsibility the student can handle alone.',
    icon: '🌱'
  },
  {
    area: 'Communication',
    gap: 'medium',
    tip: 'Set a weekly 15-minute "no judgment" chat time. Just listen, don\'t solve.',
    icon: '💬'
  },
];

const weeklyProgress = [
  { week: 'Week 1', score: 45 },
  { week: 'Week 2', score: 52 },
  { week: 'Week 3', score: 58 },
  { week: 'This Week', score: 64 },
];

export function AlignmentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reflect'>('overview');
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, number>>({});

  const calculateGap = (student: number, parent: number) => Math.abs(student - parent);
  
  const getGapSeverity = (gap: number) => {
    if (gap <= 1) return { label: 'Aligned', color: 'bg-safe', textColor: 'text-safe' };
    if (gap === 2) return { label: 'Small Gap', color: 'bg-hope', textColor: 'text-hope' };
    return { label: 'Needs Attention', color: 'bg-warning', textColor: 'text-warning' };
  };

  const overallAlignment = Math.round(
    alignmentAreas.reduce((acc, area) => acc + (5 - calculateGap(area.studentScore, area.parentScore)), 0) / 
    alignmentAreas.length * 20
  );

  const handleReflectionChange = (id: string, value: number) => {
    setReflectionAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveReflection = () => {
    toast.success('Reflection saved! This helps improve your alignment score over time.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-support mb-4">
          <Users className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Family Alignment</h1>
        <p className="text-muted-foreground">
          Understanding the gaps between how you and your family see things
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 justify-center">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'reflect' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reflect')}
        >
          Reflect & Improve
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Overall Score */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Overall Alignment</h2>
              <Badge variant="secondary" className={cn(
                overallAlignment >= 70 ? "bg-safe/20 text-safe" :
                overallAlignment >= 50 ? "bg-hope/20 text-hope" :
                "bg-warning/20 text-warning"
              )}>
                {overallAlignment >= 70 ? 'Good' : overallAlignment >= 50 ? 'Growing' : 'Needs Work'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mb-2">
              <Progress value={overallAlignment} className="flex-1 h-4" />
              <span className="text-2xl font-display font-bold">{overallAlignment}%</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Based on how students and parents answered similar questions
            </p>
          </div>

          {/* Progress Over Time */}
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Progress
            </h2>
            
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyProgress.map((week, index) => (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium">{week.score}%</span>
                  <div 
                    className="w-full rounded-t-lg bg-primary transition-all"
                    style={{ height: `${week.score}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{week.week}</span>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-safe text-center mt-4">
              ↑ 19% improvement this month!
            </p>
          </div>

          {/* Area Breakdown */}
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-display font-semibold text-lg mb-4">Area Breakdown</h2>
            
            <div className="space-y-4">
              {alignmentAreas.map(area => {
                const gap = calculateGap(area.studentScore, area.parentScore);
                const severity = getGapSeverity(gap);
                
                return (
                  <div key={area.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{area.label}</span>
                      <Badge variant="secondary" className={cn(severity.color, "text-foreground")}>
                        {severity.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Student: {area.studentScore}/5</span>
                      <span>Parent: {area.parentScore}/5</span>
                      <span className={severity.textColor}>Gap: {gap}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvement Tips */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Ways to Grow Together
            </h2>
            
            <div className="space-y-3">
              {improvementTips.map((tip, index) => (
                <div key={index} className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tip.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{tip.area}</p>
                      <p className="text-sm text-muted-foreground">{tip.tip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Reflection Tab */
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg mb-2">Weekly Reflection</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Answer honestly. This helps track real progress, not just scores.
          </p>
          
          <div className="space-y-6">
            {[
              { id: 'listened', question: 'This week, I felt listened to by my family', emoji: '👂' },
              { id: 'understood', question: 'My family tried to understand my point of view', emoji: '💭' },
              { id: 'shared', question: 'I shared something important with my family', emoji: '💬' },
              { id: 'peaceful', question: 'We had at least one peaceful conversation', emoji: '☮️' },
            ].map(item => (
              <div key={item.id} className="space-y-3">
                <p className="font-medium flex items-center gap-2">
                  <span>{item.emoji}</span>
                  {item.question}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      onClick={() => handleReflectionChange(item.id, value)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border-2 transition-all text-sm",
                        reflectionAnswers[item.id] === value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {value === 1 ? 'Not at all' : value === 5 ? 'Very much' : value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="gradient" 
            className="w-full mt-6"
            onClick={handleSaveReflection}
          >
            Save This Week's Reflection
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Your answers are private. They help you see your own growth.
          </p>
        </div>
      )}

      {/* Privacy Note */}
      <div className="mt-6 glass rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-safe flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">100% Private</p>
          <p className="text-xs text-muted-foreground">
            Parents cannot see your individual answers. Only you see your data. 
            The alignment score is calculated without exposing anyone's specific responses.
          </p>
        </div>
      </div>
    </div>
  );
}