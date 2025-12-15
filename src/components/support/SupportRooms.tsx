import { useState } from 'react';
import { Users, MessageCircle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const supportRooms = [
  { 
    id: '1', 
    name: 'Exam Panic Zone', 
    emoji: '📚', 
    description: 'Feeling overwhelmed by exams? Join others who understand.',
    memberCount: 24, 
    isActive: true,
    category: 'academic'
  },
  { 
    id: '2', 
    name: 'Social Anxiety Circle', 
    emoji: '🫂', 
    description: 'A safe space for those who find social situations challenging.',
    memberCount: 18, 
    isActive: true,
    category: 'anxiety'
  },
  { 
    id: '3', 
    name: 'Let\'s Just Talk', 
    emoji: '💬', 
    description: 'No specific topic. Just chat about life, feelings, anything.',
    memberCount: 32, 
    isActive: true,
    category: 'general'
  },
  { 
    id: '4', 
    name: 'Relationship Pain', 
    emoji: '💔', 
    description: 'Heartbreak, family issues, friendship struggles - all welcome.',
    memberCount: 15, 
    isActive: true,
    category: 'relationships'
  },
  { 
    id: '5', 
    name: 'LGBTQ+ Safe Space', 
    emoji: '🏳️‍🌈', 
    description: 'A supportive community for LGBTQ+ students.',
    memberCount: 12, 
    isActive: true,
    category: 'identity'
  },
  { 
    id: '6', 
    name: 'Career Confusion', 
    emoji: '🎯', 
    description: 'Not sure about your future? Let\'s figure it out together.',
    memberCount: 21, 
    isActive: true,
    category: 'career'
  },
  { 
    id: '7', 
    name: 'Living Away from Home', 
    emoji: '🏠', 
    description: 'For students dealing with homesickness and independence.',
    memberCount: 27, 
    isActive: true,
    category: 'lifestyle'
  },
  { 
    id: '8', 
    name: 'Late Night Thoughts', 
    emoji: '🌙', 
    description: 'Can\'t sleep? Overthinking? You\'re not alone tonight.',
    memberCount: 19, 
    isActive: true,
    category: 'general'
  },
  { 
    id: '9', 
    name: 'Parent Pressure', 
    emoji: '👨‍👩‍👧', 
    description: 'Dealing with expectations and family dynamics.',
    memberCount: 28, 
    isActive: true,
    category: 'family'
  },
];

const categories = [
  { id: 'all', label: 'All Rooms' },
  { id: 'academic', label: 'Academic' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'family', label: 'Family' },
  { id: 'general', label: 'General' },
];

export function SupportRooms() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = supportRooms.filter(room => {
    const matchesCategory = selectedCategory === 'all' || room.category === selectedCategory;
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            {categories.map(cat => (
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
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{room.emoji}</span>
              {room.isActive && (
                <Badge variant="secondary" className="bg-safe/20 text-safe">
                  <span className="w-2 h-2 bg-safe rounded-full mr-1.5 animate-pulse" />
                  Active
                </Badge>
              )}
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
                <span>{room.memberCount} online</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary">
                Join
                <ArrowRight className="h-3 w-3" />
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
