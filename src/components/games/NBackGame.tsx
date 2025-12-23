import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target } from 'lucide-react';

interface NBackGameProps {
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

const GRID_POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 3x3 grid
const SHAPES = ['●', '■', '▲', '◆', '★', '♦'];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

export const NBackGame: React.FC<NBackGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [nLevel, setNLevel] = useState(1); // 1-back, 2-back, 3-back
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(25);
  const [currentPosition, setCurrentPosition] = useState(-1);
  const [currentShape, setCurrentShape] = useState('●');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [history, setHistory] = useState<{ position: number; shape: string; color: string }[]>([]);
  const [showingStimulus, setShowingStimulus] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [responded, setResponded] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'missed' | null>(null);
  const [responses, setResponses] = useState<{ correct: boolean; time: number }[]>([]);
  const [trialStart, setTrialStart] = useState(0);
  const [streak, setStreak] = useState(0);
  const [matchType, setMatchType] = useState<'position' | 'shape' | 'both'>('position');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isMatch = useCallback(() => {
    if (history.length < nLevel) return false;
    const nBackItem = history[history.length - nLevel];
    
    switch (matchType) {
      case 'position':
        return nBackItem.position === currentPosition;
      case 'shape':
        return nBackItem.shape === currentShape;
      case 'both':
        return nBackItem.position === currentPosition && nBackItem.shape === currentShape;
    }
  }, [history, nLevel, currentPosition, currentShape, matchType]);

  const generateStimulus = useCallback(() => {
    const matchChance = 0.3; // 30% chance of match
    const shouldMatch = Math.random() < matchChance && history.length >= nLevel;
    
    let newPosition: number;
    let newShape: string;
    let newColor: string;
    
    if (shouldMatch && history.length >= nLevel) {
      const nBackItem = history[history.length - nLevel];
      if (matchType === 'position' || matchType === 'both') {
        newPosition = nBackItem.position;
      } else {
        newPosition = GRID_POSITIONS[Math.floor(Math.random() * GRID_POSITIONS.length)];
      }
      if (matchType === 'shape' || matchType === 'both') {
        newShape = nBackItem.shape;
      } else {
        newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      }
      newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } else {
      // Ensure no accidental match
      do {
        newPosition = GRID_POSITIONS[Math.floor(Math.random() * GRID_POSITIONS.length)];
        newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      } while (
        history.length >= nLevel && 
        ((matchType === 'position' && newPosition === history[history.length - nLevel].position) ||
         (matchType === 'shape' && newShape === history[history.length - nLevel].shape))
      );
      newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    
    setCurrentPosition(newPosition);
    setCurrentShape(newShape);
    setCurrentColor(newColor);
    setShowingStimulus(true);
    setCanRespond(true);
    setResponded(false);
    setTrialStart(Date.now());
  }, [history, nLevel, matchType]);

  const handleResponse = useCallback((userSaysMatch: boolean) => {
    if (!canRespond || responded) return;
    
    const reactionTime = Date.now() - trialStart;
    const actualMatch = isMatch();
    const isCorrect = userSaysMatch === actualMatch;
    
    setResponded(true);
    setCanRespond(false);
    setResponses(prev => [...prev, { correct: isCorrect, time: reactionTime }]);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const basePoints = nLevel * 100;
      const speedBonus = Math.max(0, Math.floor((1500 - reactionTime) / 30));
      const streakBonus = streak * 15;
      setScore(prev => prev + basePoints + speedBonus + streakBonus);
      setStreak(prev => prev + 1);
      
      // Level up after good streaks
      if (streak > 0 && streak % 8 === 0 && nLevel < 3) {
        setNLevel(prev => Math.min(prev + 1, 3));
      }
    } else {
      setStreak(0);
      if (nLevel > 1 && streak === 0) {
        setNLevel(prev => Math.max(prev - 1, 1));
      }
    }
  }, [canRespond, responded, trialStart, isMatch, nLevel, streak]);

