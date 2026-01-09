import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Heart, Trash2, MoreVertical, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { EmotionalCheckIn } from './EmotionalCheckIn';
import { ChatSidebar } from './ChatSidebar';
import { Message } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { detectCrisis } from '@/lib/crisisDetection';
import { CrisisResourcesBanner } from '@/components/crisis/CrisisResourcesBanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const initialGreetings = [
  "Hey, I'm really glad you're here. 💙 Whatever you're going through, you don't have to face it alone. I'm here to listen — no judgment, no pressure. What's on your mind?",
  "Thank you for trusting me with this. Your feelings are completely valid, and it takes courage to reach out. Take your time — I'm here whenever you're ready to share.",
  "I'm here for you, and I'm listening. There's no rush, no right or wrong way to feel. What would help you most right now — just talking things out, or finding some ways to feel better?",
  "Hey there. I know reaching out isn't always easy, so thank you for being here. Whatever's going on, we can work through it together. What would you like to talk about?",
  "I'm so glad you came here. Your feelings matter, and so do you. Let's take this one step at a time. What's weighing on you the most right now?",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

interface DbMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      onError("Please log in to continue");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, emotionalState }),
    });

    if (!resp.ok) {
      let errorMessage = "Failed to get response";
      try {
        const errorData = await resp.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = resp.statusText || errorMessage;
      }
      
      if (resp.status === 429) {
        errorMessage = "I'm getting a lot of messages right now. Please try again in a moment.";
      } else if (resp.status === 402) {
        errorMessage = "Service temporarily unavailable. Please try again later.";
      } else if (resp.status === 401) {
        errorMessage = "Please log in to continue chatting.";
      }
      
      onError(errorMessage);
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
    let hasReceivedContent = false;

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
          if (content) {
            hasReceivedContent = true;
            onDelta(content);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            hasReceivedContent = true;
            onDelta(content);
          }
        } catch { /* ignore */ }
      }
    }

    if (!hasReceivedContent) {
      onError("No response received. Please try again.");
      return;
    }

    onDone();
  } catch (error) {
    console.error("Chat stream error:", error);
    onError(error instanceof Error ? error.message : "Connection failed. Please check your internet and try again.");
  }
}

export function ChatInterface() {
  const { currentEmotionalState } = useApp();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [isAbuse, setIsAbuse] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const loadConversation = useCallback(async (convId: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
    setConversationId(convId);
    setShowCheckIn(false);
  }, [user]);

  const saveMessageToDb = async (role: 'user' | 'assistant', content: string, convId: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    return data;
  };

  const handleCheckInComplete = async (emotion: string, supportType: string) => {
    if (!user) return;
    
    setShowCheckIn(false);

    // Create conversation in DB
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        emotional_state: emotion,
        title: `Feeling ${emotion}`,
      })
      .select()
      .single();

    if (error || !conv) {
      toast.error('Failed to start conversation');
      return;
    }

    setConversationId(conv.id);
    
    // Add greeting message
    const greeting = initialGreetings[Math.floor(Math.random() * initialGreetings.length)];
    const savedMsg = await saveMessageToDb('assistant', greeting, conv.id);
    if (savedMsg) {
      setMessages([savedMsg]);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowCheckIn(true);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || !conversationId || !user) return;
    
    const userMessage = input.trim();
    
    // Validate message length
    const MAX_MESSAGE_LENGTH = 5000;
    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
      return;
    }
    
    setInput('');

    // Check for crisis content
    const crisisResult = detectCrisis(userMessage);
    if (crisisResult.showResources) {
      setShowCrisisResources(true);
      setIsAbuse(crisisResult.isAbuse);

      // Log crisis alert
      await supabase.from('crisis_alerts').insert({
        user_id: user.id,
        source_type: 'chat',
        source_id: conversationId,
        content: userMessage,
        severity: crisisResult.severity,
        keywords_matched: crisisResult.matchedKeywords,
      });
    }
    
    // Save and display user message
    const savedUserMsg = await saveMessageToDb('user', userMessage, conversationId);
    if (savedUserMsg) {
      setMessages(prev => [...prev, savedUserMsg]);
    }

    setIsTyping(true);
    setStreamingContent('');

    // Build message history for AI
    const chatMessages: ChatMessage[] = [
      ...messages
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
          const savedAssistantMsg = await saveMessageToDb('assistant', assistantContent, conversationId);
          if (savedAssistantMsg) {
            setMessages(prev => [...prev, savedAssistantMsg]);
          }

          // Update conversation title from first user message
          if (messages.length <= 1) {
            await supabase
              .from('conversations')
              .update({ 
                title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
                updated_at: new Date().toISOString(),
              })
              .eq('id', conversationId);
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

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
  };

  const confirmDeleteMessage = (id: string) => {
    setMessageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Welcome to Aprivox</h2>
          <p className="text-muted-foreground">Please sign in to start chatting</p>
        </div>
      </div>
    );
  }

  if (showCheckIn) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmotionalCheckIn onComplete={handleCheckInComplete} />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className={cn(
          "w-72 flex-shrink-0",
          isMobile && "absolute inset-y-0 left-0 z-50 bg-background"
        )}>
          <ChatSidebar
            currentConversationId={conversationId}
            onSelectConversation={loadConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Aprivox</h3>
              <p className="text-xs text-muted-foreground">Always here for you</p>
            </div>
          </div>
        </div>

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
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              index={index}
              onDelete={() => confirmDeleteMessage(message.id)}
            />
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
                Private & encrypted • Available 24/7
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (messageToDelete) {
                  deleteMessage(messageToDelete);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MessageBubble({ message, index, onDelete }: { message: DbMessage; index: number; onDelete: () => void }) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={cn(
        "group flex items-start gap-3 animate-slide-up",
        isUser && "flex-row-reverse"
      )}
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
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
          "relative max-w-[70%] rounded-2xl px-4 py-3",
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
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        
        {/* Delete button on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "absolute -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                isUser ? "-left-8" : "-right-8"
              )}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isUser ? "start" : "end"}>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
