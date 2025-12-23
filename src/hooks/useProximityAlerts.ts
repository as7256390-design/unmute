import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  type: string;
  category: string;
  address: string;
  distance: number;
  lat: number;
  lon: number;
}

interface ProximitySettings {
  enabled: boolean;
  alertRadius: number; // in meters
  alertedLocations: string[]; // IDs of locations we've already alerted about
  lastAlertTime: number;
  minAlertInterval: number; // minimum time between alerts in ms
}

const SETTINGS_KEY = 'proximity_alert_settings';
const DEFAULT_ALERT_RADIUS = 500; // 500 meters
const MIN_ALERT_INTERVAL = 5 * 60 * 1000; // 5 minutes between alerts

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useProximityAlerts() {
  const [settings, setSettings] = useState<ProximitySettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading proximity settings:', e);
    }
    return {
      enabled: false,
      alertRadius: DEFAULT_ALERT_RADIUS,
      alertedLocations: [],
      lastAlertTime: 0,
      minAlertInterval: MIN_ALERT_INTERVAL,
    };
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const watchIdRef = useRef<number | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving proximity settings:', e);
    }
  }, [settings]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission as 'granted' | 'denied' | 'prompt');
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermissionStatus('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notification permission was denied. Please enable it in browser settings.');
      setPermissionStatus('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission as 'granted' | 'denied' | 'prompt');
    return permission === 'granted';
  }, []);

  const sendProximityNotification = useCallback((location: Location, distance: number) => {
    if (Notification.permission !== 'granted') return;

    const distanceText = distance < 1000 
      ? `${Math.round(distance)}m away` 
      : `${(distance / 1000).toFixed(1)}km away`;

    const notification = new Notification(`${location.type} Nearby`, {
      body: `${location.name} is ${distanceText}. Tap to get directions.`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `proximity-${location.id}`,
      data: { location },
      requireInteraction: true,
    });

    notification.onclick = () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
      window.open(url, '_blank');
      notification.close();
    };
  }, []);

  const checkProximity = useCallback((position: GeolocationPosition) => {
    try {
      // Get cached emergency locations
      const cachedData = localStorage.getItem('emergency_locations_cache');
      if (!cachedData) return;

      const { locations } = JSON.parse(cachedData) as { locations: Location[] };
      if (!locations || locations.length === 0) return;

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const now = Date.now();

      // Check if enough time has passed since last alert
      if (now - settings.lastAlertTime < settings.minAlertInterval) return;

      // Find nearby locations we haven't alerted about
      const nearbyLocations = locations.filter(loc => {
        if (settings.alertedLocations.includes(loc.id)) return false;
        
        const distance = haversineDistance(userLat, userLon, loc.lat, loc.lon);
        return distance <= settings.alertRadius;
      });

      if (nearbyLocations.length > 0) {
        // Alert about the closest one
        const closest = nearbyLocations.reduce((prev, curr) => {
          const prevDist = haversineDistance(userLat, userLon, prev.lat, prev.lon);
          const currDist = haversineDistance(userLat, userLon, curr.lat, curr.lon);
          return currDist < prevDist ? curr : prev;
        });

        const distance = haversineDistance(userLat, userLon, closest.lat, closest.lon);
        sendProximityNotification(closest, distance);

        // Update settings
        setSettings(prev => ({
          ...prev,
          alertedLocations: [...prev.alertedLocations, closest.id],
          lastAlertTime: now,
        }));

        console.log(`Proximity alert sent for: ${closest.name} at ${Math.round(distance)}m`);
      }
    } catch (error) {
      console.error('Error checking proximity:', error);
    }
  }, [settings, sendProximityNotification]);

  const startMonitoring = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return false;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      checkProximity,
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          toast.error('Location permission denied');
          stopMonitoring();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 10000,
      }
    );

    setIsMonitoring(true);
    setSettings(prev => ({ ...prev, enabled: true }));
    toast.success('Proximity alerts enabled');
    return true;
  }, [checkProximity, requestNotificationPermission]);

  const stopMonitoring = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsMonitoring(false);
    setSettings(prev => ({ ...prev, enabled: false }));
    toast.info('Proximity alerts disabled');
  }, []);

  const toggleMonitoring = useCallback(async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  const updateAlertRadius = useCallback((radius: number) => {
    setSettings(prev => ({ ...prev, alertRadius: radius }));
  }, []);

  const clearAlertHistory = useCallback(() => {
    setSettings(prev => ({ ...prev, alertedLocations: [], lastAlertTime: 0 }));
    toast.success('Alert history cleared');
  }, []);

  // Auto-start monitoring if it was enabled
  useEffect(() => {
    if (settings.enabled && !isMonitoring) {
      startMonitoring();
    }
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    settings,
    permissionStatus,
    toggleMonitoring,
    startMonitoring,
    stopMonitoring,
    updateAlertRadius,
    clearAlertHistory,
    requestNotificationPermission,
  };
}