  const advanceRound = useCallback(() => {
    // Check if user missed a match
    if (!responded && isMatch()) {
      setFeedback('missed');
      setResponses(prev => [...prev, { correct: false, time: 2000 }]);
      setStreak(0);
    }
    
    // Add current to history
    setHistory(prev => [...prev, { position: currentPosition, shape: currentShape, color: currentColor }]);
    
    setShowingStimulus(false);
    setFeedback(null);
    
    if (round >= totalRounds - 1) {
      setPhase('finished');
      return;
    }
    
    setRound(prev => prev + 1);
    
    // Next stimulus after delay
    timeoutRef.current = setTimeout(() => {
      generateStimulus();
    }, 500);
  }, [responded, isMatch, currentPosition, currentShape, currentColor, round, totalRounds, generateStimulus]);

  useEffect(() => {
    if (phase !== 'playing' || !showingStimulus) return;
    
    const timer = setTimeout(() => {
      advanceRound();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [phase, showingStimulus, advanceRound]);

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
        duration: totalRounds * 2.5
      });
    }
  }, [phase, score, responses, onComplete, totalRounds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || !canRespond) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleResponse(true);
      } else if (e.key === 'n' || e.key === 'N') {
        handleResponse(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, canRespond, handleResponse]);

  const startGame = () => {
    setPhase('playing');
    setHistory([]);
    setRound(0);
    generateStimulus();
  };

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">N-Back Memory</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            The gold standard of working memory training. Remember if the current 
            position matches what appeared N steps ago!
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Watch shapes appear on a 3×3 grid</li>
              <li>• Press MATCH if position was same N steps ago</li>
              <li>• Press NO MATCH if it's different</li>
              <li>• Difficulty increases as you improve!</li>
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
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            nLevel === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            nLevel === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
          }`}>
            {nLevel}-Back
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {round + 1}/{totalRounds}
        </div>
      </div>
      
      <Progress value={((round + 1) / totalRounds) * 100} className="w-full h-2" />

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        Does this match the position from <span className="font-bold text-foreground">{nLevel} step{nLevel > 1 ? 's' : ''} ago</span>?
      </div>

      {/* Grid */}
      <Card className={`p-4 ${
        feedback === 'correct' ? 'ring-2 ring-green-500' : 
        feedback === 'wrong' || feedback === 'missed' ? 'ring-2 ring-red-500' : ''
      }`}>
        <div className="grid grid-cols-3 gap-2 w-48 h-48">
          {GRID_POSITIONS.map(pos => (
            <div
              key={pos}
              className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center relative"
            >
              <AnimatePresence>
                {showingStimulus && currentPosition === pos && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="text-4xl"
                    style={{ color: currentColor }}
                  >
                    {currentShape}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold ${
              feedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {feedback === 'correct' ? 'Correct!' : feedback === 'missed' ? 'Missed match!' : 'Wrong!'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response buttons */}
      <div className="flex gap-4 mt-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleResponse(false)}
            disabled={!canRespond || responded}
            className="px-8 h-14"
          >
            No Match
            <span className="ml-2 text-xs text-muted-foreground">[N]</span>
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            onClick={() => handleResponse(true)}
            disabled={!canRespond || responded}
            className="px-8 h-14 bg-primary"
          >
            <Target className="w-5 h-5 mr-2" />
            Match!
            <span className="ml-2 text-xs opacity-70">[Space]</span>
          </Button>
        </motion.div>
      </div>

      {/* History hint */}
      {history.length > 0 && nLevel <= history.length && (
        <div className="text-xs text-muted-foreground mt-2">
          <span className="opacity-50">
            {nLevel} step{nLevel > 1 ? 's' : ''} ago: position {history[history.length - nLevel]?.position + 1}
          </span>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onExit} className="mt-4">
        Exit Game
      </Button>
    </div>
  );
};
