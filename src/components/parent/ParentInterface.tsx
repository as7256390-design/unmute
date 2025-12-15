import { useState } from 'react';
import { Users, BookOpen, MessageCircle, BarChart3, Heart, ArrowRight, Brain, Sparkles, GraduationCap, Lightbulb, HandHeart, CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const parentModules = [
  {
    id: 'understanding',
    title: 'Understanding Your Child\'s World',
    description: 'Learn about the emotional challenges students face today — academic pressure, social media, and identity struggles.',
    icon: Brain,
    progress: 0,
    lessons: 5,
    duration: '25 min',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'communication',
    title: 'Bridge the Communication Gap',
    description: 'Discover how to have meaningful conversations without triggering defensiveness.',
    icon: MessageCircle,
    progress: 0,
    lessons: 4,
    duration: '20 min',
    color: 'bg-support/10 text-support',
  },
  {
    id: 'pressure',
    title: 'Academic Pressure & Expectations',
    description: 'Balance high hopes without breaking your child\'s spirit or mental health.',
    icon: GraduationCap,
    progress: 0,
    lessons: 4,
    duration: '20 min',
    color: 'bg-hope/10 text-hope',
  },
  {
    id: 'signs',
    title: 'Recognizing Warning Signs',
    description: 'Learn to spot early signs of emotional distress and how to respond with care.',
    icon: Heart,
    progress: 0,
    lessons: 3,
    duration: '15 min',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    id: 'empathy',
    title: 'Empathy in Action',
    description: 'Practical exercises to develop deeper emotional understanding.',
    icon: HandHeart,
    progress: 0,
    lessons: 4,
    duration: '20 min',
    color: 'bg-safe/10 text-safe',
  },
  {
    id: 'triggers',
    title: 'Managing Your Own Triggers',
    description: 'Understand how your reactions affect your child and learn healthier responses.',
    icon: Lightbulb,
    progress: 0,
    lessons: 3,
    duration: '15 min',
    color: 'bg-calm/10 text-calm',
  },
];

const parentRooms = [
  { name: 'Learning to Listen', members: 15, active: true, description: 'Practice active listening with other parents' },
  { name: 'Letting Go of Control', members: 12, active: true, description: 'Balance guidance with independence' },
  { name: 'First-Gen Parent Support', members: 8, active: false, description: 'Unique challenges of first-generation parents' },
  { name: 'Exam Season Stress', members: 22, active: true, description: 'Supporting your child during high-pressure times' },
];

const reflectionPrompts = [
  "How did your own upbringing shape your parenting style today?",
  "What do you wish your parents had done differently for you?",
  "When was the last time you truly listened to your child without giving advice?",
  "What triggers your strictness or anger with your child?",
  "How do you respond when your child fails or makes mistakes?",
  "What pressures are you unknowingly passing on to your child?",
];

const empathyQuiz = [
  {
    question: "Your child comes home upset about a bad grade. What's your first response?",
    options: [
      { text: "Ask what happened and listen without judgment", score: 3 },
      { text: "Remind them to study harder next time", score: 1 },
      { text: "Feel disappointed and show it", score: 0 },
      { text: "Offer to help them understand the material", score: 2 },
    ],
  },
];

const badges = [
  { icon: '🌱', name: 'First Step', description: 'Started your journey', earned: true },
  { icon: '👂', name: 'Active Listener', description: 'Completed listening module', earned: false },
  { icon: '💬', name: 'Open Communicator', description: 'Joined a parent circle', earned: false },
  { icon: '🌟', name: 'Empathy Champion', description: 'Completed all modules', earned: false },
  { icon: '📝', name: 'Reflective Parent', description: '5 journal entries', earned: false },
  { icon: '🤝', name: 'Community Builder', description: 'Helped another parent', earned: false },
];

export function ParentInterface() {
  const [activeTab, setActiveTab] = useState<'learn' | 'connect' | 'reflect' | 'tools'>('learn');
  const [journalEntry, setJournalEntry] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const handleJournalSubmit = () => {
    if (journalEntry.trim()) {
      toast.success('Journal entry saved', {
        description: 'Your reflection has been recorded privately.',
      });
      setJournalEntry('');
      setCurrentPromptIndex((prev) => (prev + 1) % reflectionPrompts.length);
    }
  };

  const completedLessons = 3;
  const totalLessons = parentModules.reduce((sum, m) => sum + m.lessons, 0);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-support mb-4">
          <Users className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Parent Hub</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Understanding your child starts with understanding yourself. 
          This is a judgment-free space to learn, reflect, and grow together.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { id: 'learn', label: 'Learning Modules', icon: BookOpen },
          { id: 'connect', label: 'Parent Circles', icon: Users },
          { id: 'reflect', label: 'Self-Reflection', icon: Brain },
          { id: 'tools', label: 'Tools & Progress', icon: BarChart3 },
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Progress overview */}
          <div className="glass rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold">Your Learning Journey</span>
            </div>
            <Progress value={(completedLessons / totalLessons) * 100} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              You've completed {completedLessons} of {totalLessons} lessons. Every step counts!
            </p>
          </div>

          {/* Module grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentModules.map((module, index) => (
              <motion.div 
                key={module.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-5 hover:shadow-medium transition-all cursor-pointer group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", module.color)}>
                  <module.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{module.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">{module.lessons} lessons</Badge>
                    <Badge variant="outline" className="text-xs">{module.duration}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Parent Circles */}
      {activeTab === 'connect' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-2" />
              Connect with other parents who understand your journey. Share experiences, 
              learn from each other, and remember — you're not alone in this.
            </p>
          </div>

          <div className="space-y-3">
            {parentRooms.map((room, index) => (
              <motion.div 
                key={room.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold">{room.name}</h3>
                      {room.active && (
                        <Badge variant="secondary" className="bg-safe/20 text-safe">
                          <span className="w-1.5 h-1.5 bg-safe rounded-full mr-1.5 animate-pulse" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                    <p className="text-xs text-muted-foreground">{room.members} parents</p>
                  </div>
                  <Button variant="gradient" size="sm">Join</Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass rounded-xl p-6 text-center">
            <h3 className="font-display font-semibold mb-2">Can't find a circle for you?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Request a new parent circle topic and we'll create it once there's interest.
            </p>
            <Button variant="secondary">Suggest a Topic</Button>
          </div>
        </motion.div>
      )}

      {/* Self-Reflection */}
      {activeTab === 'reflect' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              <Brain className="h-4 w-4 inline mr-2" />
              This is your private journaling space. Your entries are never shared — 
              they're just for you to process and grow.
            </p>
          </div>

          {/* Journaling prompt */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Today's Reflection</h3>
            <div className="bg-support/10 rounded-xl p-4 mb-4">
              <p className="text-foreground italic">
                "{reflectionPrompts[currentPromptIndex]}"
              </p>
            </div>
            <Textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Take your time... there's no right or wrong answer here."
              className="min-h-[120px] mb-4"
            />
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setCurrentPromptIndex((prev) => (prev + 1) % reflectionPrompts.length)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Try a different prompt →
              </button>
              <Button onClick={handleJournalSubmit} disabled={!journalEntry.trim()}>
                Save Entry
              </Button>
            </div>
          </div>

          {/* Parent Self-Assessment */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-2">Parenting Style Assessment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Understand your parenting style, emotional availability, and areas for growth. 
              This assessment takes about 5 minutes.
            </p>
            <Button variant="secondary" className="w-full gap-2">
              <Heart className="h-4 w-4" />
              Take Assessment
            </Button>
          </div>

          {/* Empathy check-in */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-2">Quick Empathy Check</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A quick scenario-based check to reflect on your responses.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium mb-3">{empathyQuiz[0].question}</p>
              <div className="space-y-2">
                {empathyQuiz[0].options.map((option, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 rounded-lg bg-background hover:bg-primary/5 border border-border/50 hover:border-primary/30 transition-all text-sm"
                    onClick={() => toast.info('Great reflection! In a full assessment, we\'d track your patterns over time.')}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tools & Progress */}
      {activeTab === 'tools' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Tools grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Alignment Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Compare emotional perspectives with your child to identify connection gaps 
                and celebrate improvements.
              </p>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-support/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-support" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">AI Parent Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get answers to tough parenting questions from our compassionate AI. 
                No judgment, just guidance.
              </p>
              <Button variant="gradient" size="sm">Ask a Question</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-hope" />
              Your Growth Badges
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recognition for your commitment to becoming a more understanding parent.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {badges.map((badge) => (
                <div 
                  key={badge.name}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl text-center",
                    badge.earned ? "bg-primary/10" : "opacity-40 grayscale"
                  )}
                  title={badge.description}
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                  {badge.earned && <CheckCircle2 className="h-3 w-3 text-safe mt-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* Weekly insight */}
          <div className="glass rounded-2xl p-6 bg-gradient-to-br from-support/5 to-primary/5">
            <h3 className="font-display font-semibold mb-2">💡 This Week's Insight</h3>
            <p className="text-sm text-muted-foreground">
              "Children don't always need advice. Sometimes they just need to know 
              you hear them and that their feelings are valid."
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
