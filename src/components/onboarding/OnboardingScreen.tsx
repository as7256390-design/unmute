import { useState } from 'react';
import { Heart, Users, Sparkles, ArrowRight, Shield, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: MessageCircle,
    title: 'Talk Freely',
    description: 'Connect with trained listeners who understand your struggles without judgment.',
  },
  {
    icon: Shield,
    title: 'Completely Safe',
    description: 'Your privacy is sacred. Everything is anonymous and encrypted.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Support',
    description: 'Get instant emotional guidance with our compassionate AI assistant.',
  },
];

export function OnboardingScreen() {
  const { setCurrentView, setUserType } = useApp();
  const [step, setStep] = useState(0);

  const handleUserTypeSelect = (type: 'student' | 'parent') => {
    setUserType(type);
    if (type === 'parent') {
      setCurrentView('parent');
    } else {
      setCurrentView('chat');
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

      <div className="relative z-10 w-full max-w-4xl">
        <AnimatePresence mode="wait">
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
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-hero shadow-glow mb-8"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Heart className="h-10 w-10 text-primary-foreground" />
              </motion.div>

              <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 text-foreground">
                Welcome to <span className="text-gradient">Unmute</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                A safe space where your voice matters. You're not alone in your struggles.
              </p>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="glass rounded-2xl p-6 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              <Button 
                variant="gradient" 
                size="xl" 
                onClick={() => setStep(1)}
                className="gap-2"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>

              <p className="text-sm text-muted-foreground mt-6">
                Free, anonymous, and here for you 24/7
              </p>
            </motion.div>
          )}

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
                Who are you?
              </h2>
              <p className="text-lg text-muted-foreground mb-12">
                We'll customize your experience based on your needs
              </p>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
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
                  <p className="text-muted-foreground">
                    Get emotional support, talk to listeners, and track your mental health journey.
                  </p>
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
                  <p className="text-muted-foreground">
                    Learn to understand your child better and improve your emotional connection.
                  </p>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
