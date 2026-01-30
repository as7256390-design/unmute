import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Phone, MapPin, Users, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CRISIS_RESOURCES } from '@/lib/crisisDetection';
import { RoadmapDetectionResult, getStageName } from '@/lib/suicideRoadmapDetection';

interface AutomatedCrisisResponseProps {
  crisisData: RoadmapDetectionResult;
  messageContent: string;
  conversationId: string;
  onDismiss: () => void;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

export function AutomatedCrisisResponse({
  crisisData,
  messageContent,
  conversationId,
  onDismiss,
}: AutomatedCrisisResponseProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [parentConnection, setParentConnection] = useState<any>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState({
    emergencyContacts: false,
    parents: false,
    institution: false,
    nearbyHelp: false,
  });
  const [autoDialTriggered, setAutoDialTriggered] = useState(false);

  // Load emergency contacts and parent connections
  useEffect(() => {
    if (!user) return;

    const loadContacts = async () => {
      // Fetch emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      if (contacts) {
        setEmergencyContacts(contacts);
      }

      // Fetch parent connection (if user is a child)
      const { data: connections } = await supabase
        .from('parent_child_connections')
        .select('*')
        .eq('child_user_id', user.id)
        .eq('status', 'connected')
        .limit(1);

      if (connections && connections.length > 0) {
        setParentConnection(connections[0]);
      }
    };

    loadContacts();
  }, [user]);

  // Auto-trigger for critical/action stages
  useEffect(() => {
    if (
      crisisData.requiresImmediateIntervention &&
      (crisisData.stage === 'action' || crisisData.stage === 'planning') &&
      !autoDialTriggered
    ) {
      // Immediate action: trigger all notifications and auto-dial
      handleEmergencyResponse();
      setAutoDialTriggered(true);
    }
  }, [crisisData, autoDialTriggered]);

