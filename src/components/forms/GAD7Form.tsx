import { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Heart, Phone, Sparkles, MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const gad7Questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const scoreOptions = [
  { value: 0, label: "Not at all", description: "Rarely or never" },
  { value: 1, label: "Several days", description: "1-6 days" },
  { value: 2, label: "More than half the days", description: "7-11 days" },
  { value: 3, label: "Nearly every day", description: "12-14 days" },
];

interface Interpretation {
  level: string;
  color: string;
  message: string;
  description: string;
  recommendations: string[];
}

function getScoreInterpretation(score: number): Interpretation {
  if (score <= 4) {
    return {
      level: 'minimal',
      color: 'safe',
      message: 'Minimal Anxiety',
      description: "You're experiencing very few anxiety symptoms. This is a healthy range.",
      recommendations: [
        "Continue your current self-care practices",
        "Practice mindfulness to maintain emotional balance",
        "Stay connected with friends and family",
        "Keep a regular sleep and exercise routine"
      ]
    };
  }
  if (score <= 9) {
    return {
      level: 'mild',
      color: 'hope',
      message: 'Mild Anxiety',
      description: "You're experiencing some anxiety symptoms that are worth monitoring.",
      recommendations: [
        "Try breathing exercises when feeling stressed",
        "Consider talking to a peer listener about your worries",
        "Limit caffeine and screen time before bed",
        "Practice grounding techniques (5-4-3-2-1 method)",
        "Journal your thoughts to identify triggers"
      ]
    };
  }
  if (score <= 14) {
    return {
      level: 'moderate',
      color: 'warning',
      message: 'Moderate Anxiety',
      description: "Your anxiety symptoms are significant and may be affecting your daily life.",
      recommendations: [
        "Connect with a trained listener or counselor",
        "Practice daily relaxation techniques",
        "Consider structured anxiety management programs",
        "Break tasks into smaller, manageable steps",
        "Reach out to trusted friends or family",
        "Limit news and social media if triggering"
      ]
    };
  }
  return {
    level: 'severe',
    color: 'destructive',
    message: 'Severe Anxiety',
    description: "Your anxiety symptoms are high and professional support is recommended.",
    recommendations: [
      "Speak with a mental health professional soon",
      "Connect with a listener for immediate support",
      "Practice crisis coping strategies",
      "Avoid isolating yourself - reach out to someone",
      "Focus on basic self-care (sleep, food, water)",
      "Consider calling a helpline if overwhelmed"
    ]
  };
}

interface GAD7FormProps {
  onComplete?: (score: number) => void;
}

export function GAD7Form({ onComplete }: GAD7FormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1));
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentQuestion + 1) / gad7Questions.length) * 100;
  const totalScore = answers.reduce((sum, val) => sum + (val >= 0 ? val : 0), 0);
  const interpretation = getScoreInterpretation(totalScore);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < gad7Questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete?.(totalScore);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(7).fill(-1));
    setIsComplete(false);
  };

  if (isComplete) {
    const isSevere = interpretation.level === 'severe';
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto p-6"
      >
        <div className="glass rounded-2xl p-8">
          {isSevere ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">We're Here For You</h2>
                <p className="text-muted-foreground">
                  Your anxiety levels are high, and that can feel really overwhelming. 
                  You don't have to face this alone.
                </p>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Immediate Support
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>iCall:</strong> 9152987821</p>
                  <p><strong>Vandrevala Foundation:</strong> 1860 2662 345</p>
                  <p><strong>NIMHANS:</strong> 080-46110007</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="gradient" size="lg" className="w-full gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Talk to a Listener Now
                </Button>
                <Button variant="secondary" size="lg" className="w-full">
                  View Coping Resources
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                    interpretation.level === 'minimal' && "bg-safe/20",
                    interpretation.level === 'mild' && "bg-hope/20",
                    interpretation.level === 'moderate' && "bg-warning/20"
                  )}
                >
                  <span className="text-3xl font-display font-bold">{totalScore}</span>
                </motion.div>
                <h2 className="font-display text-2xl font-bold mb-1">{interpretation.message}</h2>
                <p className="text-muted-foreground text-sm">Score: {totalScore} out of 21</p>
              </div>

              {/* Score Breakdown */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Minimal</span>
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-safe w-[24%]" />
                  <div className="bg-hope w-[24%]" />
                  <div className="bg-warning w-[24%]" />
                  <div className="bg-destructive w-[28%]" />
                </div>
                <div 
                  className="w-3 h-3 rounded-full bg-foreground -mt-3 border-2 border-background transition-all"
                  style={{ marginLeft: `${Math.min((totalScore / 21) * 100, 97)}%` }}
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-5 mb-6">
                <p className="text-sm text-muted-foreground mb-4">{interpretation.description}</p>
                
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Personalized Recommendations
                </h3>
                <ul className="space-y-2">
                  {interpretation.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    This screening is not a clinical diagnosis. It's designed to help you understand 
                    your anxiety levels and guide you toward appropriate support.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="gradient" size="lg" className="flex-1 gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Talk to Someone
                </Button>
                <Button variant="secondary" size="lg" className="flex-1 gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learn Coping Skills
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="w-full mt-4" onClick={handleReset}>
                Take Assessment Again
              </Button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">GAD-7 Anxiety Screening</h1>
        <p className="text-muted-foreground">
          Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following?
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="h-5 w-5 text-safe flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Your answers are confidential</p>
          <p className="text-xs text-muted-foreground">
            This helps us understand how you're feeling and provide better support.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQuestion + 1} of {gad7Questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <p className="text-lg font-medium mb-6">{gad7Questions[currentQuestion]}</p>
          
          <RadioGroup
            value={answers[currentQuestion]?.toString()}
            onValueChange={(val) => handleAnswer(parseInt(val))}
            className="space-y-3"
          >
            {scoreOptions.map(option => (
              <div key={option.value}>
                <RadioGroupItem 
                  value={option.value.toString()} 
                  id={`gad-option-${option.value}`} 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor={`gad-option-${option.value}`}
                  className="flex items-center gap-4 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                >
                  <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                    {option.value}
                  </span>
                  <div>
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          variant="gradient"
          onClick={handleNext}
          disabled={answers[currentQuestion] < 0}
          className="gap-2"
        >
          {currentQuestion === gad7Questions.length - 1 ? 'View Results' : 'Next'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}