import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Timer, Target, CheckCircle, XCircle } from 'lucide-react';

interface LogicChainGameProps {
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

type PatternType = 'arithmetic' | 'geometric' | 'fibonacci' | 'custom';

interface Trial {
  sequence: number[];
  missingIndex: number;
  correctAnswer: number;
  options: number[];
  patternType: PatternType;
  patternHint: string;
}

const LogicChainGame: React.FC<LogicChainGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'instruction' | 'ready' | 'playing' | 'feedback'>('instruction');
  const [score, setScore] = useState(0);
  const [correctResponses, setCorrectResponses] = useState(0);
  const [incorrectResponses, setIncorrectResponses] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [trialCount, setTrialCount] = useState(0);

  // Generate pattern sequence based on difficulty
  const generateTrial = useCallback((): Trial => {
    const patterns: { type: PatternType; generate: () => { seq: number[]; hint: string } }[] = [
      // Arithmetic sequences (+n)
      {
        type: 'arithmetic',
        generate: () => {
          const start = Math.floor(Math.random() * 20) + 1;
          const step = Math.floor(Math.random() * (3 + difficulty)) + 1;
          const length = Math.min(6, 4 + Math.floor(difficulty / 3));
          const seq = Array.from({ length }, (_, i) => start + step * i);
          return { seq, hint: `+${step}` };
        }
      },
      // Geometric sequences (*n)
      {
        type: 'geometric',
        generate: () => {
          const start = Math.floor(Math.random() * 5) + 1;
          const multiplier = Math.floor(Math.random() * 2) + 2;
          const length = Math.min(5, 4 + Math.floor(difficulty / 4));
          const seq = Array.from({ length }, (_, i) => start * Math.pow(multiplier, i));
          return { seq, hint: `×${multiplier}` };
        }
      },
      // Fibonacci-like sequences
      {
        type: 'fibonacci',
        generate: () => {
          const a = Math.floor(Math.random() * 5) + 1;
          const b = Math.floor(Math.random() * 5) + 1;
          const seq = [a, b];
          const length = Math.min(6, 5 + Math.floor(difficulty / 3));
          for (let i = 2; i < length; i++) {
            seq.push(seq[i - 1] + seq[i - 2]);
          }
          return { seq, hint: 'sum of prev 2' };
        }
      },
      // Custom patterns (alternating, squares, etc.)
      {
        type: 'custom',
        generate: () => {
          const patternChoice = Math.floor(Math.random() * 3);
          if (patternChoice === 0) {
            // Alternating add pattern: +a, +b, +a, +b
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 3;
            const start = Math.floor(Math.random() * 10) + 1;
            const seq = [start];
            for (let i = 1; i < 6; i++) {
              seq.push(seq[i - 1] + (i % 2 === 1 ? a : b));
            }
            return { seq, hint: `+${a}, +${b} alternating` };
          } else if (patternChoice === 1) {
            // Square numbers
            const offset = Math.floor(Math.random() * 5);
            const seq = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) ** 2);
            return { seq, hint: 'squares' };
          } else {
            // Triangular numbers
            const seq = Array.from({ length: 5 }, (_, i) => ((i + 1) * (i + 2)) / 2);
            return { seq, hint: 'triangular' };
          }
        }
      }
    ];

    // Select pattern type based on difficulty
    const availablePatterns = difficulty < 3 
      ? patterns.slice(0, 2) 
      : difficulty < 6 
        ? patterns.slice(0, 3)
        : patterns;
    
    const selectedPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const { seq, hint } = selectedPattern.generate();

    // Determine missing position (not first or last for easier games)
    const minMissing = difficulty < 4 ? 1 : 0;
    const maxMissing = difficulty < 4 ? seq.length - 2 : seq.length - 1;
    const missingIndex = Math.floor(Math.random() * (maxMissing - minMissing + 1)) + minMissing;
    const correctAnswer = seq[missingIndex];

