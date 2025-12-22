import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  Trophy,
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Program {
  id: string;
  name: string;
  description: string;
  category: string;
  duration_days: number;
  difficulty: string;
  icon: string;
}

interface ProgramDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  exercise_type: string;
  exercise_content: any;
  duration_minutes: number;
  xp_reward: number;
}

interface UserProgress {
  program_id: string;
  current_day: number;
  status: string;
  completed_days: string[];
}

export function GuidedPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programDays, setProgramDays] = useState<ProgramDay[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserProgress>>(new Map());
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
    if (user) loadUserProgress();
  }, [user]);

  const loadPrograms = async () => {
    const { data } = await supabase
      .from('wellness_programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (data) setPrograms(data);
    setLoading(false);
  };

  const loadUserProgress = async () => {
    if (!user) return;

    const { data: progress } = await supabase
      .from('user_program_progress')
      .select('*')
      .eq('user_id', user.id);

    const { data: completions } = await supabase
      .from('user_day_completions')
      .select('program_day_id')
      .eq('user_id', user.id);

    const progressMap = new Map<string, UserProgress>();
    progress?.forEach(p => {
      progressMap.set(p.program_id, {
        ...p,
        completed_days: completions?.map(c => c.program_day_id) || []
      });
    });
    setUserProgress(progressMap);
  };

  const loadProgramDays = async (programId: string) => {
    const { data } = await supabase
      .from('program_days')
      .select('*')
      .eq('program_id', programId)
      .order('day_number');

    if (data) setProgramDays(data);
  };

  const startProgram = async (program: Program) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_program_progress')
      .upsert({
        user_id: user.id,
        program_id: program.id,
        current_day: 1,
        status: 'active'
      });

    if (error) {
      toast.error('Failed to start program');
      return;
    }

    await loadUserProgress();
    setSelectedProgram(program);
    loadProgramDays(program.id);
    toast.success(`Started ${program.name}! 🎉`);
  };

  const completeDay = async (day: ProgramDay) => {
    if (!user || !selectedProgram) return;

    const { error } = await supabase
      .from('user_day_completions')
      .insert({
        user_id: user.id,
        program_day_id: day.id
      });

    if (error) {
      if (error.code === '23505') {
        toast.info('Already completed this day!');
      }
      return;
    }

    // Update progress
    const progress = userProgress.get(selectedProgram.id);
    const newDay = Math.min((progress?.current_day || 1) + 1, selectedProgram.duration_days);
    const isComplete = newDay > selectedProgram.duration_days;

    await supabase
      .from('user_program_progress')
      .update({
        current_day: isComplete ? selectedProgram.duration_days : newDay,
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null
      })
      .eq('user_id', user.id)
      .eq('program_id', selectedProgram.id);

    // Update gamification - add XP directly
    const { data: currentStats } = await supabase
      .from('user_gamification')
      .select('xp_points')
      .eq('user_id', user.id)
      .single();
    
    if (currentStats) {
      await supabase
        .from('user_gamification')
        .update({ xp_points: (currentStats.xp_points || 0) + day.xp_reward })
        .eq('user_id', user.id);
    }

    await loadUserProgress();
    setActiveDay(null);

    if (isComplete) {
      toast.success('🏆 Program completed! You earned a badge!');
    } else {
      toast.success(`+${day.xp_reward} XP earned!`);
    }
  };

  const selectProgram = (program: Program) => {
    setSelectedProgram(program);
    loadProgramDays(program.id);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      anxiety: 'bg-purple-500/10 text-purple-500',
      stress: 'bg-blue-500/10 text-blue-500',
      depression: 'bg-amber-500/10 text-amber-500',
      sleep: 'bg-indigo-500/10 text-indigo-500',
      resilience: 'bg-green-500/10 text-green-500'
    };
    return colors[category] || 'bg-primary/10 text-primary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Active Exercise View
  if (activeDay) {
    const content = activeDay.exercise_content;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setActiveDay(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to program
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                {activeDay.duration_minutes} minutes
              </div>
              <CardTitle className="text-xl">Day {activeDay.day_number}: {activeDay.title}</CardTitle>
              <CardDescription>{activeDay.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.steps && (
                <div className="space-y-3">
                  <h4 className="font-medium">Steps:</h4>
                  <ol className="space-y-2">
                    {content.steps.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {content.prompts && (
                <div className="space-y-3">
                  <h4 className="font-medium">Journal Prompts:</h4>
                  <ul className="space-y-2">
                    {content.prompts.map((prompt: string, i: number) => (
                      <li key={i} className="text-sm p-3 bg-muted rounded-lg">
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {content.technique && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">{content.technique} Technique</h4>
                  {content.steps && (
                    <ul className="space-y-1 text-sm">
                      {content.steps.map((step: string, i: number) => (
                        <li key={i}>• {step}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {content.tip && (
                <div className="p-3 bg-amber-500/10 rounded-lg text-sm">
                  <strong>💡 Tip:</strong> {content.tip}
                </div>
              )}

              {content.celebration && (
                <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">{content.celebration}</p>
                </div>
              )}

              <Button 
                variant="gradient" 
                className="w-full" 
                onClick={() => completeDay(activeDay)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Day {activeDay.day_number}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Program Detail View
  if (selectedProgram) {
    const progress = userProgress.get(selectedProgram.id);
    const completedDayIds = progress?.completed_days || [];

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Button variant="ghost" onClick={() => setSelectedProgram(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to programs
        </Button>

        <Card className="glass mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedProgram.icon}</span>
              <div>
                <CardTitle>{selectedProgram.name}</CardTitle>
                <CardDescription>{selectedProgram.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={getCategoryColor(selectedProgram.category)}>
                {selectedProgram.category}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedProgram.duration_days} days • {selectedProgram.difficulty}
              </span>
            </div>
            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{completedDayIds.length} / {selectedProgram.duration_days} days</span>
                </div>
                <Progress value={(completedDayIds.length / selectedProgram.duration_days) * 100} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-medium">Daily Exercises</h3>
          {programDays.map(day => {
            const isCompleted = completedDayIds.includes(day.id);
            const isLocked = !progress && day.day_number > 1;
            const isCurrent = progress?.current_day === day.day_number;

            return (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: day.day_number * 0.05 }}
              >
                <Card 
                  className={`glass cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? 'border-safe/50' : isCurrent ? 'border-primary' : ''
                  } ${isLocked ? 'opacity-50' : ''}`}
                  onClick={() => !isLocked && setActiveDay(day)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-safe text-safe-foreground' : 
                        isCurrent ? 'bg-primary text-primary-foreground' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="font-bold">{day.day_number}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{day.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.duration_minutes} min • +{day.xp_reward} XP
                        </p>
                      </div>
                    </div>
                    {!isLocked && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {!progress && (
          <Button 
            variant="gradient" 
            className="w-full mt-6" 
            onClick={() => startProgram(selectedProgram)}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Program
          </Button>
        )}
      </div>
    );
  }

  // Programs List View
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold mb-2">Guided Wellness Programs</h1>
        <p className="text-muted-foreground">
          Structured journeys to help you build lasting mental wellness habits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map(program => {
          const progress = userProgress.get(program.id);
          const isActive = progress?.status === 'active';
          const isCompleted = progress?.status === 'completed';

          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card 
                className={`glass cursor-pointer transition-all h-full ${
                  isCompleted ? 'border-safe/50' : isActive ? 'border-primary' : ''
                }`}
                onClick={() => selectProgram(program)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{program.icon}</span>
                    {isCompleted && (
                      <Badge variant="default" className="bg-safe text-safe-foreground">
                        <Trophy className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {isActive && (
                      <Badge variant="default">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getCategoryColor(program.category)}>
                      {program.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {program.duration_days} days
                    </span>
                    <span className="text-sm text-muted-foreground">
                      • {program.difficulty}
                    </span>
                  </div>
                  {isActive && progress && (
                    <div className="mt-3">
                      <Progress 
                        value={(progress.current_day / program.duration_days) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Day {progress.current_day} of {program.duration_days}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
