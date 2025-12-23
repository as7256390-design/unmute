import { useState, useCallback, useRef } from 'react';
import { 
  GameState, 
  GameResult, 
  AdaptiveDifficultyParams,
  FeedbackData 
} from '@/types/cognitive';

const DIFFICULTY_INCREASE_THRESHOLD = 0.85; // 85% accuracy
const DIFFICULTY_DECREASE_THRESHOLD = 0.5; // 50% accuracy
const DIFFICULTY_STEP = 0.1;
const MIN_DIFFICULTY = 0.5;
const MAX_DIFFICULTY = 5.0;

interface UseCognitiveEngineProps {
  maxDuration?: number;
  onComplete?: (result: GameResult) => void;
}

export function useCognitiveEngine({ 
  maxDuration = 90,
  onComplete 
}: UseCognitiveEngineProps = {}) {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'instruction',
    difficulty: 1.0,
    score: 0,
    correctResponses: 0,
    incorrectResponses: 0,
    reactionTimes: [],
    startTime: null,
    elapsedSeconds: 0,
    maxDuration
  });

  const consecutiveCorrectRef = useRef(0);
  const consecutiveIncorrectRef = useRef(0);
  const lastResponseTimeRef = useRef<number | null>(null);
  const trialStartTimeRef = useRef<number | null>(null);

  // Calculate adaptive difficulty
  const calculateNewDifficulty = useCallback((params: AdaptiveDifficultyParams): number => {
    const { 
      currentDifficulty, 
      recentAccuracy, 
      recentReactionTimes,
      consecutiveCorrect,
      consecutiveIncorrect 
    } = params;

    let newDifficulty = currentDifficulty;

    // Gradual increase when performance is stable and good
    if (recentAccuracy >= DIFFICULTY_INCREASE_THRESHOLD && consecutiveCorrect >= 3) {
      // Check reaction time consistency (low variance = stable performance)
      if (recentReactionTimes.length >= 3) {
        const avgRT = recentReactionTimes.reduce((a, b) => a + b, 0) / recentReactionTimes.length;
        const variance = recentReactionTimes.reduce((sum, rt) => sum + Math.pow(rt - avgRT, 2), 0) / recentReactionTimes.length;
        const cv = Math.sqrt(variance) / avgRT; // Coefficient of variation
        
        if (cv < 0.3) { // Consistent reaction times
          newDifficulty += DIFFICULTY_STEP;
        } else {
          newDifficulty += DIFFICULTY_STEP * 0.5; // Slower increase if inconsistent
        }
      } else {
        newDifficulty += DIFFICULTY_STEP * 0.5;
      }
    }

    // Subtle decrease when strain is detected
    if (recentAccuracy < DIFFICULTY_DECREASE_THRESHOLD || consecutiveIncorrect >= 3) {
      newDifficulty -= DIFFICULTY_STEP * 0.75; // Gentler decrease
    }

    return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, newDifficulty));
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    const now = Date.now();
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      startTime: now,
      elapsedSeconds: 0
    }));
    consecutiveCorrectRef.current = 0;
    consecutiveIncorrectRef.current = 0;
  }, []);

  // Start a new trial (for reaction time tracking)
  const startTrial = useCallback(() => {
    trialStartTimeRef.current = Date.now();
  }, []);

  // Record a response
  const recordResponse = useCallback((isCorrect: boolean, points: number = 10) => {
    const now = Date.now();
    let reactionTime: number | undefined;
    
    if (trialStartTimeRef.current) {
      reactionTime = now - trialStartTimeRef.current;
      trialStartTimeRef.current = null;
    }

    if (isCorrect) {
      consecutiveCorrectRef.current++;
      consecutiveIncorrectRef.current = 0;
    } else {
      consecutiveIncorrectRef.current++;
      consecutiveCorrectRef.current = 0;
    }

    setGameState(prev => {
      const newReactionTimes = reactionTime 
        ? [...prev.reactionTimes.slice(-9), reactionTime] 
        : prev.reactionTimes;
      
      const newCorrect = prev.correctResponses + (isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrectResponses + (isCorrect ? 0 : 1);
      const totalResponses = newCorrect + newIncorrect;
      const recentAccuracy = totalResponses > 0 ? newCorrect / totalResponses : 0;

      // Calculate new difficulty
      const newDifficulty = calculateNewDifficulty({
        currentDifficulty: prev.difficulty,
        recentAccuracy,
        recentReactionTimes: newReactionTimes,
        errorRecoverySpeed: 0, // Could be enhanced
        consecutiveCorrect: consecutiveCorrectRef.current,
        consecutiveIncorrect: consecutiveIncorrectRef.current
      });

      // Score calculation - weighted by difficulty and speed
      let scoreIncrease = 0;
      if (isCorrect) {
        const difficultyBonus = 1 + (prev.difficulty - 1) * 0.2;
        const speedBonus = reactionTime && reactionTime < 1000 ? 1.2 : 1;
        scoreIncrease = Math.round(points * difficultyBonus * speedBonus);
      }

      return {
        ...prev,
        score: prev.score + scoreIncrease,
        correctResponses: newCorrect,
        incorrectResponses: newIncorrect,
        reactionTimes: newReactionTimes,
        difficulty: newDifficulty
      };
    });

    lastResponseTimeRef.current = now;
  }, [calculateNewDifficulty]);

  // Update elapsed time
  const updateElapsed = useCallback((seconds: number) => {
    setGameState(prev => ({ ...prev, elapsedSeconds: seconds }));
  }, []);

  // End the game and calculate results
  const endGame = useCallback((): GameResult => {
    const result: GameResult = {
      score: gameState.score,
      accuracy: gameState.correctResponses + gameState.incorrectResponses > 0
        ? gameState.correctResponses / (gameState.correctResponses + gameState.incorrectResponses)
        : 0,
      avgReactionTime: gameState.reactionTimes.length > 0
        ? Math.round(gameState.reactionTimes.reduce((a, b) => a + b, 0) / gameState.reactionTimes.length)
        : 0,
      correctResponses: gameState.correctResponses,
      incorrectResponses: gameState.incorrectResponses,
      durationSeconds: gameState.elapsedSeconds,
      endingDifficulty: gameState.difficulty,
      domainPointsEarned: Math.round(gameState.score * 0.1 * gameState.difficulty)
    };

    setGameState(prev => ({ ...prev, phase: 'feedback' }));
    onComplete?.(result);
    
    return result;
  }, [gameState, onComplete]);

  // Generate feedback
  const generateFeedback = useCallback((
    result: GameResult, 
    recentAvgScore: number | null,
    personalBest: number | null
  ): FeedbackData => {
    // Compare to recent average
    let vsRecent: 'better' | 'similar' | 'developing' = 'similar';
    if (recentAvgScore !== null) {
      const diff = result.score - recentAvgScore;
      const percentDiff = diff / recentAvgScore;
      if (percentDiff > 0.1) vsRecent = 'better';
      else if (percentDiff < -0.1) vsRecent = 'developing';
    }

    // Compare to personal best
    let vsPersonalBest: 'new_best' | 'approaching' | 'practicing' = 'practicing';
    if (personalBest !== null) {
      if (result.score > personalBest) vsPersonalBest = 'new_best';
      else if (result.score >= personalBest * 0.9) vsPersonalBest = 'approaching';
    } else {
      vsPersonalBest = 'new_best'; // First time playing
    }

    // Domain insight based on performance metrics
    let domainInsight = '';
    if (result.accuracy >= 0.9) {
      domainInsight = 'Your accuracy is remarkably consistent';
    } else if (result.accuracy >= 0.75) {
      domainInsight = 'Solid accuracy with room to grow';
    } else {
      domainInsight = 'Focus on accuracy over speed for now';
    }

    if (result.avgReactionTime > 0 && result.avgReactionTime < 500) {
      domainInsight += ' — quick responses observed';
    }

    // Neutral, observational encouragement
    const encouragements = [
      'Practice builds patterns.',
      'Each session contributes to your practice.',
      'Consistency matters more than perfection.',
      'You showed up. That counts.',
      'Progress isn\'t always visible, but it\'s there.'
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    return {
      result,
      comparison: { vsRecent, vsPersonalBest },
      domainInsight,
      encouragement
    };
  }, []);

  // Complete and move to final state
  const finishSession = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'complete' }));
  }, []);

  // Reset for new game
  const resetGame = useCallback(() => {
    setGameState({
      phase: 'instruction',
      difficulty: 1.0,
      score: 0,
      correctResponses: 0,
      incorrectResponses: 0,
      reactionTimes: [],
      startTime: null,
      elapsedSeconds: 0,
      maxDuration
    });
    consecutiveCorrectRef.current = 0;
    consecutiveIncorrectRef.current = 0;
    trialStartTimeRef.current = null;
    lastResponseTimeRef.current = null;
  }, [maxDuration]);

  return {
    gameState,
    startGame,
    startTrial,
    recordResponse,
    updateElapsed,
    endGame,
    generateFeedback,
    finishSession,
    resetGame,
    difficulty: gameState.difficulty
  };
}
