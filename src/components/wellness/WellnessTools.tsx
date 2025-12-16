import { useState, useEffect, useRef } from 'react';
import { Wind, Moon, Brain, Heart, Play, Pause, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tools = [
  { id: 'breathing', label: 'Breathing', icon: Wind, description: 'Calm your nervous system', color: 'gradient-calm' },
  { id: 'grounding', label: 'Grounding', icon: Brain, description: '5-4-3-2-1 technique', color: 'gradient-support' },
  { id: 'sleep', label: 'Sleep Help', icon: Moon, description: 'Relax before bed', color: 'gradient-hero' },
  { id: 'affirmations', label: 'Kind Words', icon: Heart, description: 'Positive reminders', color: 'gradient-hope' },
];

const breathingPatterns = [
  { name: '4-7-8 Calm', inhale: 4, hold: 7, exhale: 8, description: 'Best for anxiety & sleep' },
  { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, description: 'Used by Navy SEALs' },
  { name: 'Quick Calm', inhale: 4, hold: 0, exhale: 6, description: 'Fast stress relief' },
];

const groundingSteps = [
  { sense: 'See', count: 5, prompt: 'Name 5 things you can see right now', emoji: '👁️' },
  { sense: 'Touch', count: 4, prompt: 'Name 4 things you can touch', emoji: '✋' },
  { sense: 'Hear', count: 3, prompt: 'Name 3 things you can hear', emoji: '👂' },
  { sense: 'Smell', count: 2, prompt: 'Name 2 things you can smell', emoji: '👃' },
  { sense: 'Taste', count: 1, prompt: 'Name 1 thing you can taste', emoji: '👅' },
];

const affirmations = [
  "You are doing better than you think.",
  "It's okay to take things one step at a time.",
  "Your feelings are valid, even the hard ones.",
  "You don't have to be perfect to be worthy.",
  "This difficult moment will pass.",
  "You are stronger than your anxiety.",
  "It's okay to ask for help.",
  "Your best is enough.",
  "You matter, even on the hard days.",
  "Small progress is still progress.",
];

const sleepTips = [
  { title: 'Body Scan', description: 'Slowly relax each part of your body, starting from your toes', duration: '5-10 min' },
  { title: 'Sleep Story', description: 'Listen to a calming story to drift off', duration: '15 min' },
  { title: 'Worry Dump', description: 'Write down everything on your mind before bed', duration: '5 min' },
  { title: 'Temperature', description: 'Keep your room cool (65-68°F / 18-20°C)', duration: '' },
];

export function WellnessTools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-calm mb-4">
          <Wind className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Wellness Tools</h1>
        <p className="text-muted-foreground">
          Simple exercises to help you feel better right now
        </p>
      </div>

      {/* Tool Selection */}
      {!activeTool ? (
        <div className="grid md:grid-cols-2 gap-4">
          {tools.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="glass rounded-2xl p-6 text-left hover:shadow-medium transition-all hover:scale-[1.02] animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", tool.color)}>
                <tool.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{tool.label}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <ChevronRight className="h-5 w-5 text-primary mt-2" />
            </button>
          ))}
        </div>
      ) : (
        <div>
          <Button variant="ghost" onClick={() => setActiveTool(null)} className="mb-4">
            ← Back to tools
          </Button>
          
          {activeTool === 'breathing' && <BreathingExercise />}
          {activeTool === 'grounding' && <GroundingExercise />}
          {activeTool === 'sleep' && <SleepTools />}
          {activeTool === 'affirmations' && <AffirmationsView />}
        </div>
      )}
    </div>
  );
}

