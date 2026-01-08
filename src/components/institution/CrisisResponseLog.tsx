import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Plus, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResponseLog {
  id: string;
  crisis_alert_id: string | null;
  student_user_id: string;
  responder_user_id: string;
  action_type: string;
  action_details: string | null;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  notification_sent: boolean;
  notification_type: string | null;
  created_at: string;
}

interface CrisisResponseLogProps {
  institutionId: string;
  studentUserId?: string;
  crisisAlertId?: string;
}

const ACTION_TYPES = [
  { value: 'contacted_student', label: 'Contacted Student' },
  { value: 'contacted_parent', label: 'Contacted Parent/Guardian' },
  { value: 'assigned_counsellor', label: 'Assigned Counsellor' },
  { value: 'emergency_services', label: 'Called Emergency Services' },
  { value: 'follow_up', label: 'Follow-up Check' },
  { value: 'resolved', label: 'Case Resolved' },
  { value: 'escalated', label: 'Escalated to Higher Authority' }
];

const OUTCOMES = [
  { value: 'successful', label: 'Successful' },
  { value: 'no_response', label: 'No Response' },
  { value: 'requires_follow_up', label: 'Requires Follow-up' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' }
];

export function CrisisResponseLog({ institutionId, studentUserId, crisisAlertId }: CrisisResponseLogProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ResponseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [actionType, setActionType] = useState('');
  const [actionDetails, setActionDetails] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'email' | 'sms' | 'both'>('email');

  useEffect(() => {
    loadLogs();
    
    // Real-time subscription
    const channel = supabase
      .channel('crisis-response-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'crisis_response_logs'
      }, () => loadLogs())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentUserId, crisisAlertId]);

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('crisis_response_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentUserId) {
        query = query.eq('student_user_id', studentUserId);
      }
      if (crisisAlertId) {
        query = query.eq('crisis_alert_id', crisisAlertId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading response logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !actionType) {
      toast.error('Please select an action type');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('crisis_response_logs')
        .insert({
          crisis_alert_id: crisisAlertId || null,
          student_user_id: studentUserId || 'unknown',
          responder_user_id: user.id,
          action_type: actionType,
          action_details: actionDetails || null,
          outcome: outcome || null,
          follow_up_required: followUpRequired,
          follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
          notification_sent: sendNotification,
          notification_type: sendNotification ? notificationType : null
        });

      if (error) throw error;

      // Send notification if requested
      if (sendNotification) {
        await supabase.functions.invoke('send-crisis-notification', {
          body: { 
            type: notificationType,
            alertId: crisisAlertId,
            action: actionType,
            details: actionDetails
          }
        });
      }

      toast.success('Response logged successfully');
      setDialogOpen(false);
      resetForm();
      loadLogs();
    } catch (err) {
      console.error('Error logging response:', err);
      toast.error('Failed to log response');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setActionType('');
    setActionDetails('');
    setOutcome('');
    setFollowUpRequired(false);
    setFollowUpDate('');
    setSendNotification(false);
    setNotificationType('email');
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'contacted_student':
      case 'contacted_parent':
        return <Phone className="h-4 w-4" />;
      case 'assigned_counsellor':
        return <User className="h-4 w-4" />;
      case 'emergency_services':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'follow_up':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-safe" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      successful: 'default',
      resolved: 'default',
      no_response: 'secondary',
      requires_follow_up: 'secondary',
      escalated: 'destructive'
    };
    return <Badge variant={variants[outcome] || 'outline'}>{outcome.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Crisis Response Log
            </CardTitle>
            <CardDescription>
              Track all intervention actions taken for crisis alerts
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No response actions logged yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getActionIcon(log.action_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">
                            {log.action_type.replace(/_/g, ' ')}
                          </span>
                          {getOutcomeBadge(log.outcome)}
                        </div>
                        {log.action_details && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.action_details}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          {log.notification_sent && (
                            <span className="flex items-center gap-1">
                              {log.notification_type === 'sms' || log.notification_type === 'both' ? (
                                <Phone className="h-3 w-3" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                              Notification sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {log.follow_up_required && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Follow-up {log.follow_up_date ? new Date(log.follow_up_date).toLocaleDateString() : 'needed'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Add Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Crisis Response Action</DialogTitle>
            <DialogDescription>
              Record the intervention action taken for this crisis alert
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action Type *</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                placeholder="Describe the action taken..."
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Follow-up Required</Label>
              <Switch 
                checked={followUpRequired} 
                onCheckedChange={setFollowUpRequired} 
              />
            </div>

            {followUpRequired && (
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Send Notification</Label>
              <Switch 
                checked={sendNotification} 
                onCheckedChange={setSendNotification} 
              />
            </div>

            {sendNotification && (
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <Select value={notificationType} onValueChange={(v) => setNotificationType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="both">Email & SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !actionType}>
              {submitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Log Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
