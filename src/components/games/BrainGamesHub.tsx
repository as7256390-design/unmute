import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  Target, 
  Puzzle, 
  RotateCcw,
  Play,
  Trophy,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { DOMAIN_INFO, CognitiveDomain } from '@/types/cognitive';
import { PatternMatchGame } from './PatternMatchGame';
import { MemoryGridGame } from './MemoryGridGame';

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  primary_domain: CognitiveDomain;
  secondary_domain: CognitiveDomain | null;
  icon: string;
  min_duration_seconds: number;
  max_duration_seconds: number;
}

interface CognitiveProfile {
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  total_practice_time_seconds: number;
}

interface DomainScore {
  domain: CognitiveDomain;
  proficiency_score: number;
  sessions_completed: number;
}

// Built-in games that are always available
const BUILT_IN_GAMES: Game[] = [
  {
    id: 'pattern-match',
    name: 'Pattern Match',
    slug: 'pattern-match',
    description: 'Find matching patterns based on shape and color. Test your visual attention and pattern recognition!',
    instructions: 'Look at the target pattern and find the card that matches its shape and color. Size and rotation may vary - focus on the core pattern!',
    primary_domain: 'attention',
    secondary_domain: 'speed',
    icon: '🎯',
    min_duration_seconds: 60,
    max_duration_seconds: 120,
  },
  {
    id: 'memory-grid',
    name: 'Memory Grid',
    slug: 'memory-grid',
    description: 'Classic memory matching game. Remember card positions and match pairs to clear levels!',
    instructions: 'Flip cards to reveal emojis. Remember their positions and match pairs. Clear all pairs to advance to harder levels!',
    primary_domain: 'memory',
    secondary_domain: 'attention',
    icon: '🧠',
    min_duration_seconds: 90,
    max_duration_seconds: 180,
  },
];

