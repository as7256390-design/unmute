import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CheckCircle2, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const steps = [
  { id: 'lifestyle', title: 'Lifestyle', description: 'Daily habits and routines' },
  { id: 'academic', title: 'Academic Life', description: 'School and study environment' },
  { id: 'struggles', title: 'Challenges', description: 'Areas where you struggle' },
  { id: 'support', title: 'Support System', description: 'Family and friends' },
  { id: 'mental', title: 'Mental Patterns', description: 'Thinking and emotional patterns' },
  { id: 'complete', title: 'Complete', description: 'Review and submit' },
];

const strugglingAreas = [
  'Focus & Concentration',
  'Self-Worth',
  'Motivation',
  'Sleep Issues',
  'Anxiety',
  'Social Skills',
  'Academic Performance',
  'Time Management',
  'Decision Making',
  'Relationships',
  'Future Planning',
  'Anger Management',
];

const thinkingPatterns = [
  { id: 'negative-self-talk', label: 'Negative Self-Talk', description: 'Constantly criticizing yourself' },
  { id: 'catastrophic', label: 'Catastrophic Thinking', description: 'Assuming the worst will happen' },
  { id: 'overgeneralization', label: 'Overgeneralization', description: 'One bad thing = everything is bad' },
  { id: 'personalization', label: 'Personalization', description: 'Blaming yourself for everything' },
  { id: 'rumination', label: 'Rumination', description: 'Overthinking past events' },
  { id: 'self-criticism', label: 'Self-Criticism', description: 'Being too hard on yourself' },
  { id: 'black-white', label: 'All-or-Nothing Thinking', description: 'No middle ground' },
];

const parentingStyles = [
  { id: 'authoritative', label: 'Supportive & Structured', description: 'Warm but with clear boundaries' },
  { id: 'authoritarian', label: 'Strict & Demanding', description: 'High expectations, less warmth' },
  { id: 'permissive', label: 'Lenient & Indulgent', description: 'Few rules, lots of freedom' },
  { id: 'neglectful', label: 'Distant & Uninvolved', description: 'Limited guidance or attention' },
  { id: 'mixed', label: 'Mixed / Varies', description: 'Different between parents or inconsistent' },
];

