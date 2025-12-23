import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Trophy, 
  Star, 
  Zap,
  Target,
  Clock,
  CheckCircle2,
  Gift,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DOMAIN_INFO, CognitiveDomain } from '@/types/cognitive';

interface DomainScore {
  domain: CognitiveDomain;
  proficiency_score: number;
  sessions_completed: number;
}

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  primary_domain: CognitiveDomain;
  secondary_domain: CognitiveDomain | null;
  icon: string;
}

interface DailyChallenge {
  id: string;
  game: Game;
  reason: string;
  bonusXP: number;
  completed: boolean;
  targetScore?: number;
}

interface DailyChallengesProps {
  games: Game[];
  domainScores: DomainScore[];
  completedGameIds: string[];
  onPlayChallenge: (game: Game, bonusXP: number) => void;
}

// Get today's date string for consistent daily challenge generation
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Deterministic shuffle based on date seed
const seededShuffle = <T,>(array: T[], seed: string): T[] => {
  const shuffled = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const j = hash % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

export function DailyChallenges({ 
  games, 
  domainScores, 
  completedGameIds,
  onPlayChallenge 
}: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    generateDailyChallenges();
  }, [games, domainScores, completedGameIds]);

  const getWeakestDomains = (): CognitiveDomain[] => {
    const allDomains: CognitiveDomain[] = ['attention', 'memory', 'speed', 'flexibility', 'problem_solving'];
    
    // Map all domains with their scores (default 500 for untrained)
    const domainWithScores = allDomains.map(domain => {
      const found = domainScores.find(d => d.domain === domain);
      return {
        domain,
        score: found?.proficiency_score || 500,
        sessions: found?.sessions_completed || 0
      };
    });

    // Sort by score (ascending) and sessions (ascending for tie-breaker)
    domainWithScores.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.sessions - b.sessions;
    });

    // Return bottom 3 weakest domains
    return domainWithScores.slice(0, 3).map(d => d.domain);
  };

  const generateDailyChallenges = () => {
    if (games.length === 0) return;

    const todayKey = getTodayKey();
    const weakestDomains = getWeakestDomains();
    const generatedChallenges: DailyChallenge[] = [];

    // Challenge 1: Focus on weakest domain (highest bonus)
    const weakestDomain = weakestDomains[0];
    const weakestDomainGames = games.filter(g => g.primary_domain === weakestDomain);
    if (weakestDomainGames.length > 0) {
      const shuffled = seededShuffle(weakestDomainGames, todayKey + '-1');
      generatedChallenges.push({
        id: 'challenge-1',
        game: shuffled[0],
        reason: `Boost your ${DOMAIN_INFO[weakestDomain]?.name || weakestDomain}`,
        bonusXP: 50,
        completed: completedGameIds.includes(shuffled[0].id),
        targetScore: 100
      });
    }

    // Challenge 2: Second weakest domain
    if (weakestDomains.length > 1) {
      const secondWeakest = weakestDomains[1];
      const secondDomainGames = games.filter(
        g => g.primary_domain === secondWeakest && !generatedChallenges.some(c => c.game.id === g.id)
      );
      if (secondDomainGames.length > 0) {
        const shuffled = seededShuffle(secondDomainGames, todayKey + '-2');
        generatedChallenges.push({
          id: 'challenge-2',
          game: shuffled[0],
          reason: `Train your ${DOMAIN_INFO[secondWeakest]?.name || secondWeakest}`,
          bonusXP: 35,
          completed: completedGameIds.includes(shuffled[0].id)
        });
      }
    }

    // Challenge 3: Random game for variety (or third weakest)
    const remainingGames = games.filter(g => !generatedChallenges.some(c => c.game.id === g.id));
    if (remainingGames.length > 0) {
      const shuffled = seededShuffle(remainingGames, todayKey + '-3');
      generatedChallenges.push({
        id: 'challenge-3',
        game: shuffled[0],
        reason: 'Daily variety challenge',
        bonusXP: 25,
        completed: completedGameIds.includes(shuffled[0].id)
      });
    }

    setChallenges(generatedChallenges);
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const allCompleted = challenges.length > 0 && completedCount === challenges.length;
  const totalBonusAvailable = challenges.reduce((sum, c) => sum + c.bonusXP, 0);
  const earnedBonus = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.bonusXP, 0);

  if (challenges.length === 0) return null;

  return (
    <Card className="glass border-primary/30 overflow-hidden">
      {/* Header with gradient */}
      <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Challenges</CardTitle>
              <CardDescription className="text-xs">
                Personalized games for your growth
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={allCompleted ? "default" : "outline"} 
            className={allCompleted ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : ""}
          >
            {completedCount}/{challenges.length} Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Daily Progress</span>
            <span className="text-primary font-medium">+{earnedBonus} / {totalBonusAvailable} XP</span>
          </div>
          <Progress 
            value={(completedCount / challenges.length) * 100} 
            className="h-2"
          />
        </div>

        {/* Challenges list */}
        <div className="space-y-3">
          <AnimatePresence>
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className={`
                    relative p-3 rounded-lg border transition-all
                    ${challenge.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-muted/30 border-border hover:border-primary/50 cursor-pointer'
                    }
                  `}
                  onClick={() => !challenge.completed && onPlayChallenge(challenge.game, challenge.bonusXP)}
                >
                  <div className="flex items-center gap-3">
                    {/* Game icon */}
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                      ${challenge.completed 
                        ? 'bg-green-500/20' 
                        : 'bg-gradient-to-br from-primary/20 to-primary/10'
                      }
                    `}>
                      {challenge.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        challenge.game.icon
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${challenge.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {challenge.game.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {DOMAIN_INFO[challenge.game.primary_domain]?.icon}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {challenge.reason}
                      </p>
                    </div>

                    {/* Bonus XP */}
                    <div className={`
                      flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${challenge.completed 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-amber-500/20 text-amber-600'
                      }
                    `}>
                      {challenge.completed ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          +{challenge.bonusXP}
                        </>
                      ) : (
                        <>
                          <Star className="h-3 w-3" />
                          +{challenge.bonusXP} XP
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority indicator for first challenge */}
                  {index === 0 && !challenge.completed && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5">
                        <Zap className="h-3 w-3 mr-0.5" />
                        Priority
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Completion bonus */}
        {allCompleted && !bonusClaimed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={() => setBonusClaimed(true)}
            >
              <Gift className="h-4 w-4 mr-2" />
              Claim All-Clear Bonus (+25 XP)
            </Button>
          </motion.div>
        )}

        {bonusClaimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-2"
          >
            <div className="inline-flex items-center gap-2 text-sm text-green-600">
              <Sparkles className="h-4 w-4" />
              All bonuses claimed! Great work today!
            </div>
          </motion.div>
        )}

        {/* Refresh hint */}
        <p className="text-[10px] text-center text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          New challenges at midnight
        </p>
      </CardContent>
    </Card>
  );
}
