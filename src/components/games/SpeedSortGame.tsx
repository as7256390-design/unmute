import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowUp, ArrowDown, Timer, Target } from 'lucide-react';

interface SpeedSortGameProps {
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

type SortDirection = 'higher' | 'lower';

interface Trial {
  currentNumber: number;
  targetNumber: number;
  correctAnswer: SortDirection;
}

const SpeedSortGame: React.FC<SpeedSortGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'instruction' | 'ready' | 'playing' | 'feedback'>('instruction');
  const [score, setScore] = useState(0);
  const [correctResponses, setCorrectResponses] = useState(0);
  const [incorrectResponses, setIncorrectResponses] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showNumber, setShowNumber] = useState(true);

  // Generate a new trial based on difficulty
  const generateTrial = useCallback((): Trial => {
    // Higher difficulty = closer numbers (harder to distinguish quickly)
    const range = Math.max(10, 100 - difficulty * 8);
    const minDiff = Math.max(1, Math.floor(10 - difficulty * 0.8));
    const maxDiff = Math.max(minDiff + 5, Math.floor(50 - difficulty * 3));
    
    const targetNumber = Math.floor(Math.random() * range) + 1;
    const diff = Math.floor(Math.random() * (maxDiff - minDiff)) + minDiff;
    const isHigher = Math.random() > 0.5;
    
    const currentNumber = isHigher 
      ? Math.min(100, targetNumber + diff)
      : Math.max(1, targetNumber - diff);
    
    return {
      currentNumber,
      targetNumber,
      correctAnswer: currentNumber > targetNumber ? 'higher' : 'lower'
    };
  }, [difficulty]);

  // Start a new trial
  const startNewTrial = useCallback(() => {
    setShowNumber(false);
    setTimeout(() => {
      const newTrial = generateTrial();
      setTrial(newTrial);
      setTrialStartTime(Date.now());
      setFeedback(null);
      setShowNumber(true);
    }, 200);
  }, [generateTrial]);

  // Handle user response
  const handleResponse = useCallback((response: SortDirection) => {
    if (!trial || feedback) return;

    const reactionTime = Date.now() - trialStartTime;
    const isCorrect = response === trial.correctAnswer;

    setReactionTimes(prev => [...prev, reactionTime]);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectResponses(prev => prev + 1);
      
      // Score based on speed and streak
      const speedBonus = Math.max(0, Math.floor((2000 - reactionTime) / 20));
      const streakBonus = Math.min(newStreak * 5, 50);
      const difficultyBonus = difficulty * 10;
      const points = 50 + speedBonus + streakBonus + difficultyBonus;
      
      setScore(prev => prev + points);
      setFeedback('correct');

      // Adaptive difficulty - increase on streaks
      if (newStreak % 5 === 0 && difficulty < 10) {
        setDifficulty(prev => Math.min(10, prev + 1));
      }
    } else {
      setStreak(0);
      setIncorrectResponses(prev => prev + 1);
      setFeedback('incorrect');

      // Adaptive difficulty - decrease on errors
      if (difficulty > 1) {
        setDifficulty(prev => Math.max(1, prev - 0.5));
      }
    }

    // Brief feedback then next trial
    setTimeout(() => {
      startNewTrial();
    }, 400);
  }, [trial, feedback, trialStartTime, streak, difficulty, startNewTrial]);

  // Keyboard controls
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        handleResponse('higher');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleResponse('lower');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleResponse]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('feedback');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Start game
  const startGame = () => {
    setPhase('ready');
    setTimeout(() => {
      setPhase('playing');
      startNewTrial();
    }, 1500);
  };

  // Complete game
  const completeGame = () => {
    const totalResponses = correctResponses + incorrectResponses;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;

    onComplete({
      score,
      accuracy,
      avgReactionTime,
      correctResponses,
      incorrectResponses,
      duration: 60
    });
  };

  // Instruction Phase
  if (phase === 'instruction') {
    return (
      <Card className="p-8 max-w-md mx-auto text-center bg-card/50 backdrop-blur border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
            <Zap className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">Speed Sort</h2>
          
          <div className="space-y-4 text-muted-foreground">
            <p>Compare the number to the target as fast as you can!</p>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg">
                  <ArrowUp className="w-5 h-5" />
                  <span className="font-medium">Higher</span>
                </div>
                <span className="text-sm">or</span>
                <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg">
                  <ArrowDown className="w-5 h-5" />
                  <span className="font-medium">Lower</span>
                </div>
              </div>
              <p className="text-sm">Use arrow keys ↑↓ or tap buttons</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              <Timer className="w-4 h-4" />
              <span>60 seconds</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onExit} className="flex-1">
              Back
            </Button>
            <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              Start
            </Button>
          </div>
        </motion.div>
      </Card>
    );
  }

  // Ready Phase
  if (phase === 'ready') {
    return (
      <Card className="p-8 max-w-md mx-auto text-center bg-card/50 backdrop-blur border-border/50">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-bold text-primary"
        >
          Ready...
        </motion.div>
      </Card>
    );
  }

  // Playing Phase
  if (phase === 'playing') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Score: <span className="text-foreground font-bold">{score}</span></span>
            {streak >= 3 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-yellow-500 font-medium"
              >
                🔥 {streak}x streak
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        <Progress value={(timeLeft / 60) * 100} className="h-2" />

        {/* Game Area */}
        <Card className={`p-8 text-center bg-card/50 backdrop-blur border-2 transition-colors ${
          feedback === 'correct' ? 'border-green-500/50 bg-green-500/10' :
          feedback === 'incorrect' ? 'border-red-500/50 bg-red-500/10' :
          'border-border/50'
        }`}>
          {trial && (
            <div className="space-y-8">
              {/* Target Number */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Target</span>
                <div className="text-3xl font-bold text-muted-foreground">
                  {trial.targetNumber}
                </div>
              </div>

              {/* Current Number */}
              <AnimatePresence mode="wait">
                {showNumber && (
                  <motion.div
                    key={trial.currentNumber}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    <span className="text-sm text-muted-foreground">Is this...</span>
                    <div className="text-7xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {trial.currentNumber}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Response Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => handleResponse('higher')}
                  disabled={!!feedback}
                  className="flex-1 max-w-32 h-16 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowUp className="w-6 h-6 mr-2" />
                  Higher
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleResponse('lower')}
                  disabled={!!feedback}
                  className="flex-1 max-w-32 h-16 bg-red-600 hover:bg-red-700 text-white"
                >
                  <ArrowDown className="w-6 h-6 mr-2" />
                  Lower
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Difficulty Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Target className="w-3 h-3" />
          <span>Level {Math.floor(difficulty)}</span>
        </div>
      </div>
    );
  }

  // Feedback Phase
  return (
    <Card className="p-8 max-w-md mx-auto text-center bg-card/50 backdrop-blur border-border/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
          <Zap className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
          <p className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            {score} pts
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Accuracy</p>
            <p className="text-xl font-bold text-foreground">
              {correctResponses + incorrectResponses > 0 
                ? Math.round((correctResponses / (correctResponses + incorrectResponses)) * 100)
                : 0}%
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Avg Speed</p>
            <p className="text-xl font-bold text-foreground">
              {reactionTimes.length > 0 
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : 0}ms
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Correct</p>
            <p className="text-xl font-bold text-green-500">{correctResponses}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Final Level</p>
            <p className="text-xl font-bold text-foreground">{Math.floor(difficulty)}</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {reactionTimes.length > 0 && reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length < 500
            ? "Lightning fast reflexes! Your processing speed is excellent."
            : "Great practice! Speed improves with consistent training."}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onExit} className="flex-1">
            Exit
          </Button>
          <Button onClick={completeGame} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
            Save & Continue
          </Button>
        </div>
      </motion.div>
    </Card>
  );
};

export default SpeedSortGame;
