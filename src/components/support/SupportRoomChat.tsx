import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectCrisis } from '@/lib/crisisDetection';
import { CrisisResourcesBanner } from '@/components/crisis/CrisisResourcesBanner';
import { cn } from '@/lib/utils';

interface SupportRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
}

interface RoomMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
  };
}

interface SupportRoomChatProps {
  room: SupportRoom;
  onBack: () => void;
}

export function SupportRoomChat({ room, onBack }: SupportRoomChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [isAbuse, setIsAbuse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('room_messages')
        .select('id, content, created_at, user_id')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };

    const fetchMemberCount = async () => {
      const { count } = await supabase
        .from('room_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);
      
      setMemberCount(count || 0);
    };

    fetchMessages();
    fetchMemberCount();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMessage = payload.new as RoomMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, user]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // Check for crisis content
    const crisisResult = detectCrisis(content);
    if (crisisResult.showResources) {
      setShowCrisisResources(true);
      setIsAbuse(crisisResult.isAbuse);
      
      // Log crisis alert
      await supabase.from('crisis_alerts').insert({
        user_id: user.id,
        source_type: 'room',
        source_id: room.id,
        content,
        severity: crisisResult.severity,
        keywords_matched: crisisResult.matchedKeywords,
      });
    }

    const { error } = await supabase.from('room_messages').insert({
      room_id: room.id,
      user_id: user.id,
      content,
      is_flagged: crisisResult.isCrisis,
      flag_reason: crisisResult.isCrisis ? crisisResult.matchedKeywords.join(', ') : null,
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setInput(content);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{room.emoji}</span>
            <h2 className="font-display font-semibold text-lg">{room.name}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{room.description}</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {memberCount} members
        </Badge>
      </div>

      {/* Crisis resources banner */}
      {showCrisisResources && (
        <div className="p-4 pb-0">
          <CrisisResourcesBanner
            isAbuse={isAbuse}
            onDismiss={() => setShowCrisisResources(false)}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user_id === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  isOwn ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5',
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'glass rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    )}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
        <div className="relative glass rounded-xl p-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts... This is a safe space."
            className="min-h-[60px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 pr-12"
            rows={1}
          />
          <Button
            variant="gradient"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="absolute right-2 bottom-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Be kind and supportive. All messages are monitored for safety.
        </p>
      </div>
    </div>
  );
}
