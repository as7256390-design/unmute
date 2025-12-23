import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, Sparkles } from 'lucide-react';

interface MemoryGridGameProps {
  onComplete: (score: number, accuracy: number, duration: number) => void;
  onQuit: () => void;
}

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = [
  '🌟', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺',
  '🌈', '🌺', '🌻', '🍀', '🦋', '🐬', '🦊', '🐼',
  '🚀', '⚡', '🔮', '💎', '🌙', '☀️', '🌊', '🔥'
];

const GAME_DURATION = 90; // 90 seconds
const INITIAL_PAIRS = 6;

export function MemoryGridGame({ onComplete, onQuit }: MemoryGridGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [level, setLevel] = useState(1);
  const [isStarted, setIsStarted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [totalPairs, setTotalPairs] = useState(INITIAL_PAIRS);

  const initializeLevel = useCallback((numPairs: number) => {
    const shuffledEmojis = [...EMOJI_PAIRS].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, numPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(cardPairs);
    setFlippedCards([]);
    setMatchedPairs(0);
    setTotalPairs(numPairs);
  }, []);

  const handleCardClick = (cardId: number) => {
    if (isLocked) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsLocked(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = cards.find(c => c.id === secondId)!;

      if (firstCard.emoji === secondCard.emoji) {
        // Match found!
        const levelBonus = level * 50;
        const speedBonus = Math.floor(timeLeft / 10) * 10;
        const pointsEarned = 150 + levelBonus + speedBonus;
        
        setScore(prev => prev + pointsEarned);
        setMatchedPairs(prev => prev + 1);

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true } 
              : c
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  // Check for level completion
  useEffect(() => {
    if (matchedPairs === totalPairs && totalPairs > 0 && isStarted) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        // Increase difficulty for next level
        const nextLevel = level + 1;
        const nextPairs = Math.min(INITIAL_PAIRS + Math.floor(nextLevel / 2), 12);
        setLevel(nextLevel);
        initializeLevel(nextPairs);
      }, 1500);
    }
  }, [matchedPairs, totalPairs, isStarted, level, initializeLevel]);

  // Timer
  useEffect(() => {
    if (!isStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const accuracy = moves > 0 ? Math.round((matchedPairs * 2 / moves) * 100) : 0;
          onComplete(score, Math.min(accuracy, 100), GAME_DURATION);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, score, moves, matchedPairs, onComplete]);

  // Start game
  useEffect(() => {
    if (isStarted) {
      initializeLevel(INITIAL_PAIRS);
    }
  }, [isStarted, initializeLevel]);

  const getGridCols = () => {
    const numCards = cards.length;
    if (numCards <= 12) return 'grid-cols-3 sm:grid-cols-4';
    if (numCards <= 16) return 'grid-cols-4';
    return 'grid-cols-4 sm:grid-cols-6';
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
            <span className="text-5xl">🧠</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Memory Grid</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Match pairs of cards by remembering their positions. 
              Clear each level to advance and earn bonus points!
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
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
            <span className="text-sm font-medium">Level {level}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
      </div>

      {/* Timer Progress */}
      <Progress value={(timeLeft / GAME_DURATION) * 100} className="h-2 mb-4" />

      {/* Level Progress */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">
          Pairs: {matchedPairs}/{totalPairs}
        </span>
        <span className="text-muted-foreground">
          Moves: {moves}
        </span>
      </div>

      {/* Card Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`grid ${getGridCols()} gap-2 md:gap-3 w-full max-w-lg`}>
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                className="aspect-square"
              >
                <Card
                  className={`w-full h-full cursor-pointer flex items-center justify-center text-2xl md:text-3xl transition-all duration-300 transform perspective-1000
                    ${card.isMatched ? 'bg-green-500/20 border-green-500/50' : ''}
                    ${card.isFlipped || card.isMatched ? '' : 'hover:border-primary/50 hover:bg-muted/50'}
                  `}
                  style={{
                    transform: card.isFlipped || card.isMatched ? 'rotateY(0)' : 'rotateY(180deg)',
                    transformStyle: 'preserve-3d',
                  }}
                  onClick={() => handleCardClick(card.id)}
                >
                  <motion.div
                    animate={{ 
                      scale: card.isMatched ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <span>{card.emoji}</span>
                    ) : (
                      <span className="text-muted-foreground/30">?</span>
                    )}
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Level Complete Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold">Level Complete!</h2>
              <p className="text-muted-foreground">Starting Level {level + 1}...</p>
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
