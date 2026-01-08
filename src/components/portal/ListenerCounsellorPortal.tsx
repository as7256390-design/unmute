import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  HeartHandshake, 
  Users, 
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  Phone,
  Calendar,
  TrendingUp,
  Shield,
  UserCheck,
  Bell,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { getStageName, getStageDescription, getInterventionGuidance, SuicideRoadmapStage } from '@/lib/suicideRoadmapDetection';

interface Assignment {
  id: string;
  student_user_id: string;
  status: string;
  priority: string;
  reason: string | null;
  risk_level: string | null;
  assigned_at: string;
  notes: string | null;
}

interface StudentRiskProfile {
  id: string;
  user_id: string;
  risk_level: string;
  suicide_roadmap_stage: SuicideRoadmapStage | null;
  last_crisis_detected_at: string | null;
  crisis_count: number;
  needs_counselling: boolean;
  notes: string | null;
  last_mood_score: number | null;
}

export function ListenerCounsellorPortal() {
  const { user } = useAuth();
  const { isListener, isCounsellor, isVerified, loading: roleLoading } = useUserRole();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<StudentRiskProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskProfile | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (user && (isListener || isCounsellor) && isVerified) {
      loadAssignments();
      loadAtRiskStudents();
    } else {
      setLoading(false);
    }
  }, [user, isListener, isCounsellor, isVerified]);

  const loadAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('counsellor_assignments')
        .select('*')
        .or(`counsellor_user_id.eq.${user.id},listener_user_id.eq.${user.id}`)
        .neq('status', 'completed')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAtRiskStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_risk_profiles')
        .select('*')
        .in('risk_level', ['high', 'critical'])
        .order('last_crisis_detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAtRiskStudents((data || []) as StudentRiskProfile[]);
    } catch (err) {
      console.error('Error loading at-risk students:', err);
    }
  };

  const acceptAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('counsellor_assignments')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', assignmentId);

    if (error) {
      toast.error('Failed to accept assignment');
    } else {
      toast.success('Assignment accepted');
      loadAssignments();
    }
  };

  const completeAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('counsellor_assignments')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        notes: sessionNotes 
      })
      .eq('id', assignmentId);

    if (error) {
      toast.error('Failed to complete assignment');
    } else {
      toast.success('Session completed');
      setSessionNotes('');
      loadAssignments();
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
          <HeartHandshake className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold mb-2">Listener & Counsellor Portal</h2>
        <p className="text-muted-foreground">Please sign in to access this portal.</p>
      </div>
    );
  }

  if (!isListener && !isCounsellor) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          This portal is only available to verified listeners and counsellors.
        </p>
        <p className="text-sm text-muted-foreground">
          If you're a listener or counsellor, please complete the peer listener training 
          or contact your institution admin for verification.
        </p>
      </div>
    );
  }

  if (!isVerified) {
    const { RoleVerificationRequest } = await import('./RoleVerificationRequest');
    return (
      <div className="p-6">
        <RoleVerificationRequest requestedRole={isCounsellor ? 'counsellor' : 'listener'} />
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const activeAssignments = assignments.filter(a => a.status === 'active');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-primary" />
            {isCounsellor ? 'Counsellor Portal' : 'Peer Listener Portal'}
          </h1>
          <p className="text-muted-foreground">
            Support students who need your help
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Verified {isCounsellor ? 'Counsellor' : 'Listener'}
          </Badge>
          {pendingAssignments.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {pendingAssignments.length} New
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingAssignments.length}</p>
              </div>
              <Clock className="h-10 w-10 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold">{activeAssignments.length}</p>
              </div>
              <MessageSquare className="h-10 w-10 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At-Risk Students</p>
                <p className="text-3xl font-bold">{atRiskStudents.length}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Cases</p>
                <p className="text-3xl font-bold text-destructive">
                  {atRiskStudents.filter(s => s.risk_level === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList>
          <TabsTrigger value="assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="at-risk">At-Risk Students</TabsTrigger>
          {isCounsellor && <TabsTrigger value="guidance">Intervention Guide</TabsTrigger>}
        </TabsList>

        <TabsContent value="assignments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Assignments */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Assignments
                </CardTitle>
                <CardDescription>Students waiting for your help</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {pendingAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No pending assignments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingAssignments.map((assignment) => (
                        <Card key={assignment.id} className="bg-background/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {assignment.student_user_id.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">Anonymous Student</p>
                                  <p className="text-xs text-muted-foreground">
                                    Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={getRiskBadgeVariant(assignment.risk_level || 'low')}>
                                {assignment.risk_level || 'Unknown'} Risk
                              </Badge>
                            </div>
                            {assignment.reason && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {assignment.reason}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${getPriorityColor(assignment.priority)}`}>
                                {assignment.priority.toUpperCase()} Priority
                              </span>
                              <Button size="sm" onClick={() => acceptAssignment(assignment.id)}>
                                Accept
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Active Assignments */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Ongoing support sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {activeAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active sessions</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAssignments.map((assignment) => (
                        <Card key={assignment.id} className="bg-background/50 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-primary">
                                  <AvatarFallback>
                                    {assignment.student_user_id.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">Anonymous Student</p>
                                  <p className="text-xs text-muted-foreground">
                                    Active since {new Date(assignment.assigned_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="default">Active</Badge>
                            </div>
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Session notes (optional)..."
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                className="text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Message
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => completeAssignment(assignment.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="at-risk">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                At-Risk Students Dashboard
              </CardTitle>
              <CardDescription>
                Students identified as needing intervention based on crisis detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {atRiskStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No at-risk students detected</p>
                    <p className="text-sm">The system monitors for early warning signs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {atRiskStudents.map((student) => (
                      <Card 
                        key={student.id} 
                        className={`bg-background/50 cursor-pointer transition-all hover:shadow-md ${
                          student.risk_level === 'critical' ? 'border-destructive' : ''
                        } ${selectedStudent?.id === student.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className={`h-12 w-12 ${
                                student.risk_level === 'critical' ? 'ring-2 ring-destructive' : ''
                              }`}>
                                <AvatarFallback className={
                                  student.risk_level === 'critical' ? 'bg-destructive text-destructive-foreground' : ''
                                }>
                                  {student.user_id.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">Student #{student.user_id.slice(0, 8)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={getRiskBadgeVariant(student.risk_level)}>
                                    {student.risk_level.toUpperCase()} Risk
                                  </Badge>
                                  {student.suicide_roadmap_stage && (
                                    <Badge variant="outline">
                                      Stage: {getStageName(student.suicide_roadmap_stage)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {student.crisis_count} crisis events
                              </p>
                              {student.last_crisis_detected_at && (
                                <p className="text-xs text-muted-foreground">
                                  Last: {new Date(student.last_crisis_detected_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {selectedStudent?.id === student.id && student.suicide_roadmap_stage && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Stage Description:</p>
                                <p className="text-sm">{getStageDescription(student.suicide_roadmap_stage)}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Intervention Guidance:</p>
                                <ul className="text-sm list-disc list-inside space-y-1">
                                  {getInterventionGuidance(student.suicide_roadmap_stage).map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              {student.needs_counselling && (
                                <Badge variant="destructive" className="mt-2">
                                  Counselling Recommended
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {isCounsellor && (
          <TabsContent value="guidance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['trigger', 'spiral', 'distortions', 'isolation', 'ideation', 'planning', 'action'] as SuicideRoadmapStage[]).map((stage, index) => (
                <Card 
                  key={stage} 
                  className={`glass ${
                    index >= 5 ? 'border-destructive' : 
                    index >= 4 ? 'border-warning' : ''
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index >= 5 ? 'bg-destructive text-destructive-foreground' :
                        index >= 3 ? 'bg-warning text-warning-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      {getStageName(stage)}
                    </CardTitle>
                    <CardDescription>{getStageDescription(stage)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      {getInterventionGuidance(stage).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
