import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Moon, 
  Wind, 
  Music, 
  BookOpen,
  Play,
  Pause,
  Volume2,
  Clock,
  Star,
  Heart,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RelaxationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number | null;
  audio_url: string | null;
  content_text: string | null;
  thumbnail_url: string | null;
  is_premium: boolean | null;
  play_count: number | null;
}

const categoryIcons: Record<string, any> = {
  sleep: Moon,
  breathing: Wind,
  music: Music,
  stories: BookOpen,
  meditation: Sparkles,
};

const categoryColors: Record<string, string> = {
  sleep: 'from-indigo-500/20 to-purple-500/20',
  breathing: 'from-cyan-500/20 to-blue-500/20',
  music: 'from-pink-500/20 to-rose-500/20',
  stories: 'from-amber-500/20 to-orange-500/20',
  meditation: 'from-violet-500/20 to-fuchsia-500/20',
};

export function RelaxationContent() {
  const { user } = useAuth();
  const [content, setContent] = useState<RelaxationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [playing, setPlaying] = useState<RelaxationItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchContent();
    if (user) {
      fetchUserHistory();
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('relaxation_content')
        .select('*')
        .order('play_count', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async () => {
    const { data } = await supabase
      .from('user_content_history')
      .select('content_id')
      .eq('user_id', user!.id)
      .eq('completed', true);
    
    // Use completed items as "favorites" for now
    setFavorites(data?.map(d => d.content_id) || []);
  };

  const playContent = async (item: RelaxationItem) => {
    setPlaying(item);
    setIsPlaying(true);

    // Record play in history
    if (user) {
      await supabase.from('user_content_history').insert({
        user_id: user.id,
        content_id: item.id
      });

      // Increment play count
      await supabase
        .from('relaxation_content')
        .update({ play_count: (item.play_count || 0) + 1 })
        .eq('id', item.id);
    }

    toast.success(`Now playing: ${item.title}`);
  };

  const toggleFavorite = async (contentId: string) => {
    if (favorites.includes(contentId)) {
      setFavorites(favorites.filter(id => id !== contentId));
    } else {
      setFavorites([...favorites, contentId]);
      if (user) {
        await supabase.from('user_content_history').upsert({
          user_id: user.id,
          content_id: contentId,
          completed: true
        });
      }
    }
  };

  const categories = ['all', ...new Set(content.map(c => c.category))];
  const filteredContent = activeCategory === 'all' 
    ? content 
    : content.filter(c => c.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mb-4">
              <Moon className="h-8 w-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-display font-bold">Sleep & Relaxation</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Calm your mind with guided meditations, sleep stories, and relaxing sounds.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: content.length, icon: Music },
              { label: 'Categories', value: categories.length - 1, icon: Sparkles },
              { label: 'Your Favorites', value: favorites.length, icon: Heart },
              { label: 'Minutes of Content', value: content.reduce((acc, c) => acc + (c.duration_minutes || 0), 0), icon: Clock },
            ].map((stat, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-4">
                  <stat.icon className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
              {categories.map(cat => {
                const Icon = categoryIcons[cat] || Sparkles;
                return (
                  <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {cat === 'all' ? 'All Content' : cat}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredContent.map((item, index) => {
                const Icon = categoryIcons[item.category] || Sparkles;
                const isFavorite = favorites.includes(item.id);
                const colorClass = categoryColors[item.category] || 'from-gray-500/20 to-slate-500/20';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
                        playing?.id === item.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => playContent(item)}
                    >
                      <div className={`h-32 bg-gradient-to-br ${colorClass} flex items-center justify-center relative`}>
                        <Icon className="h-12 w-12 text-foreground/30" />
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                            <Play className="h-6 w-6 text-primary-foreground ml-1" />
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {item.is_premium && (
                            <Badge className="bg-amber-500">Premium</Badge>
                          )}
                        </div>

                        {/* Favorite button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 left-2 h-8 w-8 bg-black/20 hover:bg-black/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </Button>
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="capitalize">{item.category}</Badge>
                          {item.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.duration_minutes}m
                            </span>
                          )}
                          {item.play_count && item.play_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {item.play_count}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredContent.length === 0 && (
            <Card className="p-12 text-center">
              <Moon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Content Available</h3>
              <p className="text-muted-foreground">Check back later for new relaxation content.</p>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Now Playing Bar */}
      <AnimatePresence>
        {playing && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="border-t bg-card p-4"
          >
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryColors[playing.category]} flex items-center justify-center`}>
                {(() => {
                  const Icon = categoryIcons[playing.category] || Sparkles;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{playing.title}</h4>
                <p className="text-sm text-muted-foreground capitalize">{playing.category}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 w-32">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlaying(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
