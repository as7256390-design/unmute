import { useState } from 'react';
import { ArrowLeft, Brain, Heart, ClipboardCheck, Clock, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PHQ9Form } from './PHQ9Form';
import { GAD7Form } from './GAD7Form';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AssessmentType = 'hub' | 'phq9' | 'gad7';

const assessments = [
  {
    id: 'phq9' as const,
    name: 'PHQ-9',
    title: 'Depression Screening',
    description: 'Assess symptoms of depression over the past 2 weeks',
    icon: Heart,
    color: 'text-support',
    bgColor: 'bg-support/10',
    borderColor: 'border-support/30',
    questions: 9,
    time: '3-5 min',
    details: [
      'Measures depression severity',
      'Tracks mood and energy levels',
      'Identifies sleep and appetite changes',
      'Screens for thoughts of self-harm'
    ]
  },
  {
    id: 'gad7' as const,
    name: 'GAD-7',
    title: 'Anxiety Screening',
    description: 'Evaluate anxiety symptoms and their impact on your daily life',
    icon: Brain,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    questions: 7,
    time: '2-4 min',
    details: [
      'Measures anxiety severity',
      'Tracks worry and nervousness',
      'Identifies restlessness patterns',
      'Evaluates ability to relax'
    ]
  }
];

export function AssessmentHub() {
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentType>('hub');

  if (currentAssessment === 'phq9') {
    return (
      <div>
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => setCurrentAssessment('hub')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
        <PHQ9Form />
      </div>
    );
  }

  if (currentAssessment === 'gad7') {
    return (
      <div>
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => setCurrentAssessment('hub')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Button>
        <GAD7Form />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Mental Health Assessments</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Take clinically validated screenings to better understand your emotional well-being. 
          Your responses are completely confidential.
        </p>
      </div>

      {/* Privacy Banner */}
      <div className="glass rounded-xl p-4 mb-8 flex items-start gap-3">
        <Shield className="h-5 w-5 text-safe flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">100% Confidential</p>
          <p className="text-xs text-muted-foreground">
            These screenings are not diagnoses. They help you understand your feelings and guide you 
            toward appropriate support. Results are private to you.
          </p>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessments.map((assessment, index) => (
          <motion.div
            key={assessment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => setCurrentAssessment(assessment.id)}
              className={cn(
                "w-full text-left glass rounded-2xl p-6 border-2 transition-all hover:scale-[1.01]",
                assessment.borderColor,
                "hover:shadow-lg"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", assessment.bgColor)}>
                  <assessment.icon className={cn("h-7 w-7", assessment.color)} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", assessment.bgColor, assessment.color)}>
                        {assessment.name}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <h3 className="font-display text-xl font-bold mb-1">{assessment.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{assessment.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      {assessment.questions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {assessment.time}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {assessment.details.map((detail, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-muted/50 px-2 py-1 rounded-full"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 rounded-xl bg-muted/30">
        <h3 className="font-semibold mb-3">About These Assessments</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">PHQ-9 (Patient Health Questionnaire)</p>
            <p>A validated 9-question screening tool used worldwide to assess depression symptoms and severity.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">GAD-7 (Generalized Anxiety Disorder)</p>
            <p>A validated 7-question screening tool used to measure the severity of generalized anxiety symptoms.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Both tools are recommended by the World Health Organization and widely used in clinical and research settings.
        </p>
      </div>
    </div>
  );
}