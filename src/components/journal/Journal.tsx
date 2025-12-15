import { useState } from 'react';
import { BookHeart, Send, Mic, Calendar, Sparkles, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { EmotionalState } from '@/types';

const moodOptions: { id: EmotionalState; emoji: string; label: string }[] = [
  { id: 'anxious', emoji: '😟', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'overwhelmed', emoji: '😫', label: 'Overwhelmed' },
  { id: 'numb', emoji: '😶', label: 'Numb' },
  { id: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { id: 'neutral', emoji: '😌', label: 'Okay' },
];

const mockEntries = [
  {
    id: '1',
    content: "Today was tough. Had a fight with my roommate and couldn't focus on studies at all. I just want to go home sometimes.",
    mood: 'sad' as EmotionalState,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    wantsResponse: true,
    hasResponse: true,
  },
  {
    id: '2',
    content: "Small win today - finished my assignment before deadline! It feels good to accomplish something.",
    mood: 'hopeful' as EmotionalState,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    wantsResponse: false,
    hasResponse: false,
  },
  {
    id: '3',
    content: "Can't sleep again. Mind keeps racing about what I said in class today. Why do I overthink everything?",
    mood: 'anxious' as EmotionalState,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    wantsResponse: true,
    hasResponse: true,
  },
];

export function Journal() {
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<EmotionalState | null>(null);
  const [wantsResponse, setWantsResponse] = useState(false);
  const [entries, setEntries] = useState(mockEntries);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = () => {
    if (!newEntry.trim() || !selectedMood) return;
    
    const entry = {
      id: crypto.randomUUID(),
      content: newEntry.trim(),
      mood: selectedMood,
      timestamp: new Date(),
      wantsResponse,
      hasResponse: false,
    };
    
    setEntries([entry, ...entries]);
    setNewEntry('');
    setSelectedMood(null);
    setWantsResponse(false);
  };

  const getMoodEmoji = (mood: EmotionalState) => {
    return moodOptions.find(m => m.id === mood)?.emoji || '😌';
  };

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
              disabled={!newEntry.trim() || !selectedMood}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
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
          {entries.map((entry, index) => (
            <div 
              key={entry.id} 
              className="glass rounded-2xl p-5 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                  <div>
                    <p className="text-sm font-medium">{format(entry.timestamp, 'EEEE, MMMM d')}</p>
                    <p className="text-xs text-muted-foreground">{format(entry.timestamp, 'h:mm a')}</p>
                  </div>
                </div>
                {entry.hasResponse && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Response received
                  </Badge>
                )}
                {entry.wantsResponse && !entry.hasResponse && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Awaiting response
                  </Badge>
                )}
              </div>
              
              <p className="text-foreground leading-relaxed">{entry.content}</p>
            </div>
          ))}
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
