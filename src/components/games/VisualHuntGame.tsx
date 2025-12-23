import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Eye } from 'lucide-react';

interface VisualHuntGameProps {
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

type HuntType = 'shape' | 'color' | 'orientation' | 'combined';

interface GridItem {
  id: number;
  shape: string;
  color: string;
  rotation: number;
  isTarget: boolean;
}

const SHAPES = ['●', '■', '▲', '◆', '★', '⬟'];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];
const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

export const VisualHuntGame: React.FC<VisualHuntGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [difficulty, setDifficulty] = useState(1);
  const [round, setRound] = useState(0);
  
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [targetDescription, setTargetDescription] = useState('');
  const [huntType, setHuntType] = useState<HuntType>('shape');
  const [gridSize, setGridSize] = useState(9);
  
  const [responses, setResponses] = useState<{ correct: boolean; time: number }[]>([]);
  const [trialStart, setTrialStart] = useState(0);
  const [feedback, setFeedback] = useState<{ id: number; correct: boolean } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const generateGrid = useCallback(() => {
    const size = Math.min(9 + difficulty * 3, 25);
    setGridSize(size);
    
    // Determine hunt type based on difficulty
    const types: HuntType[] = difficulty >= 3 ? ['shape', 'color', 'orientation', 'combined'] : 
                              difficulty >= 2 ? ['shape', 'color', 'orientation'] : 
                              ['shape', 'color'];
    const type = types[Math.floor(Math.random() * types.length)];
    setHuntType(type);
    
    // Pick target characteristics
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const targetRotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
    
    // Create distractors
    const items: GridItem[] = [];
    const targetPosition = Math.floor(Math.random() * size);
    
    for (let i = 0; i < size; i++) {
      if (i === targetPosition) {
        items.push({
          id: i,
          shape: targetShape,
          color: targetColor,
          rotation: targetRotation,
          isTarget: true
        });
      } else {
        // Create distractor that differs in the relevant dimension
        let distractorShape = targetShape;
        let distractorColor = targetColor;
        let distractorRotation = targetRotation;
        
        switch (type) {
          case 'shape':
            distractorShape = SHAPES.filter(s => s !== targetShape)[Math.floor(Math.random() * (SHAPES.length - 1))];
            // Keep some variation in other dimensions for realism
            if (Math.random() > 0.5) distractorColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            break;
          case 'color':
            distractorColor = COLORS.filter(c => c !== targetColor)[Math.floor(Math.random() * (COLORS.length - 1))];
            if (Math.random() > 0.5) distractorShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            break;
          case 'orientation':
            distractorRotation = ROTATIONS.filter(r => r !== targetRotation)[Math.floor(Math.random() * (ROTATIONS.length - 1))];
            break;
          case 'combined':
            // Target is unique in multiple ways
            if (Math.random() > 0.5) {
              distractorShape = SHAPES.filter(s => s !== targetShape)[Math.floor(Math.random() * (SHAPES.length - 1))];
            } else {
              distractorColor = COLORS.filter(c => c !== targetColor)[Math.floor(Math.random() * (COLORS.length - 1))];
            }
            break;
        }
        
        items.push({
          id: i,
          shape: distractorShape,
          color: distractorColor,
          rotation: distractorRotation,
          isTarget: false
        });
      }
    }
    
    // Shuffle grid
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
      items[i].id = i;
      items[j].id = j;
    }
    
    // Generate description
    let description = 'Find the ';
    switch (type) {
      case 'shape':
        description += `${targetShape} shape`;
        break;
      case 'color':
        const colorName = targetColor === '#ef4444' ? 'red' : 
                          targetColor === '#3b82f6' ? 'blue' :
                          targetColor === '#22c55e' ? 'green' :
                          targetColor === '#eab308' ? 'yellow' :
                          targetColor === '#a855f7' ? 'purple' : 'orange';
        description += `${colorName} item`;
        break;
      case 'orientation':
        description += `item rotated ${targetRotation}°`;
        break;
      case 'combined':
        description += `unique ${targetShape}`;
        break;
    }
    
    setGrid(items);
    setTargetDescription(description);
    setTrialStart(Date.now());
    setShowHint(false);
    setRound(prev => prev + 1);
  }, [difficulty]);

  const handleItemClick = useCallback((item: GridItem) => {
    const reactionTime = Date.now() - trialStart;
    const isCorrect = item.isTarget;
    
    setResponses(prev => [...prev, { correct: isCorrect, time: reactionTime }]);
    setFeedback({ id: item.id, correct: isCorrect });
    
    if (isCorrect) {
      const basePoints = 100 + difficulty * 25;
      const speedBonus = Math.max(0, Math.floor((3000 - reactionTime) / 30));
      const streakBonus = streak * 15;
      const sizeBonus = gridSize * 5;
      
      setScore(prev => prev + basePoints + speedBonus + streakBonus + sizeBonus);
      setStreak(prev => prev + 1);
      
      if (streak > 0 && streak % 5 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 5));
      }
    } else {
      setStreak(0);
    }
    
    setTimeout(() => {
      setFeedback(null);
      generateGrid();
    }, isCorrect ? 300 : 800);
  }, [trialStart, difficulty, streak, gridSize, generateGrid]);

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
        duration: 60
      });
    }
  }, [phase, score, responses, onComplete]);

  // Hint after 5 seconds
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const hintTimer = setTimeout(() => {
      setShowHint(true);
    }, 5000);
    
    return () => clearTimeout(hintTimer);
  }, [phase, round]);

  const startGame = () => {
    setPhase('playing');
    generateGrid();
  };

  const getGridCols = () => {
    if (gridSize <= 9) return 'grid-cols-3';
    if (gridSize <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Visual Hunt</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            Sharpen your visual search skills by finding the target among distractors. 
            The grid grows larger as you improve!
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Read the target description at the top</li>
              <li>• Quickly scan the grid</li>
              <li>• Click the matching item</li>
              <li>• Faster finds = higher scores!</li>
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
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Grid: {gridSize}
          </span>
        </div>
        <div className="text-lg font-mono">{timeLeft}s</div>
      </div>
      
      <Progress value={(timeLeft / 60) * 100} className="w-full h-2" />

      {/* Target description */}
      <motion.div
        key={targetDescription}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center py-3 px-6 bg-primary/10 rounded-lg border border-primary/20"
      >
        <span className="font-semibold text-lg">{targetDescription}</span>
      </motion.div>

      {/* Grid */}
      <Card className="p-4">
        <div className={`grid ${getGridCols()} gap-2`}>
          {grid.map(item => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleItemClick(item)}
              className={`w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-2xl transition-all ${
                feedback?.id === item.id 
                  ? feedback.correct 
                    ? 'ring-2 ring-green-500 bg-green-100 dark:bg-green-900/30' 
                    : 'ring-2 ring-red-500 bg-red-100 dark:bg-red-900/30'
                  : 'hover:bg-muted'
              } ${
                showHint && item.isTarget ? 'animate-pulse' : ''
              }`}
              style={{ 
                color: item.color,
                transform: `rotate(${item.rotation}deg)`
              }}
            >
              {item.shape}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Hunt type indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Looking for:</span>
        <span className={`px-2 py-0.5 rounded ${
          huntType === 'shape' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
          huntType === 'color' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          huntType === 'orientation' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        }`}>
          {huntType.toUpperCase()}
        </span>
      </div>

      <Button variant="ghost" size="sm" onClick={onExit} className="mt-4">
        Exit Game
      </Button>
    </div>
  );
};