export function BrainGamesHub() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>(BUILT_IN_GAMES);
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gamePhase, setGamePhase] = useState<'browse' | 'instructions' | 'playing' | 'results'>('browse');
  const [gameScore, setGameScore] = useState(0);
  const [gameAccuracy, setGameAccuracy] = useState(0);
  const [gameDuration, setGameDuration] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load games from DB and merge with built-in games
    const { data: gamesData } = await supabase
      .from('cognitive_games')
      .select('*')
      .eq('is_active', true);

    if (gamesData && gamesData.length > 0) {
      // Merge DB games with built-in games, avoiding duplicates by slug
      const dbSlugs = new Set(gamesData.map((g: any) => g.slug));
      const filteredBuiltIn = BUILT_IN_GAMES.filter(g => !dbSlugs.has(g.slug));
      setGames([...filteredBuiltIn, ...(gamesData as Game[])]);
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('cognitive_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Load domain scores
    const { data: domainsData } = await supabase
      .from('cognitive_domains')
      .select('domain, proficiency_score, sessions_completed')
      .eq('user_id', user.id);

    if (domainsData) {
      setDomainScores(domainsData as DomainScore[]);
    }

    setLoading(false);
  };

  const startGame = (game: Game) => {
    setSelectedGame(game);
    setGamePhase('instructions');
  };

  const beginPlaying = () => {
    setGamePhase('playing');
  };

  const handleGameComplete = (score: number, accuracy: number, duration: number) => {
    setGameScore(score);
    setGameAccuracy(accuracy);
    setGameDuration(duration);
    setGamePhase('results');
    saveSession(score, accuracy, duration);
  };

  const saveSession = async (score: number, accuracy: number, duration: number) => {
    if (!user || !selectedGame) return;

    // Try to save to DB (may fail for built-in games without DB entry)
    try {
      await supabase.from('cognitive_sessions').insert({
        user_id: user.id,
        game_id: selectedGame.id,
        score,
        accuracy,
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        starting_difficulty: 1.0,
        ending_difficulty: 1.5,
        correct_responses: Math.floor((accuracy / 100) * 20),
        incorrect_responses: 20 - Math.floor((accuracy / 100) * 20),
      });
    } catch (error) {
      // Built-in games may not have a valid game_id in DB, that's ok
      console.log('Session save skipped for built-in game');
    }

    toast.success(`Great job! You scored ${score} points!`);
  };

  const backToBrowse = () => {
    setSelectedGame(null);
    setGamePhase('browse');
    setGameScore(0);
    setGameAccuracy(0);
    setGameDuration(0);
    loadData();
  };

  const getDomainScore = (domain: CognitiveDomain): number => {
    const found = domainScores.find(d => d.domain === domain);
    return found?.proficiency_score || 500;
  };

  const getOverallScore = (): number => {
    if (domainScores.length === 0) return 500;
    const sum = domainScores.reduce((acc, d) => acc + d.proficiency_score, 0);
    return Math.round(sum / domainScores.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Instructions phase
  if (gamePhase === 'instructions' && selectedGame) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass overflow-hidden">
            <div className="h-32 gradient-hero flex items-center justify-center">
              <span className="text-6xl">{selectedGame.icon}</span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{selectedGame.name}</CardTitle>
              <CardDescription>{selectedGame.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  How to Play
                </h3>
                <p className="text-muted-foreground">{selectedGame.instructions}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.round(selectedGame.min_duration_seconds / 60)}-{Math.round(selectedGame.max_duration_seconds / 60)} min
                </div>
                <Badge variant="outline">
                  {DOMAIN_INFO[selectedGame.primary_domain]?.icon} {DOMAIN_INFO[selectedGame.primary_domain]?.name}
                </Badge>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={backToBrowse}>
                  Back
                </Button>
                <Button variant="gradient" className="flex-1" onClick={beginPlaying}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Playing phase - render actual game components
  if (gamePhase === 'playing' && selectedGame) {
    if (selectedGame.slug === 'pattern-match') {
      return (
        <PatternMatchGame
          onComplete={handleGameComplete}
          onQuit={backToBrowse}
        />
      );
    }
    
    if (selectedGame.slug === 'memory-grid') {
      return (
        <MemoryGridGame
          onComplete={handleGameComplete}
          onQuit={backToBrowse}
        />
      );
    }

    // Fallback for other games (simulated)
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto animate-pulse">
            <span className="text-5xl">{selectedGame.icon}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{selectedGame.name}</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
          <Button variant="outline" onClick={backToBrowse}>
            Back to Games
          </Button>
        </motion.div>
      </div>
    );
  }

  // Results phase
  if (gamePhase === 'results' && selectedGame) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-white" />
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Great Work!</CardTitle>
              <CardDescription>You completed {selectedGame.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">{gameScore}</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">{gameAccuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{DOMAIN_INFO[selectedGame.primary_domain]?.name} Progress</span>
                  <span className="text-primary">+15 points</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={backToBrowse}>
                  Back to Games
                </Button>
                <Button variant="gradient" className="flex-1" onClick={beginPlaying}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Browse phase (main view)
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Brain Games
          </h1>
          <p className="text-muted-foreground">Train your mind with fun cognitive exercises</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Score: {getOverallScore()}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.current_streak || 0}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.total_sessions || 0}</div>
                <div className="text-xs text-muted-foreground">Games Played</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round((profile?.total_practice_time_seconds || 0) / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">Practice Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{profile?.longest_streak || 0}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList>
          <TabsTrigger value="games">
            <Puzzle className="h-4 w-4 mr-1" />
            Games
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-1" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="glass cursor-pointer hover:border-primary/50 transition-all group overflow-hidden"
                    onClick={() => startGame(game)}
                  >
                    <div className="h-20 gradient-hero flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-4xl">{game.icon}</span>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {game.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {game.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {DOMAIN_INFO[game.primary_domain]?.icon} {DOMAIN_INFO[game.primary_domain]?.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(game.min_duration_seconds / 60)}-{Math.round(game.max_duration_seconds / 60)} min
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {games.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No games available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Cognitive Domains</CardTitle>
              <CardDescription>Track your progress across different mental skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(DOMAIN_INFO) as CognitiveDomain[]).map((domain) => {
                const info = DOMAIN_INFO[domain];
                const score = getDomainScore(domain);
                const progress = Math.min(100, (score / 1000) * 100);
                
                return (
                  <div key={domain} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="font-medium">{info.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{score}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}