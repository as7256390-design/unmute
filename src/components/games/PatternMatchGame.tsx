import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, Zap } from 'lucide-react';

interface PatternMatchGameProps {
  onComplete: (score: number, accuracy: number, duration: number) => void;
  onQuit: () => void;
}

interface Pattern {
  id: number;
  shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';
  color: string;
  size: 'sm' | 'md' | 'lg';
  rotation: number;
}

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon'] as const;
const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500'
];
const SIZES = ['sm', 'md', 'lg'] as const;
const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

const GAME_DURATION = 60; // 60 seconds
const PATTERNS_PER_ROUND = 4;

export function PatternMatchGame({ onComplete, onQuit }: PatternMatchGameProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [targetPattern, setTargetPattern] = useState<Pattern | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [isStarted, setIsStarted] = useState(false);

  const generatePattern = useCallback((): Pattern => {
    return {
      id: Math.random(),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: SIZES[Math.floor(Math.random() * SIZES.length)],
      rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
    };
  }, []);

  const patternsMatch = (p1: Pattern, p2: Pattern): boolean => {
    return p1.shape === p2.shape && p1.color === p2.color;
  };

  const generateRound = useCallback(() => {
    const target = generatePattern();
    const numPatterns = PATTERNS_PER_ROUND + Math.floor(difficulty / 2);
    const matchIndex = Math.floor(Math.random() * numPatterns);
    
    const newPatterns: Pattern[] = [];
    for (let i = 0; i < numPatterns; i++) {
      if (i === matchIndex) {
        // Create a matching pattern (same shape and color, but can vary in size/rotation)
        newPatterns.push({
          ...target,
          id: Math.random(),
          size: SIZES[Math.floor(Math.random() * SIZES.length)],
          rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
        });
      } else {
        // Generate a non-matching pattern
        let pattern: Pattern;
        do {
          pattern = generatePattern();
        } while (patternsMatch(pattern, target));
        newPatterns.push(pattern);
      }
    }

    setTargetPattern(target);
    setPatterns(newPatterns);
  }, [difficulty, generatePattern]);

  const handlePatternClick = (pattern: Pattern) => {
    if (!targetPattern || feedback) return;

    const isCorrect = patternsMatch(pattern, targetPattern);
    
    if (isCorrect) {
      const streakBonus = Math.min(streak * 10, 50);
      const difficultyBonus = difficulty * 20;
      const pointsEarned = 100 + streakBonus + difficultyBonus;
      
      setScore(prev => prev + pointsEarned);
      setStreak(prev => prev + 1);
      setCorrect(prev => prev + 1);
      setFeedback('correct');
      
      // Increase difficulty every 3 correct answers
      if ((correct + 1) % 3 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 5));
      }
    } else {
      setStreak(0);
      setIncorrect(prev => prev + 1);
      setFeedback('incorrect');
    }

    setTimeout(() => {
      setFeedback(null);
      generateRound();
    }, 500);
  };

  // Timer
  useEffect(() => {
    if (!isStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const total = correct + incorrect;
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
          onComplete(score, accuracy, GAME_DURATION);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, score, correct, incorrect, onComplete]);

  // Start game
  useEffect(() => {
    if (isStarted) {
      generateRound();
    }
  }, [isStarted, generateRound]);

  const renderShape = (pattern: Pattern, isTarget = false) => {
    const sizeClass = {
      sm: isTarget ? 'w-12 h-12' : 'w-16 h-16',
      md: isTarget ? 'w-14 h-14' : 'w-20 h-20',
      lg: isTarget ? 'w-16 h-16' : 'w-24 h-24',
    }[pattern.size];

    const shapeClass = (() => {
      switch (pattern.shape) {
        case 'circle':
          return 'rounded-full';
        case 'square':
          return 'rounded-md';
        case 'diamond':
          return 'rounded-md rotate-45';
        case 'hexagon':
          return 'rounded-lg';
        case 'triangle':
          return 'clip-triangle';
        default:
          return '';
      }
    })();

    return (
      <div
        className={`${sizeClass} ${pattern.color} ${shapeClass} transition-transform`}
        style={{ 
          transform: pattern.shape === 'triangle' 
            ? `rotate(${pattern.rotation}deg)` 
            : pattern.shape === 'diamond' 
              ? `rotate(${45 + pattern.rotation}deg)` 
              : `rotate(${pattern.rotation}deg)`,
          clipPath: pattern.shape === 'triangle' 
            ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
            : pattern.shape === 'hexagon'
              ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
              : undefined
        }}
      />
    );
  };

  if (!isStarted) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto">
            <span className="text-5xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Pattern Match</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Find the pattern that matches the target shape and color. 
              Size and rotation may vary!
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onQuit}>
              Back
            </Button>
            <Button variant="gradient" onClick={() => setIsStarted(true)}>
              Start Game
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg font-bold">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold">{streak}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
      </div>

      {/* Timer Progress */}
      <Progress value={(timeLeft / GAME_DURATION) * 100} className="h-2 mb-6" />

      {/* Target Pattern */}
      <Card className="glass p-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Find this pattern:</p>
          {targetPattern && (
            <motion.div
              key={targetPattern.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center"
            >
              {renderShape(targetPattern, true)}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Pattern Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {patterns.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 flex items-center justify-center min-h-[120px]
                    ${feedback === 'correct' && patternsMatch(pattern, targetPattern!) ? 'border-green-500 bg-green-500/10' : ''}
                    ${feedback === 'incorrect' && patternsMatch(pattern, targetPattern!) ? 'border-green-500 bg-green-500/10' : ''}
                  `}
                  onClick={() => handlePatternClick(pattern)}
                >
                  {renderShape(pattern)}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {feedback === 'correct' ? (
                <Check className="w-10 h-10 text-white" />
              ) : (
                <X className="w-10 h-10 text-white" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit Button */}
      <div className="mt-4 text-center">
        <Button variant="ghost" size="sm" onClick={onQuit}>
          Quit Game
        </Button>
      </div>
    </div>
  );
}