function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            if (selectedPattern.hold > 0) {
              setPhase('hold');
              return selectedPattern.hold;
            } else {
              setPhase('exhale');
              return selectedPattern.exhale;
            }
          } else if (phase === 'hold') {
            setPhase('exhale');
            return selectedPattern.exhale;
          } else {
            setCycles(c => c + 1);
            setPhase('inhale');
            return selectedPattern.inhale;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, selectedPattern]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    setCountdown(selectedPattern.inhale);
    setCycles(0);
  };

  const handleStop = () => {
    setIsActive(false);
    setCountdown(0);
    setCycles(0);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display font-semibold text-xl mb-4 text-center">Breathing Exercise</h2>
      
      {/* Pattern Selection */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {breathingPatterns.map(pattern => (
          <button
            key={pattern.name}
            onClick={() => !isActive && setSelectedPattern(pattern)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              selectedPattern.name === pattern.name
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {pattern.name}
          </button>
        ))}
      </div>

      <p className="text-center text-muted-foreground text-sm mb-6">{selectedPattern.description}</p>

      {/* Breathing Circle */}
      <div className="flex flex-col items-center mb-6">
        <div 
          className={cn(
            "w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000",
            phase === 'inhale' && "scale-100 bg-primary/20",
            phase === 'hold' && "scale-110 bg-hope/20",
            phase === 'exhale' && "scale-90 bg-support/20",
            !isActive && "scale-100 bg-muted"
          )}
        >
          <div className="text-center">
            <p className="text-4xl font-display font-bold">{isActive ? countdown : '—'}</p>
            <p className="text-lg capitalize text-muted-foreground">
              {isActive ? phase : 'Ready'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isActive ? (
          <Button variant="gradient" size="lg" onClick={handleStart} className="gap-2">
            <Play className="h-5 w-5" />
            Start
          </Button>
        ) : (
          <>
            <Button variant="outline" size="lg" onClick={handleStop} className="gap-2">
              <Pause className="h-5 w-5" />
              Stop
            </Button>
          </>
        )}
      </div>

      {cycles > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Completed {cycles} breath{cycles > 1 ? 's' : ''} 🎉
        </p>
      )}
    </div>
  );
}

function GroundingExercise() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const handleNext = () => {
    setCompleted(prev => [...prev, currentStep]);
    if (currentStep < groundingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompleted([]);
  };

  const isComplete = completed.length === groundingSteps.length;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display font-semibold text-xl mb-2 text-center">5-4-3-2-1 Grounding</h2>
      <p className="text-center text-muted-foreground text-sm mb-6">
        This technique helps bring you back to the present moment
      </p>

      {/* Progress */}
      <div className="flex justify-center gap-2 mb-6">
        {groundingSteps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all",
              completed.includes(index) && "bg-safe text-safe-foreground",
              currentStep === index && !completed.includes(index) && "bg-primary text-primary-foreground scale-110",
              !completed.includes(index) && currentStep !== index && "bg-muted"
            )}
          >
            {completed.includes(index) ? <Check className="h-5 w-5" /> : groundingSteps[index].emoji}
          </div>
        ))}
      </div>

      {!isComplete ? (
        <div className="text-center">
          <div className="mb-6">
            <span className="text-6xl mb-4 block">{groundingSteps[currentStep].emoji}</span>
            <h3 className="font-display font-semibold text-xl mb-2">
              {groundingSteps[currentStep].count} things you can {groundingSteps[currentStep].sense.toLowerCase()}
            </h3>
            <p className="text-muted-foreground">{groundingSteps[currentStep].prompt}</p>
          </div>

          <Button variant="gradient" size="lg" onClick={handleNext}>
            {currentStep === groundingSteps.length - 1 ? 'Complete' : 'Done, Next'}
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="font-display font-semibold text-xl mb-2">Great job!</h3>
          <p className="text-muted-foreground mb-4">You completed the grounding exercise. How do you feel?</p>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Do it again
          </Button>
        </div>
      )}
    </div>
  );
}

function SleepTools() {
  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display font-semibold text-xl mb-2 text-center">Sleep Better Tonight</h2>
      <p className="text-center text-muted-foreground text-sm mb-6">
        Simple ways to quiet your mind before bed
      </p>

      <div className="space-y-3">
        {sleepTips.map((tip, index) => (
          <button
            key={index}
            onClick={() => toast.success(`Starting: ${tip.title}`)}
            className="w-full glass rounded-xl p-4 text-left hover:bg-card/90 transition-all flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.description}</p>
            </div>
            {tip.duration && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {tip.duration}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/10 rounded-xl">
        <p className="text-sm text-center">
          💡 <strong>Tip:</strong> Try to go to bed at the same time every night, even on weekends.
        </p>
      </div>
    </div>
  );
}

function AffirmationsView() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % affirmations.length);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display font-semibold text-xl mb-6 text-center">Kind Words For You</h2>

      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-2xl font-display text-center leading-relaxed animate-fade-in" key={currentIndex}>
          "{affirmations[currentIndex]}"
        </p>
      </div>

      <div className="flex justify-center">
        <Button variant="gradient" onClick={handleNext} className="gap-2">
          <Heart className="h-4 w-4" />
          Show Another
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Take a moment to let these words sink in. You deserve kindness.
      </p>
    </div>
  );
}