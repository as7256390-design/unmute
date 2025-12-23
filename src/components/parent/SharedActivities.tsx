import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Heart, MessageCircle, Target, Sparkles, Plus, Check, Clock, Users, Send } from 'lucide-react';

interface ActivityTemplate {
  id: string;
  title: string;
  description: string;
  activity_type: string;
  prompt: string;
  category: string;
  difficulty: string;
}

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
  child_user_id: string;
  status: string;
}

export function SharedActivities() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [activities, setActivities] = useState<SharedActivity[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch templates
      const { data: templateData } = await supabase
        .from('activity_templates')
        .select('*')
        .order('category', { ascending: true });

      // Fetch connections
      const { data: connectionData } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('parent_user_id', user?.id)
        .eq('status', 'connected');

      // Fetch existing activities
      const { data: activityData } = await supabase
        .from('shared_activities')
        .select('*')
        .order('created_at', { ascending: false });

      setTemplates(templateData || []);
      setConnections(connectionData || []);
      setActivities(activityData || []);

      if (connectionData && connectionData.length > 0) {
        setSelectedConnection(connectionData[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (template: ActivityTemplate) => {
    if (!selectedConnection) {
      toast.error('Please connect with your child first');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('shared_activities')
        .insert({
          connection_id: selectedConnection,
          title: template.title,
          description: template.description,
          activity_type: template.activity_type,
          prompt: template.prompt,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Activity created! Your child can now see and respond to it.');
      fetchData();
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    } finally {
      setSubmitting(false);
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
          parent_response: response,
          parent_completed_at: new Date().toISOString()
        })
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Response submitted!');
      setResponse('');
      fetchData();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gratitude': return <Heart className="w-4 h-4" />;
      case 'communication': return <MessageCircle className="w-4 h-4" />;
      case 'understanding': return <Users className="w-4 h-4" />;
      case 'bonding': return <Sparkles className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'deep': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeActivities = activities.filter(a => !a.parent_completed_at || !a.child_completed_at);
  const completedActivities = activities.filter(a => a.parent_completed_at && a.child_completed_at);

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
          <h3 className="text-lg font-semibold mb-2">Connect with Your Child First</h3>
          <p className="text-muted-foreground">
            Use the "Your Child" tab to generate a connection code and link with your child.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="browse">Browse Activities</TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeActivities.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="grid gap-4">
            {['gratitude', 'bonding', 'communication', 'understanding'].map(category => (
              <div key={category}>
                <h3 className="text-lg font-semibold capitalize mb-3 flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {templates.filter(t => t.category === category).map(template => (
                    <Card key={template.id} className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <Badge className={getDifficultyColor(template.difficulty)}>
                            {template.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 italic">
                          "{template.prompt.substring(0, 100)}..."
                        </p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full gap-2">
                              <Plus className="w-4 h-4" />
                              Start Activity
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{template.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <p className="text-muted-foreground">{template.description}</p>
                              <div className="p-4 bg-primary/10 rounded-lg">
                                <p className="font-medium">{template.prompt}</p>
                              </div>
                              <Button 
                                onClick={() => createActivity(template)} 
                                disabled={submitting}
                                className="w-full"
                              >
                                {submitting ? 'Creating...' : 'Create & Send to Child'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {activeActivities.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active activities. Browse and start one!</p>
                  </CardContent>
                </Card>
              ) : (
                activeActivities.map(activity => (
                  <Card key={activity.id} className="bg-card/50 border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{activity.title}</CardTitle>
                          <CardDescription>{activity.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {activity.parent_completed_at && (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400">
                              <Check className="w-3 h-3 mr-1" /> You responded
                            </Badge>
                          )}
                          {activity.child_completed_at && (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                              <Check className="w-3 h-3 mr-1" /> Child responded
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-medium">{activity.prompt}</p>
                      </div>

                      {activity.child_response && (
                        <div className="p-4 bg-blue-500/10 rounded-lg">
                          <p className="text-sm font-medium text-blue-400 mb-2">Child's Response:</p>
                          <p className="text-sm">{activity.child_response}</p>
                        </div>
                      )}

                      {activity.parent_response ? (
                        <div className="p-4 bg-green-500/10 rounded-lg">
                          <p className="text-sm font-medium text-green-400 mb-2">Your Response:</p>
                          <p className="text-sm">{activity.parent_response}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Write your thoughtful response..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <Button 
                            onClick={() => submitResponse(activity.id)}
                            disabled={submitting}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Submitting...' : 'Submit Response'}
                          </Button>
                        </div>
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
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Complete activities together to see them here!</p>
                  </CardContent>
                </Card>
              ) : (
                completedActivities.map(activity => (
                  <Card key={activity.id} className="bg-card/50 border-border/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-400" />
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                      </div>
                      <CardDescription>
                        Completed on {new Date(activity.child_completed_at!).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="font-medium text-sm">{activity.prompt}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-green-500/10 rounded-lg">
                          <p className="text-sm font-medium text-green-400 mb-2">Your Response:</p>
                          <p className="text-sm">{activity.parent_response}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-lg">
                          <p className="text-sm font-medium text-blue-400 mb-2">Child's Response:</p>
                          <p className="text-sm">{activity.child_response}</p>
                        </div>
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
