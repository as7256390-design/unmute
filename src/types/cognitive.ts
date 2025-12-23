// Cognitive Domain Types
export type CognitiveDomain = 'attention' | 'memory' | 'speed' | 'flexibility' | 'problem_solving';

export interface DomainInfo {
  id: CognitiveDomain;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const DOMAIN_INFO: Record<CognitiveDomain, DomainInfo> = {
  attention: {
    id: 'attention',
    name: 'Attention',
    description: 'Focus and visual discrimination',
    icon: '🎯',
    color: 'hsl(var(--chart-1))'
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    description: 'Working and short-term recall',
    icon: '🧠',
    color: 'hsl(var(--chart-2))'
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    description: 'Processing and reaction time',
    icon: '⚡',
    color: 'hsl(var(--chart-3))'
  },
  flexibility: {
    id: 'flexibility',
    name: 'Flexibility',
    description: 'Cognitive shifting and adaptation',
    icon: '🔄',
    color: 'hsl(var(--chart-4))'
  },
  problem_solving: {
    id: 'problem_solving',
    name: 'Problem Solving',
    description: 'Logic and pattern recognition',
    icon: '🧩',
    color: 'hsl(var(--chart-5))'
  }
};

// Game State Types
export interface GameState {
  phase: 'instruction' | 'playing' | 'feedback' | 'complete';
  difficulty: number;
  score: number;
  correctResponses: number;
  incorrectResponses: number;
  reactionTimes: number[];
  startTime: number | null;
  elapsedSeconds: number;
  maxDuration: number;
}

export interface GameResult {
  score: number;
  accuracy: number;
  avgReactionTime: number;
  correctResponses: number;
  incorrectResponses: number;
  durationSeconds: number;
  endingDifficulty: number;
  domainPointsEarned: number;
}

export interface AdaptiveDifficultyParams {
  currentDifficulty: number;
  recentAccuracy: number;
  recentReactionTimes: number[];
  errorRecoverySpeed: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface FeedbackData {
  result: GameResult;
  comparison: {
    vsRecent: 'better' | 'similar' | 'developing';
    vsPersonalBest: 'new_best' | 'approaching' | 'practicing';
  };
  domainInsight: string;
  encouragement: string;
}

// Database Types (matching Supabase schema)
export interface CognitiveGame {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  primary_domain: CognitiveDomain;
  secondary_domain: CognitiveDomain | null;
  icon: string;
  min_duration_seconds: number;
  max_duration_seconds: number;
  is_active: boolean;
}

export interface CognitiveDomainProgress {
  id: string;
  user_id: string;
  domain: CognitiveDomain;
  proficiency_score: number;
  sessions_completed: number;
  total_practice_time_seconds: number;
  last_practiced_at: string | null;
}

export interface CognitiveSession {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  starting_difficulty: number;
  ending_difficulty: number | null;
  score: number | null;
  accuracy: number | null;
  avg_reaction_time_ms: number | null;
  correct_responses: number;
  incorrect_responses: number;
  domain_points_earned: number;
}

export interface CognitiveProfile {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  total_sessions: number;
  total_practice_time_seconds: number;
}

export interface PersonalBest {
  id: string;
  user_id: string;
  game_id: string;
  best_score: number | null;
  best_accuracy: number | null;
  best_reaction_time_ms: number | null;
  achieved_at: string;
}
