import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, Shield, Heart, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const scoreOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

function getScoreInterpretation(score: number) {
  if (score <= 4) return { level: 'minimal', color: 'safe', message: 'Minimal depression symptoms' };
  if (score <= 9) return { level: 'mild', color: 'hope', message: 'Mild depression symptoms' };
  if (score <= 14) return { level: 'moderate', color: 'warning', message: 'Moderate depression symptoms' };
  if (score <= 19) return { level: 'moderately-severe', color: 'accent', message: 'Moderately severe depression' };
  return { level: 'severe', color: 'destructive', message: 'Severe depression symptoms' };
}

export function PHQ9Form() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(9).fill(-1));
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentQuestion + 1) / phq9Questions.length) * 100;
  const totalScore = answers.reduce((sum, val) => sum + (val >= 0 ? val : 0), 0);
  const interpretation = getScoreInterpretation(totalScore);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < phq9Questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (isComplete) {
    const isCritical = answers[8] >= 1; // Question 9 is about self-harm
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="glass rounded-2xl p-8 text-center">
          {isCritical ? (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-3">We're Here For You</h2>
              <p className="text-muted-foreground mb-6">
                We noticed you're going through a really difficult time. Your feelings matter, 
                and it's important to talk to someone who can help.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  Crisis Support Lines
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>iCall:</strong> 9152987821</p>
                  <p><strong>Vandrevala Foundation:</strong> 1860 2662 345</p>
                  <p><strong>NIMHANS:</strong> 080-46110007</p>
                </div>
              </div>
              <Button variant="gradient" size="lg" className="w-full mb-3">
                Talk to a Listener Now
              </Button>
              <Button variant="ghost" size="lg" className="w-full">
                I'm Okay, Continue to Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
                `bg-${interpretation.color}/20`
              )}>
                <Heart className={cn("h-8 w-8", `text-${interpretation.color}`)} />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Assessment Complete</h2>
              <p className="text-4xl font-display font-bold text-primary mb-2">{totalScore}/27</p>
              <p className="text-lg text-muted-foreground mb-6">{interpretation.message}</p>
              
              <div className="bg-muted/50 rounded-xl p-6 text-left mb-6">
                <h3 className="font-semibold mb-3">What This Means</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {interpretation.level === 'minimal' && 
                    "You're showing few signs of depression. Keep taking care of yourself and stay connected with supportive people."}
                  {interpretation.level === 'mild' && 
                    "You're experiencing some symptoms. Consider talking to someone you trust or using our support features to work through these feelings."}
                  {interpretation.level === 'moderate' && 
                    "These symptoms are worth paying attention to. Regular check-ins with a listener or counselor could be really helpful."}
                  {(interpretation.level === 'moderately-severe' || interpretation.level === 'severe') && 
                    "We recommend connecting with a mental health professional. Our listeners are also here to support you through this."}
                </p>
                <p className="text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 inline mr-1" />
                  This screening is not a diagnosis. It's a tool to help you understand how you're feeling.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="gradient" size="lg" className="flex-1">
                  Talk to Someone
                </Button>
                <Button variant="secondary" size="lg" className="flex-1">
                  View Resources
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">PHQ-9 Screening</h1>
        <p className="text-muted-foreground">
          Over the <strong>last 2 weeks</strong>, how often have you been bothered by the following?
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="h-5 w-5 text-safe flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Confidential Assessment</p>
          <p className="text-xs text-muted-foreground">
            Your responses are private and help us provide better support.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQuestion + 1} of {phq9Questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="glass rounded-2xl p-6 mb-6 animate-fade-in" key={currentQuestion}>
        <p className="text-lg font-medium mb-6">{phq9Questions[currentQuestion]}</p>
        
        <RadioGroup
          value={answers[currentQuestion]?.toString()}
          onValueChange={(val) => handleAnswer(parseInt(val))}
          className="space-y-3"
        >
          {scoreOptions.map(option => (
            <div key={option.value}>
              <RadioGroupItem 
                value={option.value.toString()} 
                id={`option-${option.value}`} 
                className="peer sr-only" 
              />
              <Label
                htmlFor={`option-${option.value}`}
                className="flex items-center gap-4 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
              >
                <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                  {option.value}
                </span>
                <span className="font-medium">{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {currentQuestion === 8 && (
          <div className="mt-6 p-4 rounded-xl bg-support/10 border border-support/30">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> If you're having thoughts of hurting yourself, please know that 
              help is available. You can talk to a listener anytime, and we're here for you.
            </p>
          </div>
        )}
      </div>

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
          {currentQuestion === phq9Questions.length - 1 ? 'View Results' : 'Next'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
