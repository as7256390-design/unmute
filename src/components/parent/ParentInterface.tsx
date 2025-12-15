import { useState } from 'react';
import { Users, BookOpen, MessageCircle, BarChart3, Heart, ArrowRight, Brain, Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const parentModules = [
  {
    id: 'understanding',
    title: 'Understanding Your Child',
    description: 'Learn about the emotional challenges students face today',
    icon: Brain,
    progress: 0,
    lessons: 5,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'communication',
    title: 'Better Communication',
    description: 'Bridge the gap and improve how you connect',
    icon: MessageCircle,
    progress: 0,
    lessons: 4,
    color: 'bg-support/10 text-support',
  },
  {
    id: 'pressure',
    title: 'Academic Pressure',
    description: 'Balance expectations without breaking your child',
    icon: GraduationCap,
    progress: 0,
    lessons: 4,
    color: 'bg-hope/10 text-hope',
  },
  {
    id: 'signs',
    title: 'Warning Signs',
    description: 'Recognize when your child needs extra support',
    icon: Heart,
    progress: 0,
    lessons: 3,
    color: 'bg-destructive/10 text-destructive',
  },
];

const parentRooms = [
  { name: 'Learning to Listen', members: 15, active: true },
  { name: 'Letting Go of Control', members: 12, active: true },
  { name: 'First-Gen Parent Support', members: 8, active: false },
];

const reflectionPrompts = [
  "How did your own upbringing shape your parenting style?",
  "What do you wish your parents had done differently?",
  "When was the last time you truly listened to your child without judgment?",
  "What triggers your strictness or anger with your child?",
];

export function ParentInterface() {
  const [activeTab, setActiveTab] = useState<'learn' | 'connect' | 'reflect' | 'tools'>('learn');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-support mb-4">
          <Users className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Parent Hub</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Understanding your child starts with understanding yourself. 
          Learn, reflect, and grow together.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { id: 'learn', label: 'Learning Modules', icon: BookOpen },
          { id: 'connect', label: 'Parent Circles', icon: Users },
          { id: 'reflect', label: 'Self-Reflection', icon: Brain },
          { id: 'tools', label: 'Tools', icon: BarChart3 },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Learning Modules */}
      {activeTab === 'learn' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">Your Learning Journey</span>
            </div>
            <Progress value={15} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              You've completed 3 of 16 lessons. Keep going!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {parentModules.map(module => (
              <div 
                key={module.id}
                className="glass rounded-2xl p-6 hover:shadow-medium transition-all cursor-pointer group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", module.color)}>
                  <module.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{module.lessons} lessons</Badge>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Start
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent Circles */}
      {activeTab === 'connect' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-2" />
              Connect with other parents facing similar challenges. Share experiences, 
              learn from each other, and grow together.
            </p>
          </div>

          <div className="space-y-4">
            {parentRooms.map(room => (
              <div key={room.name} className="glass rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">{room.members} parents</p>
                </div>
                <div className="flex items-center gap-3">
                  {room.active && (
                    <Badge variant="secondary" className="bg-safe/20 text-safe">
                      <span className="w-2 h-2 bg-safe rounded-full mr-1.5 animate-pulse" />
                      Active
                    </Badge>
                  )}
                  <Button variant="gradient" size="sm">Join</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <h3 className="font-display font-semibold mb-2">Can't find a circle for you?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Request a new parent circle topic and we'll create it once there's interest.
            </p>
            <Button variant="secondary">Suggest a Topic</Button>
          </div>
        </div>
      )}

      {/* Self-Reflection */}
      {activeTab === 'reflect' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <Brain className="h-4 w-4 inline mr-2" />
              Private journaling space to reflect on your parenting journey. 
              Your entries are never shared.
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Today's Reflection Prompt</h3>
            <p className="text-lg text-foreground mb-6 p-4 bg-support/10 rounded-xl">
              "{reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]}"
            </p>
            <Button variant="gradient" className="w-full">Start Journaling</Button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Parent Self-Assessment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Understand your parenting style, emotional availability, and areas for growth.
            </p>
            <Button variant="secondary" className="w-full gap-2">
              <Heart className="h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Alignment Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compare emotional perspectives with your child to identify connection gaps.
              </p>
              <Button variant="secondary" size="sm">Coming Soon</Button>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-support/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-support" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">AI Parent Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get answers to tough parenting questions from our compassionate AI.
              </p>
              <Button variant="gradient" size="sm">Ask a Question</Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-hope" />
              Parent Growth Badges
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track your progress and earn recognition for your commitment to growth.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: '🌱', name: 'First Step', earned: true },
                { icon: '👂', name: 'Active Listener', earned: false },
                { icon: '💬', name: 'Open Communicator', earned: false },
                { icon: '🌟', name: 'Empathy Champion', earned: false },
              ].map(badge => (
                <div 
                  key={badge.name}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl",
                    badge.earned ? "bg-primary/10" : "opacity-40 grayscale"
                  )}
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
