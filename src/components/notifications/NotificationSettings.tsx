import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Clock, Calendar, TestTube } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const NotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    scheduleMoodReminder,
    sendTestNotification,
  } = usePushNotifications();

  const [moodReminderTime, setMoodReminderTime] = useState('09:00');
  const [moodReminderEnabled, setMoodReminderEnabled] = useState(false);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (success) {
        // Schedule default mood reminder
        const [hours, minutes] = moodReminderTime.split(':').map(Number);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);
        await scheduleMoodReminder(tomorrow);
      }
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast.success('Test notification sent!');
    } else {
      toast.error('Failed to send test notification');
    }
  };

  const handleMoodReminderToggle = async (enabled: boolean) => {
    setMoodReminderEnabled(enabled);
    if (enabled && isSubscribed) {
      const [hours, minutes] = moodReminderTime.split(':').map(Number);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hours, minutes, 0, 0);
      await scheduleMoodReminder(tomorrow);
      toast.success('Mood reminder scheduled');
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get reminders for mood check-ins and counseling session alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied' 
                  ? 'Notifications are blocked. Please enable them in your browser settings.'
                  : 'Receive push notifications for reminders and alerts'}
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggleNotifications}
              disabled={loading || permission === 'denied'}
            />
          </div>

          {isSubscribed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Mood Check-in Reminders */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Daily Mood Check-in</Label>
                  </div>
                  <Switch
                    checked={moodReminderEnabled}
                    onCheckedChange={handleMoodReminderToggle}
                  />
                </div>
                
                {moodReminderEnabled && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-muted-foreground">Remind me at:</Label>
                    <Select value={moodReminderTime} onValueChange={setMoodReminderTime}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">7:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="20:00">8:00 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Session Alerts */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Session Alerts</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll automatically receive reminders 15 minutes before your scheduled counseling sessions.
                </p>
              </div>

              {/* Test Notification */}
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={loading}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
