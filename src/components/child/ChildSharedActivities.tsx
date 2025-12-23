import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Heart, MessageCircle, Users, Sparkles, Check, Clock, Send, Star } from 'lucide-react';

interface SharedActivity {
  id: string;
  connection_id: string;
  title: string;
  description: string;
  activity_type: string;
  prompt: string;
  parent_response: string | null;
  child_response: string | null;
  parent_completed_at: string | null;
  child_completed_at: string | null;
  created_at: string;
}

interface Connection {
  id: string;
  parent_user_id: string;
  status: string;
}

export function ChildSharedActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<SharedActivity[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [response, setResponse] = useState('');
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch connections where user is child
      const { data: connectionData } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('child_user_id', user?.id)
        .eq('status', 'connected');

      setConnections(connectionData || []);

      if (connectionData && connectionData.length > 0) {
        // Fetch activities for all connections
        const connectionIds = connectionData.map(c => c.id);
        const { data: activityData } = await supabase
          .from('shared_activities')
          .select('*')
          .in('connection_id', connectionIds)
          .order('created_at', { ascending: false });

        setActivities(activityData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (activityId: string) => {
    if (!response.trim()) {
      toast.error('Please write your response');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('shared_activities')
        .update({
          child_response: response,
          child_completed_at: new Date().toISOString()
        })
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Response submitted! Your parent will be notified.');
      setResponse('');
      setActiveActivityId(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingActivities = activities.filter(a => !a.child_completed_at);
  const completedActivities = activities.filter(a => a.child_completed_at);
  const newActivities = pendingActivities.filter(a => {
    const created = new Date(a.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect with Your Parent</h3>
          <p className="text-muted-foreground">
            Ask your parent for a connection code to link your accounts and see shared activities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Activities Banner */}
      {newActivities.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Activity from Your Parent!</p>
                <p className="text-sm text-muted-foreground">
                  You have {newActivities.length} new {newActivities.length === 1 ? 'activity' : 'activities'} to complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingActivities.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Check className="w-4 h-4" />
            Completed ({completedActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {pendingActivities.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No pending activities. Check back later for new ones from your parent.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingActivities.map(activity => (
                  <Card 
                    key={activity.id} 
                    className={`bg-card/50 border-border/50 transition-all ${
                      newActivities.includes(activity) ? 'ring-2 ring-primary/50' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {activity.title}
                            {newActivities.includes(activity) && (
                              <Badge className="bg-primary/20 text-primary">New</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{activity.description}</CardDescription>
                        </div>
                        {activity.parent_completed_at && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400">
                            <Check className="w-3 h-3 mr-1" /> Parent responded
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Heart className="w-5 h-5 text-primary mt-0.5" />
                          <p className="font-medium">{activity.prompt}</p>
                        </div>
                      </div>

                      {activity.parent_response && (
                        <div className="p-4 bg-green-500/10 rounded-lg">
                          <p className="text-sm font-medium text-green-400 mb-2">
                            <MessageCircle className="w-4 h-4 inline mr-1" />
                            Your Parent's Response:
                          </p>
                          <p className="text-sm">{activity.parent_response}</p>
                        </div>
                      )}

                      {activeActivityId === activity.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Share your honest thoughts and feelings..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="min-h-[120px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => submitResponse(activity.id)}
                              disabled={submitting}
                              className="gap-2"
                            >
                              <Send className="w-4 h-4" />
                              {submitting ? 'Sending...' : 'Send Response'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setActiveActivityId(null);
                                setResponse('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setActiveActivityId(activity.id)}
                          className="w-full gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Write Your Response
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {completedActivities.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No completed activities yet</h3>
                    <p className="text-muted-foreground">
                      Complete activities with your parent to build a stronger bond!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedActivities.map(activity => (
                  <Card key={activity.id} className="bg-card/50 border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500/20 rounded-full">
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{activity.title}</CardTitle>
                          <CardDescription>
                            Completed on {new Date(activity.child_completed_at!).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium">{activity.prompt}</p>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-blue-500/10 rounded-lg">
                          <p className="text-sm font-medium text-blue-400 mb-2">Your Response:</p>
                          <p className="text-sm">{activity.child_response}</p>
                        </div>
                        {activity.parent_response && (
                          <div className="p-4 bg-green-500/10 rounded-lg">
                            <p className="text-sm font-medium text-green-400 mb-2">Parent's Response:</p>
                            <p className="text-sm">{activity.parent_response}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
