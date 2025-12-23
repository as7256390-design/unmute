import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award,
  ChevronRight,
  Play,
  Star,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number | null;
  is_required: boolean | null;
  content: any;
  badge_id: string | null;
}

interface UserProgress {
  module_id: string;
  status: string | null;
  quiz_score: number | null;
  completed_at: string | null;
}

export function PeerListenerTraining() {
  const { user } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCertified, setIsCertified] = useState(false);

  useEffect(() => {
    if (user) {
      fetchModulesAndProgress();
      checkCertification();
    } else {
      // Still load modules for preview
      fetchModulesOnly();
    }
  }, [user]);

  const fetchModulesOnly = async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('training_modules')
        .select('*')
        .order('order_index');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesAndProgress = async () => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('training_modules')
        .select('*')
        .order('order_index');

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_training_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;
        setProgress(progressData || []);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCertification = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('peer_listeners')
      .select('is_certified')
      .eq('user_id', user.id)
      .maybeSingle();

    setIsCertified(data?.is_certified || false);
  };

  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.module_id === moduleId);
  };

  const startModule = async (module: TrainingModule) => {
    if (!user) {
      toast.error('Please sign in to start training');
      return;
    }
    
    const existingProgress = getModuleProgress(module.id);
    
    if (!existingProgress) {
      await supabase.from('user_training_progress').insert({
        user_id: user.id,
        module_id: module.id,
        status: 'in_progress'
      });
    }

    setActiveModule(module);
  };

  const completeModule = async (moduleId: string, quizScore?: number) => {
    if (!user) {
      toast.error('Please sign in to save progress');
      return;
    }
    
    try {
      await supabase
        .from('user_training_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          status: 'completed',
          quiz_score: quizScore || 100,
          completed_at: new Date().toISOString()
        });

      // Check if all required modules are complete
      const updatedProgress = [...progress, { module_id: moduleId, status: 'completed', quiz_score: quizScore || 100, completed_at: new Date().toISOString() }];
      const requiredModules = modules.filter(m => m.is_required);
      const allRequiredComplete = requiredModules.every(m => 
        updatedProgress.find(p => p.module_id === m.id && p.status === 'completed')
      );

      if (allRequiredComplete && !isCertified) {
        // Certify the user as a peer listener
        await supabase.from('peer_listeners').upsert({
          user_id: user.id,
          is_certified: true,
          certified_at: new Date().toISOString(),
          is_active: true
        });

        toast.success('🎉 Congratulations! You are now a certified Peer Listener!');
        setIsCertified(true);
      } else {
        toast.success('Module completed!');
      }

      setActiveModule(null);
      fetchModulesAndProgress();
    } catch (error) {
      console.error('Error completing module:', error);
      toast.error('Failed to save progress');
    }
  };

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const progressPercent = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (activeModule) {
    return (
      <ModuleViewer 
        module={activeModule} 
        onComplete={(score) => completeModule(activeModule.id, score)}
        onBack={() => setActiveModule(null)}
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold">Peer Listener Training</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Learn essential skills to support your peers through active listening, empathy, and crisis recognition.
          </p>
        </div>

        {/* Certification Status */}
        {isCertified ? (
          <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-600">Certified Peer Listener</h3>
                <p className="text-sm text-muted-foreground">You're ready to help your peers!</p>
              </div>
              <Badge className="ml-auto bg-amber-500">Active</Badge>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Training Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedCount} of {modules.length} modules completed
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </CardContent>
          </Card>
        )}

        {/* Module List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Training Modules</h2>
          
          {modules.map((module, index) => {
            const moduleProgress = getModuleProgress(module.id);
            const isCompleted = moduleProgress?.status === 'completed';
            const isInProgress = moduleProgress?.status === 'in_progress';

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200' : ''
                  }`}
                  onClick={() => startModule(module)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isInProgress 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{module.title}</h3>
                        {module.is_required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {module.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.duration_minutes}m
                        </span>
                      )}
                      {moduleProgress?.quiz_score && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          {moduleProgress.quiz_score}%
                        </span>
                      )}
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {modules.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Training Modules Available</h3>
            <p className="text-muted-foreground">Check back later for new training content.</p>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// Module Viewer Component
function ModuleViewer({ 
  module, 
  onComplete, 
  onBack 
}: { 
  module: TrainingModule; 
  onComplete: (score?: number) => void; 
  onBack: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  
  const content = module.content as { 
    steps?: Array<{ title: string; content: string; type: string }>;
    slides?: Array<{ title: string; content: string }>;
    quiz?: Array<{ question: string; options: string[]; correct: number }>;
  };
  
  // Use slides if steps don't exist
  const slides = content?.slides || content?.steps || [];
  const quiz = content?.quiz?.[0];
  const totalSteps = slides.length + (quiz ? 1 : 0);
  const isQuizStep = currentStep >= slides.length && quiz;

  const handleNext = () => {
    if (isQuizStep) {
      if (quizAnswer === null) {
        toast.error('Please select an answer');
        return;
      }
      if (!showQuizResult) {
        setShowQuizResult(true);
        return;
      }
      const score = quizAnswer === quiz?.correct ? 100 : 50;
      onComplete(score);
    } else if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (quiz) {
      setCurrentStep(slides.length); // Go to quiz
    } else {
      onComplete(100);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <h2 className="font-semibold">{module.title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <Progress 
          value={((currentStep + 1) / totalSteps) * 100} 
          className="mt-3 max-w-3xl mx-auto"
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {isQuizStep && quiz ? (
                <div className="space-y-6">
                  <h3 className="text-2xl font-display font-bold">Quick Check</h3>
                  <p className="text-lg">{quiz.question}</p>
                  <div className="space-y-3">
                    {quiz.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => !showQuizResult && setQuizAnswer(i)}
                        disabled={showQuizResult}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          quizAnswer === i 
                            ? showQuizResult
                              ? i === quiz.correct
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'border-red-500 bg-red-50 dark:bg-red-950'
                              : 'border-primary bg-primary/10'
                            : showQuizResult && i === quiz.correct
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {showQuizResult && (
                    <div className={`p-4 rounded-lg ${quizAnswer === quiz.correct ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                      <p className="font-semibold">
                        {quizAnswer === quiz.correct ? '✅ Correct!' : '❌ Not quite right'}
                      </p>
                      <p className="text-sm mt-1">
                        {quizAnswer === quiz.correct 
                          ? 'Great job! You understood the concept.'
                          : `The correct answer is: "${quiz.options[quiz.correct]}"`}
                      </p>
                    </div>
                  )}
                </div>
              ) : slides.length > 0 ? (
                <>
                  <h3 className="text-2xl font-display font-bold">
                    {slides[currentStep]?.title || 'Welcome'}
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {slides[currentStep]?.content || module.description}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-display font-bold">{module.title}</h3>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                  <Card className="p-6 bg-primary/5">
                    <p>This module will teach you essential peer listening skills. Complete this module to progress in your training.</p>
                  </Card>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-card">
        <div className="max-w-3xl mx-auto flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              if (isQuizStep) {
                setCurrentStep(slides.length - 1);
                setQuizAnswer(null);
                setShowQuizResult(false);
              } else {
                setCurrentStep(Math.max(0, currentStep - 1));
              }
            }}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {isQuizStep 
              ? showQuizResult 
                ? 'Complete Module' 
                : 'Check Answer'
              : currentStep < slides.length - 1 
                ? 'Continue' 
                : quiz 
                  ? 'Take Quiz'
                  : 'Complete Module'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
