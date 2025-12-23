import { useState, useEffect, useCallback } from 'react';

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

interface CachedEmergencyData {
  locations: Location[];
  userLocation: { lat: number; lon: number };
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = 'emergency_locations_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useEmergencyCache() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<CachedEmergencyData | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data on mount
  useEffect(() => {
    const cached = getCachedData();
    if (cached) {
      setCachedData(cached);
    }
  }, []);

  const getCachedData = useCallback((): CachedEmergencyData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedEmergencyData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading emergency cache:', error);
      return null;
    }
  }, []);

  const saveToCache = useCallback((locations: Location[], userLocation: { lat: number; lon: number }) => {
    try {
      const cacheData: CachedEmergencyData = {
        locations,
        userLocation,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedData(cacheData);
      
      console.log('Emergency locations cached successfully');
    } catch (error) {
      console.error('Error saving emergency cache:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedData(null);
    } catch (error) {
      console.error('Error clearing emergency cache:', error);
    }
  }, []);

  const getCacheAge = useCallback((): string | null => {
    if (!cachedData) return null;

    const ageMs = Date.now() - cachedData.timestamp;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  }, [cachedData]);

  return {
    isOnline,
    cachedData,
    getCachedData,
    saveToCache,
    clearCache,
    getCacheAge,
    hasCachedData: !!cachedData,
  };
}
