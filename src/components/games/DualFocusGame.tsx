import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface DualFocusGameProps {
  onComplete: (result: {
    score: number;
    accuracy: number;
    avgReactionTime: number;
    correctResponses: number;
    incorrectResponses: number;
    duration: number;
  }) => void;
  onExit: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const DirectionIcon: React.FC<{ direction: Direction; className?: string }> = ({ direction, className }) => {
  const icons = {
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight
  };
  const Icon = icons[direction];
  return <Icon className={className} />;
};

export const DualFocusGame: React.FC<DualFocusGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(75);
  const [difficulty, setDifficulty] = useState(1);
  
  // Dual task state
  const [topTask, setTopTask] = useState<{ number: number; isEven: boolean }>({ number: 0, isEven: true });
  const [bottomTask, setBottomTask] = useState<{ direction: Direction; color: 'red' | 'blue' }>({ direction: 'up', color: 'blue' });
  const [activeTask, setActiveTask] = useState<'top' | 'bottom'>('top');
  const [showingBoth, setShowingBoth] = useState(false);
  
  const [responses, setResponses] = useState<{ correct: boolean; time: number }[]>([]);
  const [trialStart, setTrialStart] = useState(0);
  const [feedback, setFeedback] = useState<{ task: 'top' | 'bottom'; correct: boolean } | null>(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [firstResponse, setFirstResponse] = useState<{ task: 'top' | 'bottom'; correct: boolean } | null>(null);

  const generateTasks = useCallback(() => {
    const num = Math.floor(Math.random() * 99) + 1;
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const colors: ('red' | 'blue')[] = ['red', 'blue'];
    
    setTopTask({ number: num, isEven: num % 2 === 0 });
    setBottomTask({
      direction: directions[Math.floor(Math.random() * directions.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    
    // At higher difficulties, show both tasks
    setShowingBoth(difficulty >= 2);
    setActiveTask(Math.random() > 0.5 ? 'top' : 'bottom');
    setTrialStart(Date.now());
    setWaitingForSecond(false);
    setFirstResponse(null);
  }, [difficulty]);

  const handleTopResponse = useCallback((answerEven: boolean) => {
    const reactionTime = Date.now() - trialStart;
    const isCorrect = answerEven === topTask.isEven;
    
    setResponses(prev => [...prev, { correct: isCorrect, time: reactionTime }]);
    
    if (showingBoth && !firstResponse) {
      setFirstResponse({ task: 'top', correct: isCorrect });
      setWaitingForSecond(true);
      return;
    }
    
    processFeedback('top', isCorrect, reactionTime);
  }, [topTask, trialStart, showingBoth, firstResponse]);

  const handleBottomResponse = useCallback((answerRed: boolean) => {
    const reactionTime = Date.now() - trialStart;
    const isCorrect = answerRed === (bottomTask.color === 'red');
    
    setResponses(prev => [...prev, { correct: isCorrect, time: reactionTime }]);
    
    if (showingBoth && !firstResponse) {
      setFirstResponse({ task: 'bottom', correct: isCorrect });
      setWaitingForSecond(true);
      return;
    }
    
    processFeedback('bottom', isCorrect, reactionTime);
  }, [bottomTask, trialStart, showingBoth, firstResponse]);

  const processFeedback = useCallback((task: 'top' | 'bottom', isCorrect: boolean, reactionTime: number) => {
    // Calculate combined correctness for dual task
    const bothCorrect = firstResponse ? firstResponse.correct && isCorrect : isCorrect;
    
    setFeedback({ task, correct: isCorrect });
    
    if (bothCorrect) {
      const basePoints = showingBoth ? 200 : 100;
      const speedBonus = Math.max(0, Math.floor((2000 - reactionTime) / 40));
      const streakBonus = streak * 20;
      const difficultyBonus = difficulty * 30;
      
      setScore(prev => prev + basePoints + speedBonus + streakBonus + difficultyBonus);
      setStreak(prev => prev + 1);
      
      if (streak > 0 && streak % 6 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 4));
      }
    } else {
      setStreak(0);
      if (difficulty > 1) {
        setDifficulty(prev => Math.max(prev - 1, 1));
      }
    }
    
    setTimeout(() => {
      setFeedback(null);
      generateTasks();
    }, 400);
  }, [firstResponse, showingBoth, streak, difficulty, generateTasks]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'finished') {
      const correctResponses = responses.filter(r => r.correct).length;
      const avgReactionTime = responses.length > 0 
        ? responses.reduce((sum, r) => sum + r.time, 0) / responses.length 
        : 0;
      
      onComplete({
        score,
        accuracy: responses.length > 0 ? (correctResponses / responses.length) * 100 : 0,
        avgReactionTime,
        correctResponses,
        incorrectResponses: responses.length - correctResponses,
        duration: 75
      });
    }
  }, [phase, score, responses, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      
      if (e.key === 'e' || e.key === 'E') {
        handleTopResponse(true);
      } else if (e.key === 'o' || e.key === 'O') {
        handleTopResponse(false);
      } else if (e.key === 'r' || e.key === 'R') {
        handleBottomResponse(true);
      } else if (e.key === 'b' || e.key === 'B') {
        handleBottomResponse(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleTopResponse, handleBottomResponse]);

  const startGame = () => {
    setPhase('playing');
    generateTasks();
  };

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Dual Focus</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            Train your divided attention by juggling two tasks simultaneously. 
            As you improve, both tasks appear at once!
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <p className="text-sm font-medium mb-2">Two tasks:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Top:</strong> Is the number Even or Odd? [E/O]</li>
              <li>• <strong>Bottom:</strong> Is the arrow Red or Blue? [R/B]</li>
              <li>• Answer both when they appear together!</li>
              <li>• Speed and accuracy both matter</li>
            </ul>
          </div>
        </motion.div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onExit}>Back</Button>
          <Button onClick={startGame} className="px-8">Start</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{score}</div>
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-amber-500"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">{streak}x</span>
            </motion.div>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          showingBoth 
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' 
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        }`}>
          {showingBoth ? 'DUAL MODE' : 'SINGLE'}
        </div>
        <div className="text-lg font-mono">{timeLeft}s</div>
      </div>
      
      <Progress value={(timeLeft / 75) * 100} className="w-full h-2" />

      {/* Task area */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        {/* Top Task - Number Even/Odd */}
        <Card className={`p-6 transition-all ${
          (activeTask === 'top' || showingBoth) ? 'opacity-100' : 'opacity-30'
        } ${
          feedback?.task === 'top' 
            ? feedback.correct ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
            : ''
        } ${
          waitingForSecond && firstResponse?.task === 'top' ? 'opacity-50' : ''
        }`}>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">EVEN or ODD?</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={topTask.number}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="text-5xl font-bold mb-4"
              >
                {topTask.number}
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handleTopResponse(true)}
                disabled={waitingForSecond && firstResponse?.task === 'top'}
                className="flex-1"
              >
                Even [E]
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTopResponse(false)}
                disabled={waitingForSecond && firstResponse?.task === 'top'}
                className="flex-1"
              >
                Odd [O]
              </Button>
            </div>
          </div>
        </Card>

        {/* Bottom Task - Arrow Color */}
        <Card className={`p-6 transition-all ${
          (activeTask === 'bottom' || showingBoth) ? 'opacity-100' : 'opacity-30'
        } ${
          feedback?.task === 'bottom' 
            ? feedback.correct ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
            : ''
        } ${
          waitingForSecond && firstResponse?.task === 'bottom' ? 'opacity-50' : ''
        }`}>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">RED or BLUE?</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={bottomTask.direction + bottomTask.color}
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                className="flex justify-center mb-4"
              >
                <DirectionIcon 
                  direction={bottomTask.direction} 
                  className={`w-16 h-16 ${
                    bottomTask.color === 'red' ? 'text-red-500' : 'text-blue-500'
                  }`}
                />
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleBottomResponse(true)}
                disabled={waitingForSecond && firstResponse?.task === 'bottom'}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Red [R]
              </Button>
              <Button
                onClick={() => handleBottomResponse(false)}
                disabled={waitingForSecond && firstResponse?.task === 'bottom'}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Blue [B]
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {waitingForSecond && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          Now answer the other task!
        </motion.div>
      )}

      <Button variant="ghost" size="sm" onClick={onExit} className="mt-4">
        Exit Game
      </Button>
    </div>
  );
};
