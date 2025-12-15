import { useState } from 'react';
import { Heart, MessageCircle, HandHeart, Send, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const mockPosts = [
  {
    id: '1',
    content: "Some days I feel like I'm drowning in expectations. Everyone expects me to be perfect, but I'm falling apart inside. I don't know how much longer I can pretend.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    reactions: { notAlone: 24, wantToChat: 8, meeToo: 15 },
  },
  {
    id: '2',
    content: "Failed my exam today. My parents will be so disappointed. I studied so hard but nothing seems to work.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: { notAlone: 42, wantToChat: 12, meeToo: 31 },
  },
  {
    id: '3',
    content: "I wish someone understood that it's not about being lazy. It's about feeling so exhausted that even getting out of bed feels impossible.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    reactions: { notAlone: 67, wantToChat: 15, meeToo: 48 },
  },
  {
    id: '4',
    content: "Today was a little better than yesterday. Small wins. Went for a walk and actually enjoyed it.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    reactions: { notAlone: 89, wantToChat: 3, meeToo: 22 },
  },
  {
    id: '5',
    content: "My friends don't know I'm struggling. I smile and laugh with them, but inside I'm screaming for help. Why is it so hard to just... say it?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    reactions: { notAlone: 56, wantToChat: 21, meeToo: 44 },
  },
];

export function SupportWall() {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState(mockPosts);

  const handleSubmit = () => {
    if (!newPost.trim()) return;
    
    const post = {
      id: crypto.randomUUID(),
      content: newPost.trim(),
      timestamp: new Date(),
      reactions: { notAlone: 0, wantToChat: 0, meeToo: 0 },
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleReaction = (postId: string, type: 'notAlone' | 'wantToChat' | 'meeToo') => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [type]: post.reactions[type] + 1,
          },
        };
      }
      return post;
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-hope mb-4">
          <Heart className="h-7 w-7 text-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Support Wall</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Share your thoughts anonymously. React to let others know they're not alone.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="h-5 w-5 text-safe flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">100% Anonymous</p>
          <p className="text-xs text-muted-foreground">
            Your posts can never be traced back to you. Express yourself freely.
          </p>
        </div>
      </div>

      {/* New Post */}
      <div className="glass rounded-2xl p-4 mb-8">
        <Textarea
          placeholder="What's on your mind? Share your thoughts, feelings, or just vent..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={3}
          className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 mb-3"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI monitors for safety - severe posts get private outreach
          </p>
          <Button 
            variant="gradient" 
            size="sm" 
            onClick={handleSubmit}
            disabled={!newPost.trim()}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className="glass rounded-2xl p-5 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="text-foreground leading-relaxed mb-4">{post.content}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.timestamp, { addSuffix: true })}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(post.id, 'notAlone')}
                  className="gap-1.5 text-xs h-8"
                >
                  <HandHeart className="h-3.5 w-3.5" />
                  <span>{post.reactions.notAlone}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(post.id, 'meeToo')}
                  className="gap-1.5 text-xs h-8"
                >
                  <Heart className="h-3.5 w-3.5" />
                  <span>{post.reactions.meeToo}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(post.id, 'wantToChat')}
                  className="gap-1.5 text-xs h-8"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{post.reactions.wantToChat}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
