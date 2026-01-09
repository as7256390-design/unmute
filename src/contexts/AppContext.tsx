import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Chat, Message, EmotionalState, UserProfile } from '@/types';

type ViewType = 'chat' | 'emotional-form' | 'phq9' | 'assessments' | 'support-rooms' | 'wall' | 'journal' | 'dashboard' | 'parent' | 'onboarding' | 'mood-tracker' | 'mood' | 'wellness' | 'alignment' | 'programs' | 'gamification' | 'counselor' | 'training' | 'relaxation' | 'institution' | 'brain-games' | 'family-activities' | 'listener-portal' | 'counsellor-portal';

interface AppContextType {
  // Chat state
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createNewChat: () => Chat;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  
  // User state
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  currentEmotionalState: EmotionalState | null;
  setCurrentEmotionalState: (state: EmotionalState | null) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userType: 'student' | 'parent' | null;
  setUserType: (type: 'student' | 'parent' | null) => void;
  
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Get initial userType from localStorage
const getInitialUserType = (): 'student' | 'parent' | null => {
  try {
    const stored = localStorage.getItem('aprivox_user_type');
    if (stored === 'student' || stored === 'parent') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return null;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentEmotionalState, setCurrentEmotionalState] = useState<EmotionalState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userType, setUserTypeState] = useState<'student' | 'parent' | null>(getInitialUserType);
  const [currentView, setCurrentView] = useState<ViewType>(getInitialUserType() ? 'chat' : 'onboarding');

  // Persist userType to localStorage
  const setUserType = useCallback((type: 'student' | 'parent' | null) => {
    setUserTypeState(type);
    try {
      if (type) {
        localStorage.setItem('aprivox_user_type', type);
      } else {
        localStorage.removeItem('aprivox_user_type');
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      emotionalState: currentEmotionalState || undefined,
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    return newChat;
  }, [currentEmotionalState]);

  const addMessage = useCallback((chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, newMessage],
          updatedAt: new Date(),
          title: chat.messages.length === 0 && message.role === 'user' 
            ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
            : chat.title,
        };
        if (currentChat?.id === chatId) {
          setCurrentChat(updatedChat);
        }
        return updatedChat;
      }
      return chat;
    }));
  }, [currentChat]);

  return (
    <AppContext.Provider value={{
      chats,
      currentChat,
      setCurrentChat,
      createNewChat,
      addMessage,
      userProfile,
      setUserProfile,
      currentEmotionalState,
      setCurrentEmotionalState,
      sidebarOpen,
      setSidebarOpen,
      userType,
      setUserType,
      currentView,
      setCurrentView,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
