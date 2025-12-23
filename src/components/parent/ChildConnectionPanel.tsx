import { useState, useEffect } from 'react';
import { Link2, Copy, Check, Heart, AlertTriangle, TrendingUp, TrendingDown, Minus, Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChildConnection {
  id: string;
  child_user_id: string;
  connection_code: string;
  status: string;
  connected_at: string | null;
  child_profile?: {
    display_name: string | null;
  };
  latest_mood?: {
    mood_score: number;
    stress_level: string | null;
    notes: string | null;
    logged_at: string;
  };
  mood_trend?: 'improving' | 'declining' | 'stable';
  sharing_enabled?: boolean;
}

interface ParentingTip {
  mood: string;
  tips: string[];
  doNot: string[];
  phrases: string[];
}

const parentingGuidance: Record<string, ParentingTip> = {
  'very_low': {
    mood: 'Struggling',
    tips: [
      'Be present without trying to fix anything',
      'Create a calm, judgment-free space',
      'Validate their feelings before offering solutions',
      'Consider professional support if this persists'
    ],
    doNot: [
      'Don\'t say "it could be worse"',
      'Don\'t compare to others',
      'Don\'t minimize their feelings',
      'Don\'t push them to talk before they\'re ready'
    ],
    phrases: [
      '"I\'m here for you, no matter what."',
      '"It\'s okay to feel this way."',
      '"Take your time, I\'m not going anywhere."'
    ]
  },
  'low': {
    mood: 'Down',
    tips: [
      'Spend quality time doing something they enjoy',
      'Ask open-ended questions gently',
      'Offer comfort without being pushy',
      'Be patient with mood swings'
    ],
    doNot: [
      'Don\'t lecture about positivity',
      'Don\'t ask too many questions at once',
      'Don\'t take their withdrawal personally'
    ],
    phrases: [
      '"Want to do something together?"',
      '"I noticed you seem quiet. Everything okay?"',
      '"I love you, even on hard days."'
    ]
  },
  'neutral': {
    mood: 'Balanced',
    tips: [
      'Maintain regular check-ins',
      'Celebrate small wins together',
      'Build on this stability with connection time',
      'Ask about their interests and goals'
    ],
    doNot: [
      'Don\'t assume everything is fine',
      'Don\'t skip quality time',
      'Don\'t only talk when there\'s a problem'
    ],
    phrases: [
      '"How was your day, really?"',
      '"What\'s something you\'re looking forward to?"',
      '"I\'m proud of how you\'re handling things."'
    ]
  },
  'high': {
    mood: 'Good',
    tips: [
      'Share in their positive energy',
      'Ask what\'s contributing to their good mood',
      'Use this time to deepen your connection',
      'Plan something fun together'
    ],
    doNot: [
      'Don\'t bring up problems or past issues now',
      'Don\'t dampen their enthusiasm',
      'Don\'t be suspicious of their happiness'
    ],
    phrases: [
      '"It\'s so nice to see you happy!"',
      '"What made today great?"',
      '"Let\'s do something fun this weekend!"'
    ]
  },
  'very_high': {
    mood: 'Thriving',
    tips: [
      'Celebrate their wins genuinely',
      'Ask them to share what\'s working',
      'Support their momentum',
      'Express pride without conditions'
    ],
    doNot: [
      'Don\'t add pressure or expectations',
      'Don\'t immediately bring up chores/studies',
      'Don\'t attribute it only to external factors'
    ],
    phrases: [
      '"You\'re doing amazing!"',
      '"I love seeing you so energized!"',
      '"What can I do to support you?"'
    ]
  }
};

const getMoodCategory = (score: number): string => {
  if (score <= 2) return 'very_low';
  if (score <= 4) return 'low';
  if (score <= 6) return 'neutral';
  if (score <= 8) return 'high';
  return 'very_high';
};

const getMoodColor = (score: number): string => {
  if (score <= 2) return 'text-destructive';
  if (score <= 4) return 'text-warning';
  if (score <= 6) return 'text-muted-foreground';
  if (score <= 8) return 'text-hope';
  return 'text-safe';
};

const getMoodEmoji = (score: number): string => {
  if (score <= 2) return '😢';
  if (score <= 4) return '😔';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
};

export function ChildConnectionPanel() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ChildConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ChildConnection | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data: connectionsData, error } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('parent_user_id', user.id);

      if (error) throw error;

      // Fetch child profiles and mood data for connected children
      const enrichedConnections = await Promise.all(
        (connectionsData || []).map(async (conn) => {
          let childProfile = null;
          let latestMood = null;
          let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
          let sharingEnabled = false;

          if (conn.status === 'connected') {
            // Fetch child profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', conn.child_user_id)
              .single();
            
            childProfile = profile;

            // Check sharing preferences
            const { data: sharing } = await supabase
              .from('child_mood_sharing')
              .select('share_mood, share_mood_history')
              .eq('connection_id', conn.id)
              .single();

            sharingEnabled = sharing?.share_mood || false;

            if (sharingEnabled) {
              // Fetch latest mood
              const { data: moods } = await supabase
                .from('mood_logs')
                .select('mood_score, stress_level, notes, logged_at')
                .eq('user_id', conn.child_user_id)
                .order('logged_at', { ascending: false })
                .limit(7);

              if (moods && moods.length > 0) {
                latestMood = moods[0];

                // Calculate trend
                if (moods.length >= 3) {
                  const recentAvg = moods.slice(0, 3).reduce((sum, m) => sum + m.mood_score, 0) / 3;
                  const olderAvg = moods.slice(-3).reduce((sum, m) => sum + m.mood_score, 0) / Math.min(3, moods.length);
                  if (recentAvg > olderAvg + 0.5) moodTrend = 'improving';
                  else if (recentAvg < olderAvg - 0.5) moodTrend = 'declining';
                }
              }
            }
          }

          return {
            ...conn,
            child_profile: childProfile,
            latest_mood: latestMood,
            mood_trend: moodTrend,
            sharing_enabled: sharingEnabled
          };
        })
      );

      setConnections(enrichedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateConnectionCode = () => {
    const code = `PC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setGeneratedCode(code);
    return code;
  };

  const createConnection = async () => {
    if (!user) {
      toast.error('Please sign in to connect with your child');
      return;
    }

    const code = generateConnectionCode();
    
    try {
      // Create a placeholder connection with just the code
      const { error } = await supabase
        .from('parent_child_connections')
        .insert({
          parent_user_id: user.id,
          child_user_id: user.id, // Placeholder, will be updated when child accepts
          connection_code: code,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Connection code generated!', {
        description: 'Share this code with your child'
      });

      fetchConnections();
    } catch (error: any) {
      console.error('Error creating connection:', error);
      toast.error('Failed to create connection');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display font-semibold mb-2">Connect with Your Child</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to connect your account with your child's and see how they're feeling.
        </p>
        <Button variant="gradient">Sign In to Connect</Button>
      </div>
    );
  }

  const connectedChildren = connections.filter(c => c.status === 'connected');
  const pendingConnections = connections.filter(c => c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Child Connection</h2>
              <p className="text-sm text-muted-foreground">
                See how your child is feeling and get guidance
              </p>
            </div>
          </div>
          <Button onClick={createConnection} variant="gradient" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Child
          </Button>
        </div>

        {pendingConnections.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium mb-2">Pending Connections</p>
            {pendingConnections.map(conn => (
              <div key={conn.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Pending</Badge>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {conn.connection_code}
                  </code>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyCode(conn.connection_code)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              Share this code with your child. They can enter it in their app to connect.
            </p>
          </div>
        )}

        {connectedChildren.length === 0 && pendingConnections.length === 0 && (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No connected children yet. Click "Add Child" to generate a connection code.
            </p>
          </div>
        )}
      </div>

      {/* Connected Children */}
      <AnimatePresence>
        {connectedChildren.map((connection) => {
          const moodScore = connection.latest_mood?.mood_score || 5;
          const moodCategory = getMoodCategory(moodScore);
          const guidance = parentingGuidance[moodCategory];
          const childName = connection.child_profile?.display_name || 'Your Child';

          return (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Child Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedConnection(
                  selectedConnection?.id === connection.id ? null : connection
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-support/20 flex items-center justify-center text-2xl">
                      {getMoodEmoji(moodScore)}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg">{childName}</h3>
                      {connection.sharing_enabled && connection.latest_mood ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className={cn("font-medium", getMoodColor(moodScore))}>
                            Feeling: {guidance.mood}
                          </span>
                          {connection.mood_trend === 'improving' && (
                            <Badge variant="secondary" className="bg-safe/20 text-safe">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Improving
                            </Badge>
                          )}
                          {connection.mood_trend === 'declining' && (
                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Needs Attention
                            </Badge>
                          )}
                          {connection.mood_trend === 'stable' && (
                            <Badge variant="secondary" className="bg-muted">
                              <Minus className="h-3 w-3 mr-1" />
                              Stable
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <EyeOff className="h-4 w-4" />
                          Mood sharing not enabled
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {connection.sharing_enabled && connection.latest_mood && (
                    <div className="text-right">
                      <div className="text-3xl font-bold">{moodScore}/10</div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(connection.latest_mood.logged_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mood Progress Bar */}
                {connection.sharing_enabled && connection.latest_mood && (
                  <div className="mt-4">
                    <Progress 
                      value={moodScore * 10} 
                      className={cn(
                        "h-2",
                        moodScore <= 3 ? "[&>div]:bg-destructive" :
                        moodScore <= 5 ? "[&>div]:bg-warning" :
                        moodScore <= 7 ? "[&>div]:bg-hope" :
                        "[&>div]:bg-safe"
                      )} 
                    />
                  </div>
                )}
              </div>

              {/* Expanded Guidance Section */}
              <AnimatePresence>
                {selectedConnection?.id === connection.id && connection.sharing_enabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-5 space-y-6">
                      {/* Stress Level */}
                      {connection.latest_mood?.stress_level && (
                        <div className="bg-muted/50 rounded-xl p-4">
                          <p className="text-sm text-muted-foreground mb-1">Stress Level</p>
                          <Badge variant="secondary" className={cn(
                            connection.latest_mood.stress_level === 'high' ? "bg-destructive/20 text-destructive" :
                            connection.latest_mood.stress_level === 'medium' ? "bg-warning/20 text-warning" :
                            "bg-safe/20 text-safe"
                          )}>
                            {connection.latest_mood.stress_level.charAt(0).toUpperCase() + 
                             connection.latest_mood.stress_level.slice(1)}
                          </Badge>
                        </div>
                      )}

                      {/* What to Do */}
                      <div>
                        <h4 className="font-display font-semibold text-safe mb-3 flex items-center gap-2">
                          ✓ What You Can Do
                        </h4>
                        <ul className="space-y-2">
                          {guidance.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-safe mt-0.5">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* What NOT to Do */}
                      <div>
                        <h4 className="font-display font-semibold text-destructive mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Avoid Saying/Doing
                        </h4>
                        <ul className="space-y-2">
                          {guidance.doNot.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-destructive mt-0.5">×</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Helpful Phrases */}
                      <div className="bg-support/10 rounded-xl p-4">
                        <h4 className="font-display font-semibold mb-3 flex items-center gap-2">
                          💬 Try Saying
                        </h4>
                        <div className="space-y-2">
                          {guidance.phrases.map((phrase, i) => (
                            <p key={i} className="text-sm italic text-foreground">
                              {phrase}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Child's Notes (if shared) */}
                      {connection.latest_mood?.notes && (
                        <div className="bg-muted/50 rounded-xl p-4">
                          <h4 className="font-display font-semibold mb-2">Their Recent Note</h4>
                          <p className="text-sm text-muted-foreground italic">
                            "{connection.latest_mood.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Info Box */}
      <div className="glass rounded-xl p-4 bg-gradient-to-br from-primary/5 to-support/5">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Privacy First</p>
            <p className="text-xs text-muted-foreground">
              Your child controls what they share. They can choose to share their mood, 
              or keep it private. This builds trust while giving you insight into their wellbeing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}