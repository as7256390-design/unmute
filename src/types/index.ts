export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotionalContext?: EmotionalState;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  emotionalState?: EmotionalState;
}

export type EmotionalState = 
  | 'anxious'
  | 'overwhelmed'
  | 'sad'
  | 'angry'
  | 'numb'
  | 'hopeful'
  | 'confused'
  | 'lonely'
  | 'stressed'
  | 'neutral';

export interface EmotionalOption {
  id: EmotionalState;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

export interface UserProfile {
  id: string;
  userType: 'student' | 'parent' | 'listener';
  emotionalProfile?: EmotionalProfile;
  phq9Score?: number;
  createdAt: Date;
}

export interface EmotionalProfile {
  lifestyleHabits: {
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    nutrition: 1 | 2 | 3 | 4 | 5;
    exercise: 1 | 2 | 3 | 4 | 5;
    screenTime: 'low' | 'moderate' | 'high' | 'excessive';
  };
  academicEnvironment: {
    institutionType: string;
    academicPressure: 1 | 2 | 3 | 4 | 5;
    supportSystem: 1 | 2 | 3 | 4 | 5;
  };
  strugglingAreas: string[];
  interests: string[];
  pressureSources: string[];
  pastTrauma: string[];
  parentingStyle: 'authoritative' | 'authoritarian' | 'permissive' | 'neglectful' | 'mixed';
  peerEnvironment: {
    friendshipQuality: 1 | 2 | 3 | 4 | 5;
    socialSupport: 1 | 2 | 3 | 4 | 5;
  };
  thinkingPatterns: string[];
  medicalConditions: string[];
}

export interface PHQ9Response {
  questionId: number;
  score: 0 | 1 | 2 | 3;
}

export interface SupportRoom {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  isActive: boolean;
}

export interface WallPost {
  id: string;
  content: string;
  timestamp: Date;
  reactions: {
    notAlone: number;
    wantToChat: number;
    meeToo: number;
  };
  isAnonymous: boolean;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: EmotionalState;
  timestamp: Date;
  isVoiceNote: boolean;
  wantsResponse: boolean;
}

export interface GrowthBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

export interface MoodEntry {
  date: Date;
  mood: EmotionalState;
  intensity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}