export function EmotionalProfileForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Lifestyle
    sleepQuality: 3,
    nutrition: 3,
    exercise: 3,
    screenTime: 'moderate',
    
    // Academic
    institutionType: '',
    academicPressure: 3,
    supportSystem: 3,
    
    // Struggles
    strugglingAreas: [] as string[],
    interests: '',
    pressureSources: '',
    
    // Support
    parentingStyle: '',
    friendshipQuality: 3,
    socialSupport: 3,
    familyDescription: '',
    
    // Mental
    thinkingPatterns: [] as string[],
    pastTrauma: '',
    medicalConditions: '',
    suicidalThoughts: false,
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'strugglingAreas' | 'thinkingPatterns', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Here you would save to database
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-support mb-4">
          <Heart className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Emotional Profile</h1>
        <p className="text-muted-foreground">
          Help us understand you better so we can provide personalized support
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="h-5 w-5 text-safe flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Completely Anonymous & Secure</p>
          <p className="text-xs text-muted-foreground">
            Everything you share is encrypted and never connected to your identity.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "text-xs font-medium hidden md:block",
                index <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 md:hidden">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </p>
      </div>

      {/* Form Steps */}
      <div className="glass rounded-2xl p-6 mb-6">
        {/* Lifestyle Step */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-medium mb-4 block">
                How would you rate your sleep quality?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Poor</span>
                <Slider
                  value={[formData.sleepQuality]}
                  onValueChange={([val]) => updateFormData('sleepQuality', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Excellent</span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How healthy is your diet and nutrition?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Poor</span>
                <Slider
                  value={[formData.nutrition]}
                  onValueChange={([val]) => updateFormData('nutrition', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Excellent</span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How much do you exercise or stay physically active?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Rarely</span>
                <Slider
                  value={[formData.exercise]}
                  onValueChange={([val]) => updateFormData('exercise', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Daily</span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How would you describe your screen time?
              </Label>
              <RadioGroup
                value={formData.screenTime}
                onValueChange={(val) => updateFormData('screenTime', val)}
                className="grid grid-cols-2 gap-3"
              >
                {['low', 'moderate', 'high', 'excessive'].map(level => (
                  <div key={level}>
                    <RadioGroupItem value={level} id={level} className="peer sr-only" />
                    <Label
                      htmlFor={level}
                      className="flex items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer capitalize"
                    >
                      {level}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Academic Step */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-medium mb-2 block">
                What type of institution are you in?
              </Label>
              <Input
                placeholder="e.g., High School, University, Coaching Institute..."
                value={formData.institutionType}
                onChange={(e) => updateFormData('institutionType', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How much academic pressure do you feel?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Low</span>
                <Slider
                  value={[formData.academicPressure]}
                  onValueChange={([val]) => updateFormData('academicPressure', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Extreme</span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How supportive is your academic environment?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Not at all</span>
                <Slider
                  value={[formData.supportSystem]}
                  onValueChange={([val]) => updateFormData('supportSystem', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Very</span>
              </div>
            </div>
          </div>
        )}

        {/* Struggles Step */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Select areas where you struggle (choose all that apply)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {strugglingAreas.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleArrayItem('strugglingAreas', area)}
                    className={cn(
                      "rounded-xl border-2 p-3 text-sm text-left transition-all",
                      formData.strugglingAreas.includes(area)
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">
                What are your interests and hobbies?
              </Label>
              <Textarea
                placeholder="What activities bring you joy or peace?"
                value={formData.interests}
                onChange={(e) => updateFormData('interests', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">
                What are your main sources of pressure?
              </Label>
              <Textarea
                placeholder="Family expectations, exams, social pressure, future worries..."
                value={formData.pressureSources}
                onChange={(e) => updateFormData('pressureSources', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Support System Step */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Which best describes your parents' approach?
              </Label>
              <RadioGroup
                value={formData.parentingStyle}
                onValueChange={(val) => updateFormData('parentingStyle', val)}
                className="space-y-3"
              >
                {parentingStyles.map(style => (
                  <div key={style.id}>
                    <RadioGroupItem value={style.id} id={style.id} className="peer sr-only" />
                    <Label
                      htmlFor={style.id}
                      className="flex flex-col rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-medium">{style.label}</span>
                      <span className="text-sm text-muted-foreground">{style.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                How would you rate your friendships?
              </Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Struggling</span>
                <Slider
                  value={[formData.friendshipQuality]}
                  onValueChange={([val]) => updateFormData('friendshipQuality', val)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">Strong</span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">
                Anything else about your family or social life?
              </Label>
              <Textarea
                placeholder="Optional: Share what feels relevant..."
                value={formData.familyDescription}
                onChange={(e) => updateFormData('familyDescription', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Mental Patterns Step */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Do you experience any of these thinking patterns?
              </Label>
              <div className="space-y-3">
                {thinkingPatterns.map(pattern => (
                  <button
                    key={pattern.id}
                    onClick={() => toggleArrayItem('thinkingPatterns', pattern.id)}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition-all",
                      formData.thinkingPatterns.includes(pattern.id)
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium block">{pattern.label}</span>
                    <span className="text-sm text-muted-foreground">{pattern.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">
                Any past experiences that still affect you? (Optional)
              </Label>
              <Textarea
                placeholder="Share only what you're comfortable with..."
                value={formData.pastTrauma}
                onChange={(e) => updateFormData('pastTrauma', e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="suicidal"
                  checked={formData.suicidalThoughts}
                  onCheckedChange={(checked) => updateFormData('suicidalThoughts', checked)}
                />
                <div>
                  <Label htmlFor="suicidal" className="font-medium cursor-pointer">
                    I've had thoughts of self-harm or suicide
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Checking this will connect you with specialized support. You're not alone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 5 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-safe/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-safe" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">You're All Set!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Thank you for sharing. Your responses help us understand you better and provide 
              more personalized support. Remember, you can update this anytime.
            </p>
            <Button variant="gradient" size="lg" onClick={handleSubmit}>
              Complete Profile
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="gradient"
            onClick={handleNext}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
