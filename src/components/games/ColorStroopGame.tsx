import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Brain } from 'lucide-react';

interface ColorStroopGameProps {
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

const COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
];

type Mode = 'color' | 'word' | 'stroop';

export const ColorStroopGame: React.FC<ColorStroopGameProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState<{ text: string; color: string; correctAnswer: string }>({ text: '', color: '', correctAnswer: '' });
  const [mode, setMode] = useState<Mode>('color');
  const [difficulty, setDifficulty] = useState(1);
  const [responses, setResponses] = useState<{ correct: boolean; time: number }[]>([]);
  const [trialStart, setTrialStart] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [roundsInMode, setRoundsInMode] = useState(0);

  const generateStimulus = useCallback(() => {
    const textColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    let inkColor = textColor;
    
    // In stroop mode, make the ink color different from word
    if (mode === 'stroop' || (mode === 'color' && difficulty > 2)) {
      const otherColors = COLORS.filter(c => c.name !== textColor.name);
      inkColor = Math.random() > 0.3 ? otherColors[Math.floor(Math.random() * otherColors.length)] : textColor;
    }
    
    // Determine correct answer based on mode
    const correctAnswer = mode === 'word' ? textColor.name : inkColor.name;
    
    setCurrentWord({
      text: textColor.name,
      color: inkColor.hex,
      correctAnswer
    });
    setTrialStart(Date.now());
  }, [mode, difficulty]);

  const handleAnswer = useCallback((colorName: string) => {
    const reactionTime = Date.now() - trialStart;
    const isCorrect = colorName === currentWord.correctAnswer;
    
    setResponses(prev => [...prev, { correct: isCorrect, time: reactionTime }]);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      const basePoints = mode === 'stroop' ? 150 : mode === 'word' ? 100 : 75;
      const speedBonus = Math.max(0, Math.floor((2000 - reactionTime) / 50));
      const streakBonus = Math.min(streak, 10) * 10;
      const difficultyBonus = difficulty * 20;
      
      setScore(prev => prev + basePoints + speedBonus + streakBonus + difficultyBonus);
      setStreak(prev => prev + 1);
      
      // Increase difficulty with good performance
      if (streak > 0 && streak % 5 === 0) {
        setDifficulty(prev => Math.min(prev + 1, 5));
      }
    } else {
      setStreak(0);
      if (difficulty > 1) {
        setDifficulty(prev => Math.max(prev - 1, 1));
      }
    }
    
    // Progress through modes
    setRoundsInMode(prev => prev + 1);
    
    setTimeout(() => {
      setFeedback(null);
      
      // Mode progression
      if (roundsInMode >= 8) {
        setRoundsInMode(0);
        if (mode === 'color') setMode('word');
        else if (mode === 'word') setMode('stroop');
      }
      
      generateStimulus();
    }, 300);
  }, [currentWord, mode, streak, difficulty, trialStart, roundsInMode, generateStimulus]);

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

  const startGame = () => {
    setPhase('playing');
    generateStimulus();
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'color': return 'Select the INK COLOR';
      case 'word': return 'Select the WORD meaning';
      case 'stroop': return 'Select the INK COLOR (ignore the word!)';
    }
  };

  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Color Stroop Challenge</h2>
          <p className="text-muted-foreground max-w-md mb-4">
            Train your attention by overriding automatic responses. 
            The task changes - sometimes match the color, sometimes the word!
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Words appear in different colors</li>
              <li>• Follow the instruction at the top</li>
              <li>• Faster = more points</li>
              <li>• The task switches to challenge you!</li>
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
          <span className="text-sm text-muted-foreground">Mode:</span>
          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
            mode === 'stroop' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
            mode === 'word' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {mode.toUpperCase()}
          </span>
        </div>
        <div className="text-lg font-mono">{timeLeft}s</div>
      </div>
      
      <Progress value={(timeLeft / 60) * 100} className="w-full h-2" />

      {/* Instruction */}
      <motion.div
        key={mode}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center py-2 px-4 bg-muted/50 rounded-lg"
      >
        <span className="font-medium">{getModeDescription()}</span>
      </motion.div>

      {/* Stimulus */}
      <Card className={`w-full max-w-md h-40 flex items-center justify-center relative ${
        feedback === 'correct' ? 'ring-2 ring-green-500' : 
        feedback === 'wrong' ? 'ring-2 ring-red-500' : ''
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.text + currentWord.color}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-5xl font-black tracking-wider"
            style={{ color: currentWord.color }}
          >
            {currentWord.text}
          </motion.div>
        </AnimatePresence>
        
        {feedback && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${
              feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {feedback === 'correct' ? '✓' : '✗'}
          </motion.div>
        )}
      </Card>

      {/* Color buttons */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {COLORS.map(color => (
          <motion.button
            key={color.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(color.name)}
            className="h-16 rounded-xl font-bold text-white shadow-lg transition-all"
            style={{ backgroundColor: color.hex }}
          >
            {color.name}
          </motion.button>
        ))}
      </div>

      <Button variant="ghost" size="sm" onClick={onExit} className="mt-4">
        Exit Game
      </Button>
    </div>
  );
};
