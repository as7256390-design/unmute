import { useState, useEffect } from 'react';
import { Users, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SupportRoomChat } from './SupportRoomChat';

interface SupportRoom {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  is_active: boolean;
}

const categories = [
  { id: 'all', label: 'All Rooms' },
  { id: 'academic', label: 'Academic' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'family', label: 'Family' },
  { id: 'general', label: 'General' },
];

export function SupportRooms() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rooms, setRooms] = useState<SupportRoom[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState<SupportRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    if (user) fetchMemberships();
  }, [user]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('support_rooms')
      .select('*')
      .order('name');

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching rooms:', error);
      }
      toast.error('Failed to load rooms');
    } else {
      setRooms(data || []);
      // Fetch member counts for each room
      const counts: Record<string, number> = {};
      for (const room of data || []) {
        const { count } = await supabase
          .from('room_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);
        counts[room.id] = count || 0;
      }
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  const fetchMemberships = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('room_memberships')
      .select('room_id')
      .eq('user_id', user.id);

    setJoinedRooms(new Set(data?.map((m) => m.room_id) || []));
  };

  const handleJoinRoom = async (room: SupportRoom) => {
    if (!user) {
      toast.error('Please sign in to join rooms');
      return;
    }

    setJoiningRoom(room.id);

    if (joinedRooms.has(room.id)) {
      // Already joined, open chat
      setSelectedRoom(room);
      setJoiningRoom(null);
      return;
    }

    const { error } = await supabase.from('room_memberships').insert({
      room_id: room.id,
      user_id: user.id,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Error joining room:', error);
      }
      toast.error('Failed to join room');
    } else {
      setJoinedRooms((prev) => new Set([...prev, room.id]));
      setMemberCounts((prev) => ({
        ...prev,
        [room.id]: (prev[room.id] || 0) + 1,
      }));
      toast.success(`Joined ${room.name}`);
      setSelectedRoom(room);
    }

    setJoiningRoom(null);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (selectedRoom) {
    return (
      <SupportRoomChat
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-calm mb-4">
          <Users className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Support Rooms</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Join themed rooms to connect with others who understand your struggles. 
          You can participate silently or share openly.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room, index) => (
          <div
            key={room.id}
            className="glass rounded-2xl p-5 hover:shadow-medium transition-all hover:scale-[1.02] cursor-pointer group animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleJoinRoom(room)}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{room.emoji}</span>
              <div className="flex items-center gap-2">
                {joinedRooms.has(room.id) && (
                  <Badge variant="outline" className="text-primary border-primary">
                    Joined
                  </Badge>
                )}
                {room.is_active && (
                  <Badge variant="secondary" className="bg-safe/20 text-safe">
                    <span className="w-2 h-2 bg-safe rounded-full mr-1.5 animate-pulse" />
                    Active
                  </Badge>
                )}
              </div>
            </div>

            <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              {room.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {room.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{memberCounts[room.id] || 0} members</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 group-hover:text-primary"
                disabled={joiningRoom === room.id}
              >
                {joiningRoom === room.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {joinedRooms.has(room.id) ? 'Open' : 'Join'}
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Moderation Note */}
      <div className="mt-8 glass rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">AI & Peer Moderated</p>
          <p className="text-xs text-muted-foreground">
            All rooms are monitored by AI and trained peer moderators to ensure a safe, 
            supportive environment. Any concerning content is flagged for private outreach.
          </p>
        </div>
      </div>
    </div>
  );
}
