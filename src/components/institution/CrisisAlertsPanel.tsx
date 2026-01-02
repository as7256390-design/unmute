import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Bell, 
  BellRing,
  Phone,
  Clock,
  User,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CrisisAlert {
  id: string;
  user_id: string;
  risk_level: string;
  suicide_roadmap_stage: string | null;
  last_crisis_detected_at: string | null;
  crisis_count: number | null;
  needs_counselling: boolean | null;
  updated_at: string;
}

interface CrisisAlertsPanelProps {
  institutionId: string;
}

const CRITICAL_STAGES = ['ideation', 'planning', 'action'];

const STAGE_INFO: Record<string, { label: string; urgency: string; color: string }> = {
  ideation: { 
    label: 'Suicidal Ideation', 
    urgency: 'HIGH PRIORITY', 
    color: 'bg-red-500' 
  },
  planning: { 
    label: 'Active Planning', 
    urgency: 'CRITICAL', 
    color: 'bg-red-600' 
  },
  action: { 
    label: 'Imminent Risk', 
    urgency: 'EMERGENCY', 
    color: 'bg-red-700' 
  }
};

export function CrisisAlertsPanel({ institutionId }: CrisisAlertsPanelProps) {
  const [criticalAlerts, setCriticalAlerts] = useState<CrisisAlert[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<CrisisAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
    
    // Set up real-time subscription for student_risk_profiles
    const channel = supabase
      .channel('crisis-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_risk_profiles',
          filter: `institution_id=eq.${institutionId}`
        },
        (payload) => {
          console.log('Real-time crisis update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId]);

  const handleRealtimeUpdate = (payload: any) => {
    const record = payload.new as CrisisAlert;
    
    // Check if this is a critical stage alert
    if (record && CRITICAL_STAGES.includes(record.suicide_roadmap_stage || '')) {
      // Show browser notification if permitted
      showBrowserNotification(record);
      
      // Mark as new alert for animation
      setNewAlertIds(prev => new Set([...prev, record.id]));
      
      // Play alert sound
      playAlertSound();
      
      // Reload alerts
      loadAlerts();
      
      // Show toast
      const stageInfo = STAGE_INFO[record.suicide_roadmap_stage || ''];
      toast.error(
        `🚨 ${stageInfo?.urgency || 'ALERT'}: Student reached ${stageInfo?.label || 'critical'} stage`,
        { duration: 10000 }
      );
    } else {
      // Regular update, just reload
      loadAlerts();
    }
  };

  const showBrowserNotification = (alert: CrisisAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const stageInfo = STAGE_INFO[alert.suicide_roadmap_stage || ''];
      new Notification('🚨 Critical Crisis Alert', {
        body: `${stageInfo?.urgency}: A student has reached ${stageInfo?.label || 'critical'} stage. Immediate intervention required.`,
        icon: '/pwa-192x192.png',
        tag: 'crisis-alert',
        requireInteraction: true
      });
    }
  };

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Could not play alert sound');
    }
  };

  const loadAlerts = async () => {
    try {
      // Load critical stage alerts (ideation, planning, action)
      const { data: critical } = await supabase
        .from('student_risk_profiles')
        .select('*')
        .eq('institution_id', institutionId)
        .in('suicide_roadmap_stage', CRITICAL_STAGES)
        .order('updated_at', { ascending: false });

      // Load recent high/critical risk alerts
      const { data: recent } = await supabase
        .from('student_risk_profiles')
        .select('*')
        .eq('institution_id', institutionId)
        .in('risk_level', ['high', 'critical'])
        .order('last_crisis_detected_at', { ascending: false })
        .limit(20);

      setCriticalAlerts(critical || []);
      setRecentAlerts(recent || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled for crisis alerts');
      } else {
        toast.error('Please enable notifications to receive crisis alerts');
      }
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedIds(prev => new Set([...prev, alertId]));
    setNewAlertIds(prev => {
      const next = new Set(prev);
      next.delete(alertId);
      return next;
    });
    toast.success('Alert acknowledged');
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasNotificationPermission = 'Notification' in window && Notification.permission === 'granted';

  return (
    <div className="space-y-6">
      {/* Notification Permission Banner */}
      {!hasNotificationPermission && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium">Enable Crisis Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get instant browser alerts when students reach critical stages
                </p>
              </div>
            </div>
            <Button onClick={requestNotificationPermission}>
              <BellRing className="h-4 w-4 mr-2" />
              Enable Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts - Immediate Attention */}
      <Card className={criticalAlerts.length > 0 ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${criticalAlerts.length > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            Critical Stage Alerts ({criticalAlerts.length})
          </CardTitle>
          <CardDescription>
            Students in ideation, planning, or action stages requiring immediate intervention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-safe opacity-50" />
              <p>No students in critical stages</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <AnimatePresence>
                {criticalAlerts.map((alert) => {
                  const stageInfo = STAGE_INFO[alert.suicide_roadmap_stage || ''];
                  const isNew = newAlertIds.has(alert.id);
                  const isAcknowledged = acknowledgedIds.has(alert.id);
                  
                  return (
                    <motion.div
                      key={alert.id}
                      initial={isNew ? { scale: 1.02, backgroundColor: 'hsl(var(--destructive) / 0.2)' } : {}}
                      animate={{ scale: 1, backgroundColor: 'transparent' }}
                      transition={{ duration: 0.5 }}
                      className={`p-4 border rounded-lg mb-3 ${
                        isAcknowledged ? 'opacity-60' : ''
                      } ${isNew ? 'ring-2 ring-destructive' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${stageInfo?.color} text-white`}>
                              {stageInfo?.urgency}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Activity className="h-3 w-3" />
                              {stageInfo?.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Student ID: {alert.user_id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Detected: {getTimeAgo(alert.last_crisis_detected_at || alert.updated_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span>Risk Level: {alert.risk_level}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span>Crisis Count: {alert.crisis_count || 0}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Immediate Action Required:
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {alert.suicide_roadmap_stage === 'action' && 
                                'Contact emergency services immediately. Ensure student safety. Do not leave student alone.'}
                              {alert.suicide_roadmap_stage === 'planning' && 
                                'Activate crisis protocol. Contact crisis team. Assign dedicated counsellor for 24/7 monitoring.'}
                              {alert.suicide_roadmap_stage === 'ideation' && 
                                'Schedule immediate professional intervention. Contact parents/guardians. Ensure daily check-ins.'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {!isAcknowledged && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          <Button size="sm" variant="destructive">
                            <Phone className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recent High-Risk Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-warning" />
            Recent High-Risk Activity ({recentAlerts.length})
          </CardTitle>
          <CardDescription>
            Students with high or critical risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent high-risk activity</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.risk_level === 'critical' ? 'bg-destructive animate-pulse' : 'bg-warning'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          Student {alert.user_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(alert.last_crisis_detected_at || alert.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.risk_level === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.risk_level}
                      </Badge>
                      {alert.suicide_roadmap_stage && (
                        <Badge variant="outline">
                          {alert.suicide_roadmap_stage}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
