import { useState } from 'react';
import { EmotionalState, EmotionalOption } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, MessageCircle, Users, BookHeart, Bot, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const emotionalOptions: EmotionalOption[] = [
  { id: 'anxious', emoji: '😟', label: 'Anxious', description: 'Worried or nervous', color: 'bg-warning/20 border-warning/40 hover:bg-warning/30' },
  { id: 'overwhelmed', emoji: '😫', label: 'Overwhelmed', description: 'Too much going on', color: 'bg-destructive/20 border-destructive/40 hover:bg-destructive/30' },
  { id: 'sad', emoji: '😢', label: 'Sad', description: 'Feeling low', color: 'bg-support/20 border-support/40 hover:bg-support/30' },
  { id: 'angry', emoji: '😠', label: 'Angry', description: 'Frustrated', color: 'bg-accent/20 border-accent/40 hover:bg-accent/30' },
  { id: 'numb', emoji: '😶', label: 'Numb', description: 'Feeling empty', color: 'bg-muted border-muted-foreground/30 hover:bg-muted/80' },
  { id: 'lonely', emoji: '🥺', label: 'Lonely', description: 'Need connection', color: 'bg-secondary border-secondary-foreground/30 hover:bg-secondary/80' },
  { id: 'stressed', emoji: '😰', label: 'Stressed', description: 'Under pressure', color: 'bg-hope/20 border-hope/40 hover:bg-hope/30' },
  { id: 'confused', emoji: '😵‍💫', label: 'Confused', description: 'Uncertain', color: 'bg-calm/20 border-calm/40 hover:bg-calm/30' },
  { id: 'hopeful', emoji: '🌟', label: 'Hopeful', description: 'Seeing light', color: 'bg-safe/20 border-safe/40 hover:bg-safe/30' },
  { id: 'neutral', emoji: '😌', label: 'Okay', description: 'Just here', color: 'bg-primary/20 border-primary/40 hover:bg-primary/30' },
];

const supportOptions = [
  { 
    id: 'ai', 
    icon: Bot, 
    label: 'Chat with AI', 
    description: 'Get instant, compassionate support',
    recommended: true,
  },
  { 
    id: 'talk', 
    icon: MessageCircle, 
    label: 'Talk to a Listener', 
    description: 'Connect with a trained peer',
    recommended: false,
  },
  { 
    id: 'room', 
    icon: Users, 
    label: 'Join Support Room', 
    description: 'Find others who understand',
    recommended: false,
  },
  { 
    id: 'journal', 
    icon: BookHeart, 
    label: 'Journal It Out', 
    description: 'Write privately, at your pace',
    recommended: false,
  },
];

interface EmotionalCheckInProps {
  onComplete: (state: EmotionalState, supportType: string) => void;
}

export function EmotionalCheckIn({ onComplete }: EmotionalCheckInProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null);
  const [step, setStep] = useState<'emotion' | 'support'>('emotion');
  const { setCurrentEmotionalState } = useApp();

  const handleEmotionSelect = (emotion: EmotionalState) => {
    setSelectedEmotion(emotion);
    setCurrentEmotionalState(emotion);
  };

  const handleContinue = () => {
    if (selectedEmotion) {
      setStep('support');
    }
  };

  const handleSupportSelect = (supportType: string) => {
    if (selectedEmotion) {
      onComplete(selectedEmotion, supportType);
    }
  };

  const selectedEmotionData = emotionalOptions.find(e => e.id === selectedEmotion);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {step === 'emotion' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Warm header */}
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Heart className="h-8 w-8 text-primary" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold mb-3 text-foreground">
              Hey, how are you feeling?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              It's okay to not be okay. Whatever you're feeling right now is valid. 
              Just pick what feels closest to your current state.
            </p>
          </div>

          {/* Emotion grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {emotionalOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleEmotionSelect(option.id)}
                className={cn(
                  "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                  option.color,
                  selectedEmotion === option.id 
                    ? "ring-2 ring-primary ring-offset-2 scale-105" 
                    : "hover:scale-[1.02]"
                )}
              >
                <span className="text-3xl mb-2">{option.emoji}</span>
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
              </motion.button>
            ))}
          </div>

          {/* Continue button */}
          <div className="flex flex-col items-center gap-3">
            <Button 
              variant="gradient" 
              size="lg"
              onClick={handleContinue}
              disabled={!selectedEmotion}
              className="gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            {selectedEmotion && selectedEmotionData && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground"
              >
                Feeling <span className="text-foreground font-medium">{selectedEmotionData.label.toLowerCase()}</span>? 
                That's okay. Let's find you some support.
              </motion.p>
            )}
          </div>
        </motion.div>
      )}

      {step === 'support' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold mb-3 text-foreground">
              What would help you right now?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're here for you. Choose how you'd like to be supported — 
              there's no wrong answer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {supportOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSupportSelect(option.id)}
                className={cn(
                  "glass rounded-xl p-6 text-left transition-all hover:shadow-medium hover:scale-[1.02] group relative",
                  option.recommended && "ring-2 ring-primary/50"
                )}
              >
                {option.recommended && (
                  <span className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">{option.label}</h3>
                <p className="text-muted-foreground text-sm">{option.description}</p>
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => setStep('emotion')}
            className="mx-auto block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← I want to choose a different feeling
          </button>
        </motion.div>
      )}
    </div>
  );
}
