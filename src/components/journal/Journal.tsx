import { useState, useEffect } from 'react';
import { BookHeart, Send, Mic, Calendar, Sparkles, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { EmotionalState } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const moodOptions: { id: EmotionalState; emoji: string; label: string }[] = [
  { id: 'anxious', emoji: '😟', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'overwhelmed', emoji: '😫', label: 'Overwhelmed' },
  { id: 'numb', emoji: '😶', label: 'Numb' },
  { id: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { id: 'neutral', emoji: '😌', label: 'Okay' },
];

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  created_at: string;
  wants_response: boolean;
  has_response: boolean;
  response_text?: string | null;
}

export function Journal() {
  const { user } = useAuth();
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<EmotionalState | null>(null);
  const [wantsResponse, setWantsResponse] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading journal entries:', error);
      toast.error('Failed to load journal entries');
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newEntry.trim() || !selectedMood || !user) return;

    setSubmitting(true);
    
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        content: newEntry.trim(),
        mood: selectedMood,
        wants_response: wantsResponse,
        has_response: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save entry');
    } else {
      setEntries([data, ...entries]);
      setNewEntry('');
      setSelectedMood(null);
      setWantsResponse(false);
      toast.success('Entry saved! Keep writing 💙');
      
      // Update gamification
      const { data: stats } = await supabase
        .from('user_gamification')
        .select('total_journal_entries, xp_points')
        .eq('user_id', user.id)
        .single();

      if (stats) {
        await supabase
          .from('user_gamification')
          .update({ 
            total_journal_entries: (stats.total_journal_entries || 0) + 1,
            xp_points: (stats.xp_points || 0) + 10
          })
          .eq('user_id', user.id);
      }
    }
    setSubmitting(false);
  };

  const getMoodEmoji = (mood: string) => {
    return moodOptions.find(m => m.id === mood)?.emoji || '😌';
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <BookHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to use your Journal</h2>
        <p className="text-muted-foreground">Your entries are private and secure.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-support mb-4">
          <BookHeart className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Silent Journal</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Write or record your thoughts privately. Get a gentle reply if you want one.
        </p>
      </div>

      {/* New Entry */}
      <div className="glass rounded-2xl p-6 mb-8">
        {/* Mood Selection */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-3 block">How are you feeling right now?</Label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map(mood => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm",
                  selectedMood === mood.id
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Entry Input */}
        <Textarea
          placeholder="What's on your mind? Write freely, no one else will see this unless you want feedback..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          rows={5}
          className="resize-none mb-4"
        />

        {/* Options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="response"
              checked={wantsResponse}
              onCheckedChange={setWantsResponse}
            />
            <Label htmlFor="response" className="text-sm cursor-pointer">
              <span className="font-medium">Get a response</span>
              <p className="text-xs text-muted-foreground">Receive a gentle reply within 24 hours</p>
            </Label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Record voice note">
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleSubmit}
              disabled={!newEntry.trim() || !selectedMood || submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save Entry
            </Button>
          </div>
        </div>
      </div>

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between glass rounded-xl p-4 mb-4 hover:bg-card/90 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-medium">Past Entries</span>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", showHistory && "rotate-180")} />
      </button>

      {/* History */}
      {showHistory && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookHeart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No entries yet. Start writing!</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div 
                key={entry.id} 
                className="glass rounded-2xl p-5 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <p className="text-sm font-medium">{format(new Date(entry.created_at), 'EEEE, MMMM d')}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'h:mm a')}</p>
                    </div>
                  </div>
                  {entry.has_response && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Response received
                    </Badge>
                  )}
                  {entry.wants_response && !entry.has_response && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Awaiting response
                    </Badge>
                  )}
                </div>
                
                <p className="text-foreground leading-relaxed">{entry.content}</p>
                
                {entry.response_text && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                    <p className="text-sm text-muted-foreground">{entry.response_text}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Note */}
      <div className="mt-8 glass rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">AI-Assisted Reflections</p>
          <p className="text-xs text-muted-foreground">
            When you request a response, our AI provides gentle, compassionate feedback 
            designed to help you process your thoughts. A trained listener may also reach out.
          </p>
        </div>
      </div>
    </div>
  );
}