import { useState } from 'react';
import { EmotionalState, EmotionalOption } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, MessageCircle, Users, BookHeart, Bot } from 'lucide-react';

const emotionalOptions: EmotionalOption[] = [
  { id: 'anxious', emoji: '😟', label: 'Anxious', description: 'Worried or nervous', color: 'bg-warning/20 border-warning/40 hover:bg-warning/30' },
  { id: 'overwhelmed', emoji: '😫', label: 'Overwhelmed', description: 'Too much to handle', color: 'bg-destructive/20 border-destructive/40 hover:bg-destructive/30' },
  { id: 'sad', emoji: '😢', label: 'Sad', description: 'Feeling down', color: 'bg-support/20 border-support/40 hover:bg-support/30' },
  { id: 'angry', emoji: '😠', label: 'Angry', description: 'Frustrated or upset', color: 'bg-accent/20 border-accent/40 hover:bg-accent/30' },
  { id: 'numb', emoji: '😶', label: 'Numb', description: 'Feeling nothing', color: 'bg-muted border-muted-foreground/30 hover:bg-muted/80' },
  { id: 'lonely', emoji: '🥺', label: 'Lonely', description: 'Feeling isolated', color: 'bg-secondary border-secondary-foreground/30 hover:bg-secondary/80' },
  { id: 'stressed', emoji: '😰', label: 'Stressed', description: 'Under pressure', color: 'bg-hope/20 border-hope/40 hover:bg-hope/30' },
  { id: 'confused', emoji: '😵‍💫', label: 'Confused', description: 'Unsure about things', color: 'bg-calm/20 border-calm/40 hover:bg-calm/30' },
  { id: 'hopeful', emoji: '🌟', label: 'Hopeful', description: 'Seeing light ahead', color: 'bg-safe/20 border-safe/40 hover:bg-safe/30' },
  { id: 'neutral', emoji: '😌', label: 'Okay', description: 'Just want to talk', color: 'bg-primary/20 border-primary/40 hover:bg-primary/30' },
];

const supportOptions = [
  { id: 'talk', icon: MessageCircle, label: 'Talk to a Listener', description: 'Connect with a trained peer' },
  { id: 'room', icon: Users, label: 'Join Support Room', description: 'Find others who understand' },
  { id: 'journal', icon: BookHeart, label: 'Journal It Out', description: 'Write privately at your pace' },
  { id: 'ai', icon: Bot, label: 'Chat with AI', description: 'Get instant compassionate help' },
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      {step === 'emotion' && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold mb-3 text-foreground">
              How are you feeling right now?
            </h2>
            <p className="text-muted-foreground">
              There's no wrong answer. Just pick what feels closest to how you're doing.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {emotionalOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleEmotionSelect(option.id)}
                className={cn(
                  "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                  option.color,
                  selectedEmotion === option.id 
                    ? "ring-2 ring-primary ring-offset-2 scale-105" 
                    : "hover:scale-102"
                )}
              >
                <span className="text-3xl mb-2">{option.emoji}</span>
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
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
          </div>
        </div>
      )}

      {step === 'support' && (
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold mb-3 text-foreground">
              What would help you most?
            </h2>
            <p className="text-muted-foreground">
              We're here for you. Choose how you'd like to be supported.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {supportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSupportSelect(option.id)}
                className="glass rounded-xl p-6 text-left transition-all hover:shadow-medium hover:scale-[1.02] group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">{option.label}</h3>
                <p className="text-muted-foreground text-sm">{option.description}</p>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setStep('emotion')}
            className="mt-6 mx-auto block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Choose a different feeling
          </button>
        </div>
      )}
    </div>
  );
}
