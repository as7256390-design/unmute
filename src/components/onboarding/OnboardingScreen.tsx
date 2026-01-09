import { useState } from 'react';
import { Heart, Users, Sparkles, ArrowRight, Shield, MessageCircle, Brain, BookHeart, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const studentFeatures = [
  {
    icon: MessageCircle,
    title: 'Talk Freely',
    description: 'Share your thoughts with trained listeners who truly understand — without judgment.',
  },
  {
    icon: Shield,
    title: 'Completely Safe',
    description: 'Everything is anonymous and encrypted. Your privacy is sacred here.',
  },
  {
    icon: Sparkles,
    title: 'AI Companion',
    description: 'Get instant emotional support anytime with our compassionate AI assistant.',
  },
  {
    icon: Users,
    title: 'Peer Support Rooms',
    description: 'Join themed rooms with others facing similar challenges. You\'re not alone.',
  },
  {
    icon: BookHeart,
    title: 'Silent Journaling',
    description: 'Write privately at your pace. Request a gentle response if you need one.',
  },
  {
    icon: Brain,
    title: 'Track Your Growth',
    description: 'See your emotional patterns and celebrate your progress with badges.',
  },
];

const parentFeatures = [
  {
    icon: Brain,
    title: 'Understanding Modules',
    description: 'Learn about the emotional challenges students face in today\'s world.',
  },
  {
    icon: Headphones,
    title: 'Empathy Training',
    description: 'Develop skills to listen better and respond with compassion.',
  },
  {
    icon: Users,
    title: 'Parent Circles',
    description: 'Connect with other parents facing similar challenges. Share and grow.',
  },
  {
    icon: BookHeart,
    title: 'Self-Reflection',
    description: 'Journaling prompts to understand your own patterns and triggers.',
  },
];

const impactStats = [
  { number: '24/7', label: 'Always Available' },
  { number: '100%', label: 'Anonymous & Safe' },
  { number: '∞', label: 'Non-Judgmental' },
];

export function OnboardingScreen() {
  const { setCurrentView, setUserType } = useApp();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<'student' | 'parent' | null>(null);

  const handleUserTypeSelect = (type: 'student' | 'parent') => {
    setSelectedType(type);
    setStep(2);
  };

  const handleGetStarted = () => {
    if (selectedType) {
      setUserType(selectedType);
      if (selectedType === 'parent') {
        setCurrentView('parent');
      } else {
        setCurrentView('chat');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-support/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hope/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div 
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-hero shadow-glow mb-8"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Heart className="h-12 w-12 text-primary-foreground" />
              </motion.div>

              <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 text-foreground">
                Welcome to <span className="text-gradient">Aprivox</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                A safe space where your voice matters.
              </p>
              
              <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-8">
                We believe that no one should feel alone or unheard when going through emotional struggles. 
                You're brave for being here.
              </p>

              {/* Mission statement */}
              <div className="glass rounded-2xl p-6 max-w-2xl mx-auto mb-10">
                <p className="text-foreground italic">
                  "To listen before it's too late — because every voice deserves to be heard."
                </p>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-10">
                {impactStats.map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-display font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <Button 
                variant="gradient" 
                size="xl" 
                onClick={() => setStep(1)}
                className="gap-2"
              >
                Begin Your Journey
                <ArrowRight className="h-5 w-5" />
              </Button>

              <p className="text-sm text-muted-foreground mt-6">
                Free • Anonymous • Here for you whenever you need
              </p>
            </motion.div>
          )}

          {/* Step 1: Select User Type */}
          {step === 1 && (
            <motion.div
              key="select-type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="font-display text-4xl font-bold mb-4 text-foreground">
                Tell us about yourself
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                We've designed unique experiences for both students and parents.
              </p>
              <p className="text-muted-foreground/70 mb-12 max-w-lg mx-auto">
                Emotional well-being is a family journey. That's why Aprivox supports both generations 
                to understand each other better.
              </p>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Student Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUserTypeSelect('student')}
                  className="glass rounded-2xl p-8 text-left transition-all hover:shadow-glow hover:border-primary/50 group"
                >
                  <div className="w-16 h-16 rounded-2xl gradient-calm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">I'm a Student</h3>
                  <p className="text-muted-foreground mb-4">
                    Get the emotional support you deserve. Talk to listeners, join support rooms, 
                    or chat with our AI companion.
                  </p>
                  <ul className="text-sm text-muted-foreground/80 space-y-1">
                    <li>• Instant emotional first-aid</li>
                    <li>• Anonymous peer support</li>
                    <li>• Track your emotional growth</li>
                  </ul>
                </motion.button>

                {/* Parent Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUserTypeSelect('parent')}
                  className="glass rounded-2xl p-8 text-left transition-all hover:shadow-glow hover:border-support/50 group"
                >
                  <div className="w-16 h-16 rounded-2xl gradient-support flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-semibold mb-3">I'm a Parent</h3>
                  <p className="text-muted-foreground mb-4">
                    Understand your child better. Learn to communicate with empathy and 
                    strengthen your emotional connection.
                  </p>
                  <ul className="text-sm text-muted-foreground/80 space-y-1">
                    <li>• Empathy training modules</li>
                    <li>• Connect with other parents</li>
                    <li>• Self-reflection tools</li>
                  </ul>
                </motion.button>
              </div>

              <button 
                onClick={() => setStep(0)}
                className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Go back
              </button>
            </motion.div>
          )}

          {/* Step 2: Feature Overview */}
          {step === 2 && selectedType && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="font-display text-4xl font-bold mb-4 text-foreground">
                {selectedType === 'student' ? 'Here\'s what awaits you' : 'Your parenting journey starts here'}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                {selectedType === 'student' 
                  ? 'Tools designed to help you navigate your emotions and find support whenever you need it.'
                  : 'Resources to help you become more emotionally aware and strengthen your bond with your child.'
                }
              </p>

              <div className={cn(
                "grid gap-4 mb-10",
                selectedType === 'student' ? "md:grid-cols-3" : "md:grid-cols-2 max-w-3xl mx-auto"
              )}>
                {(selectedType === 'student' ? studentFeatures : parentFeatures).map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.08 }}
                    className="glass rounded-2xl p-5 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-base mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Important note */}
              <div className="glass rounded-xl p-4 max-w-xl mx-auto mb-8 text-left">
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Remember:</span>{' '}
                  {selectedType === 'student' 
                    ? 'Everything you share here is private and encrypted. No one can access your conversations without your permission.'
                    : 'Your journey here is about self-improvement and understanding. There\'s no judgment, only growth.'
                  }
                </p>
              </div>

              <Button 
                variant="gradient" 
                size="xl" 
                onClick={handleGetStarted}
                className="gap-2"
              >
                Let's Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>

              <button 
                onClick={() => setStep(1)}
                className="mt-6 block mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Choose differently
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