  const handleEmergencyResponse = useCallback(async () => {
    if (!user || isNotifying) return;
    setIsNotifying(true);

    try {
      // 1. Create crisis alert in database
      const { data: alert } = await supabase.from('crisis_alerts').insert({
        user_id: user.id,
        source_type: 'chat',
        source_id: conversationId,
        content: messageContent.slice(0, 500),
        severity: crisisData.severity,
        keywords_matched: crisisData.indicators,
      }).select().single();

      const alertId = alert?.id;

      // 2. Update student risk profile
      await supabase.from('student_risk_profiles').upsert({
        user_id: user.id,
        risk_level: crisisData.severity,
        suicide_roadmap_stage: crisisData.stage,
        last_crisis_detected_at: new Date().toISOString(),
        needs_counselling: true,
      }, { onConflict: 'user_id' });

      // 3. Send notifications to all stakeholders
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session?.access_token) {
        // Notify institution admins
        await supabase.functions.invoke('send-crisis-notification', {
          body: {
            type: 'both',
            alertId,
            studentId: user.id,
            riskLevel: crisisData.severity,
            stage: crisisData.stage ? getStageName(crisisData.stage) : undefined,
            action: 'automated_crisis_detection',
            details: `Crisis detected in chat. Stage: ${crisisData.stage}. Indicators: ${crisisData.indicators.join(', ')}`,
          },
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });

        setNotificationsSent(prev => ({ ...prev, institution: true }));
      }

      // 4. Notify emergency contacts via SMS
      if (emergencyContacts.length > 0) {
        for (const contact of emergencyContacts) {
          await sendEmergencySMS(contact, crisisData);
        }
        setNotificationsSent(prev => ({ ...prev, emergencyContacts: true }));
      }

      // 5. Notify parents if connected
      if (parentConnection) {
        await notifyParent(parentConnection, crisisData);
        setNotificationsSent(prev => ({ ...prev, parents: true }));
      }

      // 6. For critical cases, fetch nearby emergency services
      if (crisisData.severity === 'critical') {
        await fetchNearbyEmergencyHelp();
        setNotificationsSent(prev => ({ ...prev, nearbyHelp: true }));
      }

      // 7. Log the crisis response
      await supabase.from('crisis_response_logs').insert({
        crisis_alert_id: alertId,
        student_user_id: user.id,
        responder_user_id: user.id,
        action_type: 'automated_response',
        action_details: `Automated crisis response triggered. Stage: ${crisisData.stage}`,
        notification_sent: true,
        notification_type: 'both',
        follow_up_required: true,
      });

      toast.success('Emergency notifications sent. Help is on the way.');

    } catch (error) {
      console.error('Error in emergency response:', error);
      toast.error('Failed to send some notifications. Please call emergency services directly.');
    } finally {
      setIsNotifying(false);
    }
  }, [user, conversationId, messageContent, crisisData, emergencyContacts, parentConnection, isNotifying]);

  const sendEmergencySMS = async (contact: EmergencyContact, crisis: RoadmapDetectionResult) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      await supabase.functions.invoke('send-panic-alert', {
        body: {
          contactPhone: contact.phone,
          contactName: contact.name,
          message: `🚨 URGENT: ${contact.name}, someone you care about may need immediate help. They've expressed concerning thoughts. Please reach out to them now or call emergency services. - Aprivox Crisis Alert`,
          type: 'crisis',
        },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
    } catch (error) {
      console.error('Failed to send SMS to', contact.name, error);
    }
  };

  const notifyParent = async (connection: any, crisis: RoadmapDetectionResult) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      // Get parent's notification settings or email
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', connection.parent_user_id)
        .single();

      // Send notification via edge function
      await supabase.functions.invoke('send-crisis-notification', {
        body: {
          type: 'both',
          studentId: user?.id,
          riskLevel: crisis.severity,
          stage: crisis.stage ? getStageName(crisis.stage) : undefined,
          action: 'parent_notification',
          details: 'Your child may need immediate support. Please check on them.',
        },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
    } catch (error) {
      console.error('Failed to notify parent:', error);
    }
  };

  const fetchNearbyEmergencyHelp = async () => {
    try {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) return;

        await supabase.functions.invoke('nearby-emergency', {
          body: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius: 5000,
          },
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
      });
    } catch (error) {
      console.error('Failed to fetch nearby help:', error);
    }
  };

  const dialEmergency = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleClose = () => {
    setIsOpen(false);
    onDismiss();
  };

  const isCritical = crisisData.severity === 'critical' || crisisData.stage === 'action' || crisisData.stage === 'planning';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-lg ${isCritical ? 'border-destructive border-2' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className={`h-5 w-5 ${isCritical ? 'animate-pulse' : ''}`} />
            {isCritical ? 'EMERGENCY: Immediate Help Needed' : 'Crisis Support Activated'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Severity Indicator */}
          <div className={`p-3 rounded-lg ${
            isCritical ? 'bg-destructive/20 border border-destructive' : 'bg-amber-500/20 border border-amber-500'
          }`}>
            <p className="text-sm font-medium">
              {crisisData.stage && `Detected: ${getStageName(crisisData.stage)}`}
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Risk Level: <span className="font-semibold uppercase">{crisisData.severity}</span>
            </p>
          </div>

          {/* Emergency Call Button */}
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-full h-14 text-lg font-semibold animate-pulse"
              onClick={() => dialEmergency('112')}
            >
              <Phone className="h-6 w-6 mr-2" />
              Call Emergency: 112
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => dialEmergency(CRISIS_RESOURCES.suicide.phone)}
              >
                <Phone className="h-4 w-4 mr-1" />
                {CRISIS_RESOURCES.suicide.name}
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => dialEmergency(CRISIS_RESOURCES.india.phone)}
              >
                <Phone className="h-4 w-4 mr-1" />
                {CRISIS_RESOURCES.india.name}
              </Button>
            </div>
          </div>

          {/* Notification Status */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Automatic Notifications:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notificationsSent.institution ? 'bg-safe' : 'bg-muted-foreground'
                }`} />
                <span>Institution Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notificationsSent.emergencyContacts ? 'bg-safe' : emergencyContacts.length === 0 ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                <span>Emergency Contacts {emergencyContacts.length === 0 && '(None set)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notificationsSent.parents ? 'bg-safe' : !parentConnection ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                <span>Parents {!parentConnection && '(Not connected)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notificationsSent.nearbyHelp ? 'bg-safe' : 'bg-muted-foreground'
                }`} />
                <span>Nearby Medical</span>
              </div>
            </div>
          </div>

          {/* Manual Trigger Button */}
          {!isCritical && (
            <Button
              variant="default"
              className="w-full"
              onClick={handleEmergencyResponse}
              disabled={isNotifying}
            >
              <Shield className="h-4 w-4 mr-2" />
              {isNotifying ? 'Sending Notifications...' : 'Send Emergency Alerts'}
            </Button>
          )}

          {/* Emergency Contacts Quick Dial */}
          {emergencyContacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Emergency Contacts:</p>
              <div className="space-y-1">
                {emergencyContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => dialEmergency(contact.phone)}
                  >
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship} • {contact.phone}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Reassurance Message */}
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💙 You are not alone. Help is available and people care about you.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
