import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Heart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { EmotionalCheckIn } from './EmotionalCheckIn';
import { Message } from '@/types';

const initialResponses = [
  "I hear you, and I'm really glad you reached out. Whatever you're going through, you don't have to face it alone. Can you tell me more about what's on your mind?",
  "Thank you for trusting me with this. Your feelings are completely valid. Let's take this one step at a time. What's weighing on you the most right now?",
  "I'm here to listen without judgment. You're brave for opening up. What would feel most helpful for you right now - just venting, or exploring some ways to cope?",
];

export function ChatInterface() {
  const { currentChat, addMessage, createNewChat, currentEmotionalState } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(!currentChat || currentChat.messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const handleCheckInComplete = (emotion: string, supportType: string) => {
    const chat = currentChat || createNewChat();
    setShowCheckIn(false);
    
    // Add system context
    const systemMessage = `You're feeling ${emotion}. I'm here to support you.`;
    
    // Simulate AI greeting
    setTimeout(() => {
      const greeting = initialResponses[Math.floor(Math.random() * initialResponses.length)];
      addMessage(chat.id, {
        role: 'assistant',
        content: greeting,
        emotionalContext: emotion as any,
      });
    }, 1000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const chat = currentChat || createNewChat();
    const userMessage = input.trim();
    setInput('');
    
    addMessage(chat.id, {
      role: 'user',
      content: userMessage,
    });

    setIsTyping(true);
    
    // Simulate AI response (this would be replaced with actual AI call)
    setTimeout(() => {
      const responses = [
        "I understand how difficult that must be. It takes courage to share these feelings. What you're experiencing is more common than you might think, and there are ways to work through this together.",
        "Thank you for opening up about this. Your feelings are valid, and it's okay to not be okay sometimes. Would you like to explore what might be contributing to these feelings?",
        "I hear the pain in your words, and I want you to know that reaching out was a strong first step. Let's think about some small things that might help you feel even a little bit better today.",
        "You're not alone in feeling this way. Many students go through similar struggles. The important thing is that you're here, and you're talking about it. What do you think would help you most right now?",
      ];
      
      addMessage(chat.id, {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
      });
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showCheckIn) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmotionalCheckIn onComplete={handleCheckInComplete} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentChat?.messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="relative glass rounded-xl p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind... This is a safe space."
              className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
              rows={1}
            />
            <Button
              variant="gradient"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 bottom-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Everything you share here is private and secure 💚
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 animate-slide-up",
        isUser && "flex-row-reverse"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-secondary" : "gradient-hero"
        )}
      >
        {isUser ? (
          <Heart className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      <div 
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-md" 
            : "glass rounded-tl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-2 opacity-60",
          isUser ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
