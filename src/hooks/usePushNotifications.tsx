import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  loading: boolean;
}

export const usePushNotifications = () => {
  const { user, session } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied',
      loading: false,
    }));
  }, []);

  // Get VAPID public key from edge function
  const getVapidKey = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('push-notifications', {
        method: 'GET',
      });
      
      if (error) throw error;
      return data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID key:', error);
      return null;
    }
  };

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !user || !session) {
      toast.error('Push notifications not available');
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        throw new Error('Failed to get VAPID key');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to backend
      const { error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'subscribe',
          subscription: subscription.toJSON(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isSubscribed: true }));
      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to enable notifications');
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.isSupported, user, session]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user || !session) return false;

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from backend
      const { error } = await supabase.functions.invoke('push-notifications', {
        body: { action: 'unsubscribe' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isSubscribed: false }));
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('Failed to disable notifications');
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, session]);

  // Schedule a mood check-in reminder
  const scheduleMoodReminder = useCallback(async (scheduledFor: Date) => {
    if (!user || !session) return false;

    try {
      const { error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'schedule',
          type: 'mood_reminder',
          title: '🌟 Time for a Check-in',
          body: 'How are you feeling right now? Take a moment to reflect on your mood.',
          scheduledFor: scheduledFor.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to schedule mood reminder:', error);
      return false;
    }
  }, [user, session]);

  // Schedule a counseling session alert
  const scheduleSessionAlert = useCallback(async (sessionTime: Date, counselorName: string) => {
    if (!user || !session) return false;

    try {
      // Schedule reminder 15 minutes before
      const reminderTime = new Date(sessionTime.getTime() - 15 * 60 * 1000);

      const { error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'schedule',
          type: 'session_alert',
          title: '📅 Session Starting Soon',
          body: `Your counseling session with ${counselorName} starts in 15 minutes.`,
          scheduledFor: reminderTime.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to schedule session alert:', error);
      return false;
    }
  }, [user, session]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!user || !session) return false;

    try {
      const { error } = await supabase.functions.invoke('push-notifications', {
        body: { action: 'test' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Also show a local notification for immediate feedback
      if (Notification.permission === 'granted') {
        new Notification('🎉 Notifications Working!', {
          body: 'You will receive mood check-in reminders and session alerts.',
          icon: '/pwa-192x192.png',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }, [user, session]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    scheduleMoodReminder,
    scheduleSessionAlert,
    sendTestNotification,
  };
};