    // Generate wrong options
    const options = new Set<number>([correctAnswer]);
    while (options.size < 4) {
      const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrongAnswer = correctAnswer + offset;
      if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
        options.add(wrongAnswer);
      }
    }

    return {
      sequence: seq,
      missingIndex,
      correctAnswer,
      options: Array.from(options).sort(() => Math.random() - 0.5),
      patternType: selectedPattern.type,
      patternHint: hint
    };
  }, [difficulty]);

  // Start a new trial
  const startNewTrial = useCallback(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeout(() => {
      const newTrial = generateTrial();
      setTrial(newTrial);
      setTrialStartTime(Date.now());
      setTrialCount(prev => prev + 1);
    }, 300);
  }, [generateTrial]);

  // Handle user response
  const handleResponse = useCallback((answer: number) => {
    if (!trial || showResult) return;

    const reactionTime = Date.now() - trialStartTime;
    const isCorrect = answer === trial.correctAnswer;

    setSelectedAnswer(answer);
    setShowResult(true);
    setReactionTimes(prev => [...prev, reactionTime]);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectResponses(prev => prev + 1);

      // Score based on difficulty and speed
      const basePoints = 100;
      const speedBonus = Math.max(0, Math.floor((5000 - reactionTime) / 50));
      const streakBonus = Math.min(newStreak * 10, 100);
      const difficultyBonus = difficulty * 20;
      const points = basePoints + speedBonus + streakBonus + difficultyBonus;

      setScore(prev => prev + points);

      // Adaptive difficulty
      if (newStreak % 3 === 0 && difficulty < 10) {
        setDifficulty(prev => Math.min(10, prev + 0.5));
      }
    } else {
      setStreak(0);
      setIncorrectResponses(prev => prev + 1);

      // Decrease difficulty on errors
      if (difficulty > 1) {
        setDifficulty(prev => Math.max(1, prev - 0.5));
      }
    }

    // Move to next trial after showing result
    setTimeout(() => {
      startNewTrial();
    }, 1200);
  }, [trial, showResult, trialStartTime, streak, difficulty, startNewTrial]);

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
      duration: 90
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
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <Link className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground">Logic Chain</h2>

          <div className="space-y-4 text-muted-foreground">
            <p>Find the missing number in the sequence!</p>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-lg font-mono">
                <span className="bg-background/50 px-3 py-1 rounded">2</span>
                <span className="bg-background/50 px-3 py-1 rounded">4</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded border-2 border-dashed border-primary">?</span>
                <span className="bg-background/50 px-3 py-1 rounded">8</span>
              </div>
              <p className="text-sm">Identify the pattern and find the missing value</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <Timer className="w-4 h-4" />
              <span>90 seconds</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onExit} className="flex-1">
              Back
            </Button>
            <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
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
      <div className="max-w-lg mx-auto space-y-6">
        {/* Stats Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Score: <span className="text-foreground font-bold">{score}</span></span>
            {streak >= 2 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-purple-400 font-medium"
              >
                🔗 {streak}x chain
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

        <Progress value={(timeLeft / 90) * 100} className="h-2" />

        {/* Game Area */}
        <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
          {trial && (
            <div className="space-y-6">
              {/* Sequence Display */}
              <div className="text-center space-y-3">
                <span className="text-sm text-muted-foreground">Pattern #{trialCount}</span>
                
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {trial.sequence.map((num, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative ${index === trial.missingIndex ? 'w-16' : 'w-14'}`}
                    >
                      {index === trial.missingIndex ? (
                        <div className={`h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-xl font-bold ${
                          showResult 
                            ? selectedAnswer === trial.correctAnswer
                              ? 'border-green-500 bg-green-500/20 text-green-400'
                              : 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-primary bg-primary/10 text-primary'
                        }`}>
                          {showResult ? trial.correctAnswer : '?'}
                        </div>
                      ) : (
                        <div className="h-14 bg-muted/50 rounded-lg flex items-center justify-center text-xl font-bold text-foreground">
                          {num}
                        </div>
                      )}
                      {index < trial.sequence.length - 1 && (
                        <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground">→</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-3">
                {trial.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === trial.correctAnswer;
                  const showCorrectness = showResult && (isSelected || isCorrect);

                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      onClick={() => handleResponse(option)}
                      disabled={showResult}
                      className={`p-4 rounded-lg text-xl font-bold transition-all ${
                        showCorrectness
                          ? isCorrect
                            ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                            : 'bg-red-500/20 border-2 border-red-500 text-red-400'
                          : 'bg-muted/50 hover:bg-muted border-2 border-transparent text-foreground hover:border-primary/50'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {option}
                        {showCorrectness && isCorrect && <CheckCircle className="w-5 h-5" />}
                        {showCorrectness && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Result Feedback */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-center p-2 rounded-lg ${
                      selectedAnswer === trial.correctAnswer
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {selectedAnswer === trial.correctAnswer
                      ? '✓ Correct!'
                      : `✗ The answer was ${trial.correctAnswer}`}
                  </motion.div>
                )}
              </AnimatePresence>
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
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
          <Link className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
          <p className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
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
            <p className="text-muted-foreground">Patterns Solved</p>
            <p className="text-xl font-bold text-foreground">{correctResponses}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Best Chain</p>
            <p className="text-xl font-bold text-purple-400">{streak}x</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-muted-foreground">Final Level</p>
            <p className="text-xl font-bold text-foreground">{Math.floor(difficulty)}</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {correctResponses >= 10
            ? "Excellent pattern recognition! Your logical reasoning is sharp."
            : "Good practice! Pattern recognition improves with each session."}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onExit} className="flex-1">
            Exit
          </Button>
          <Button onClick={completeGame} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
            Save & Continue
          </Button>
        </div>
      </motion.div>
    </Card>
  );
};

export default LogicChainGame;
