import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Connection {
  id: string;
  parent_user_id: string;
  status: string;
  connection_code: string;
}

interface SharingPreferences {
  share_mood: boolean;
  share_mood_history: boolean;
  share_weekly_summary: boolean;
}

export function ChildSharingSettings() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [preferences, setPreferences] = useState<Record<string, SharingPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [connectionCode, setConnectionCode] = useState('');
  const [connecting, setConnecting] = useState(false);

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
      // Fetch connections where user is the child
      const { data: connectionsData, error } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('child_user_id', user.id)
        .eq('status', 'connected');

      if (error) throw error;

      setConnections(connectionsData || []);

      // Fetch sharing preferences for each connection
      const prefsMap: Record<string, SharingPreferences> = {};
      for (const conn of connectionsData || []) {
        const { data: prefs } = await supabase
          .from('child_mood_sharing')
          .select('share_mood, share_mood_history, share_weekly_summary')
          .eq('connection_id', conn.id)
          .single();

        prefsMap[conn.id] = prefs || {
          share_mood: false,
          share_mood_history: false,
          share_weekly_summary: true
        };
      }

      setPreferences(prefsMap);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectParent = async () => {
    if (!user || !connectionCode.trim()) {
      toast.error('Please enter a connection code');
      return;
    }

    setConnecting(true);
    try {
      // Find the pending connection with this code
      const { data: connection, error: findError } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('connection_code', connectionCode.trim().toUpperCase())
        .eq('status', 'pending')
        .single();

      if (findError || !connection) {
        toast.error('Invalid or expired connection code');
        setConnecting(false);
        return;
      }

      // Update the connection
      const { error: updateError } = await supabase
        .from('parent_child_connections')
        .update({
          child_user_id: user.id,
          status: 'connected',
          connected_at: new Date().toISOString()
        })
        .eq('id', connection.id);

      if (updateError) throw updateError;

      // Create default sharing preferences
      await supabase
        .from('child_mood_sharing')
        .insert({
          child_user_id: user.id,
          connection_id: connection.id,
          share_mood: false,
          share_mood_history: false,
          share_weekly_summary: true
        });

      toast.success('Connected with parent!', {
        description: 'You can now control what they see about your mood.'
      });

      setConnectionCode('');
      fetchConnections();
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const updatePreference = async (connectionId: string, key: keyof SharingPreferences, value: boolean) => {
    if (!user) return;

    try {
      const currentPrefs = preferences[connectionId] || {
        share_mood: false,
        share_mood_history: false,
        share_weekly_summary: true
      };

      const newPrefs = { ...currentPrefs, [key]: value };

      // Upsert the preferences
      const { error } = await supabase
        .from('child_mood_sharing')
        .upsert({
          child_user_id: user.id,
          connection_id: connectionId,
          ...newPrefs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'child_user_id,connection_id'
        });

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        [connectionId]: newPrefs
      }));

      toast.success('Preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    }
  };

  if (!user) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display font-semibold mb-2">Parent Connection</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to connect with your parent and control what they can see.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-support/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-support" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg">Parent Connection</h2>
          <p className="text-sm text-muted-foreground">
            Control what your parent can see about how you're feeling
          </p>
        </div>
      </div>

      {/* Connect with Parent */}
      {connections.length === 0 && (
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-2">Connect with Your Parent</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the connection code your parent shared with you.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={connectionCode}
              onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
              placeholder="PC-XXXXXX"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
            />
            <Button 
              onClick={handleConnectParent} 
              disabled={connecting || !connectionCode.trim()}
              variant="gradient"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </div>
      )}

      {/* Connected Parents */}
      {connections.map((connection) => {
        const prefs = preferences[connection.id] || {
          share_mood: false,
          share_mood_history: false,
          share_weekly_summary: true
        };

        return (
          <motion.div
            key={connection.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-safe/20 text-safe">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Share Current Mood */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {prefs.share_mood ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Share Current Mood</p>
                    <p className="text-sm text-muted-foreground">
                      Let your parent see your latest mood check-in
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prefs.share_mood}
                  onCheckedChange={(checked) => updatePreference(connection.id, 'share_mood', checked)}
                />
              </div>

              {/* Share Mood History */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  {prefs.share_mood_history ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Share Mood Trends</p>
                    <p className="text-sm text-muted-foreground">
                      Show your mood patterns over time
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prefs.share_mood_history}
                  onCheckedChange={(checked) => updatePreference(connection.id, 'share_mood_history', checked)}
                />
              </div>

              {/* Weekly Summary */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-support" />
                  <div>
                    <p className="font-medium">Weekly Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Send a gentle weekly update (no details, just overall)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={prefs.share_weekly_summary}
                  onCheckedChange={(checked) => updatePreference(connection.id, 'share_weekly_summary', checked)}
                />
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Privacy Assurance */}
      <div className="mt-6 p-4 bg-gradient-to-br from-support/10 to-primary/10 rounded-xl">
        <p className="text-sm text-center text-muted-foreground">
          <span className="font-medium text-foreground">Your privacy matters.</span> Your journal, 
          chat messages, and personal reflections are never shared — only what you choose above.
        </p>
      </div>
    </div>
  );
}