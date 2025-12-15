import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { EmotionalCheckIn } from './EmotionalCheckIn';
import { Message } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { detectCrisis } from '@/lib/crisisDetection';
import { CrisisResourcesBanner } from '@/components/crisis/CrisisResourcesBanner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const initialGreetings = [
  "Hey, I'm really glad you're here. 💙 Whatever you're going through, you don't have to face it alone. I'm here to listen — no judgment, no pressure. What's on your mind?",
  "Thank you for trusting me with this. Your feelings are completely valid, and it takes courage to reach out. Take your time — I'm here whenever you're ready to share.",
  "I'm here for you, and I'm listening. There's no rush, no right or wrong way to feel. What would help you most right now — just talking things out, or finding some ways to feel better?",
  "Hey there. I know reaching out isn't always easy, so thank you for being here. Whatever's going on, we can work through it together. What would you like to talk about?",
  "I'm so glad you came here. Your feelings matter, and so do you. Let's take this one step at a time. What's weighing on you the most right now?",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

async function streamChat({
  messages,
  emotionalState,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  emotionalState?: any;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, emotionalState }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      onError(errorData.error || "Failed to get response");
      return;
    }

    if (!resp.body) {
      onError("No response stream");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error.message : "Connection failed");
  }
}

export function ChatInterface() {
  const { currentChat, addMessage, createNewChat, currentEmotionalState, setCurrentChat } = useApp();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(!currentChat || currentChat.messages.length === 0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [isAbuse, setIsAbuse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages, streamingContent]);

  // Load existing conversation on mount
  useEffect(() => {
    if (!user) return;
    
    const loadRecentConversation = async () => {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const conv = conversations[0];
        setConversationId(conv.id);

        // Load messages
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (messages && messages.length > 0) {
          const chat = createNewChat();
          messages.forEach((msg) => {
            addMessage(chat.id, {
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            });
          });
          setShowCheckIn(false);
        }
      }
    };

    loadRecentConversation();
  }, [user]);

  const saveMessageToDb = async (role: 'user' | 'assistant', content: string, convId: string) => {
    if (!user) return;

    await supabase.from('chat_messages').insert({
      conversation_id: convId,
      user_id: user.id,
      role,
      content,
    });
  };

  const handleCheckInComplete = async (emotion: string, supportType: string) => {
    const chat = currentChat || createNewChat();
    setShowCheckIn(false);

    // Create conversation in DB
    if (user) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          emotional_state: emotion,
        })
        .select()
        .single();

      if (conv) {
        setConversationId(conv.id);
      }
    }
    
    setTimeout(() => {
      const greeting = initialGreetings[Math.floor(Math.random() * initialGreetings.length)];
      addMessage(chat.id, {
        role: 'assistant',
        content: greeting,
        emotionalContext: emotion as any,
      });

      if (user && conversationId) {
        saveMessageToDb('assistant', greeting, conversationId);
      }
    }, 500);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const chat = currentChat || createNewChat();
    const userMessage = input.trim();
    setInput('');

    // Check for crisis content
    const crisisResult = detectCrisis(userMessage);
    if (crisisResult.showResources) {
      setShowCrisisResources(true);
      setIsAbuse(crisisResult.isAbuse);

      // Log crisis alert
      if (user && conversationId) {
        await supabase.from('crisis_alerts').insert({
          user_id: user.id,
          source_type: 'chat',
          source_id: conversationId,
          content: userMessage,
          severity: crisisResult.severity,
          keywords_matched: crisisResult.matchedKeywords,
        });
      }
    }
    
    addMessage(chat.id, {
      role: 'user',
      content: userMessage,
    });

    // Save user message to DB
    if (user && conversationId) {
      await saveMessageToDb('user', userMessage, conversationId);
    }

    setIsTyping(true);
    setStreamingContent('');

    // Build message history for AI (filter out system messages)
    const chatMessages: ChatMessage[] = [
      ...(chat.messages || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];

    let assistantContent = '';

    await streamChat({
      messages: chatMessages,
      emotionalState: currentEmotionalState,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setStreamingContent(assistantContent);
      },
      onDone: async () => {
        if (assistantContent) {
          addMessage(chat.id, {
            role: 'assistant',
            content: assistantContent,
          });

          // Save assistant message to DB
          if (user && conversationId) {
            await saveMessageToDb('assistant', assistantContent, conversationId);
            
            // Update conversation title from first user message
            if (chat.messages.length <= 2) {
              await supabase
                .from('conversations')
                .update({ 
                  title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId);
            }
          }
        }
        setStreamingContent('');
        setIsTyping(false);
      },
      onError: (error) => {
        toast.error(error);
        setStreamingContent('');
        setIsTyping(false);
      },
    });
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
      {/* Crisis Resources Banner */}
      {showCrisisResources && (
        <div className="p-4 pb-0">
          <CrisisResourcesBanner
            isAbuse={isAbuse}
            onDismiss={() => setShowCrisisResources(false)}
          />
        </div>
      )}

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
            <div className="glass rounded-2xl rounded-tl-md px-4 py-3 max-w-[70%]">
              {streamingContent ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingContent}</p>
              ) : (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
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
              placeholder="What's on your mind? I'm here to listen..."
              className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
              rows={1}
            />
            <Button
              variant="gradient"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <p className="text-xs text-muted-foreground">
              Private & encrypted • No one can see your conversations
            </p>
          </div>
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
