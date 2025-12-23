import React, { useState } from 'react';
import { MapPin, Loader2, AlertTriangle, WifiOff, RefreshCw, Clock, Database, X, List, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmergencyMap } from './EmergencyMap';
import { useEmergencyCache } from '@/hooks/useEmergencyCache';
import { motion, AnimatePresence } from 'framer-motion';

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

export function NearbyEmergencyHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { isOnline, cachedData, saveToCache, getCacheAge, hasCachedData } = useEmergencyCache();

  const loadFromCache = () => {
    if (cachedData) {
      setLocations(cachedData.locations);
      setUserLocation(cachedData.userLocation);
      setIsUsingCache(true);
      toast.info('Showing cached emergency locations');
    }
  };

  const fetchNearbyLocations = async () => {
    setLoading(true);
    setError(null);
    setLocations([]);
    setUserLocation(null);
    setIsUsingCache(false);
    setIsOpen(true);

    if (!isOnline) {
      if (hasCachedData) {
        loadFromCache();
        setLoading(false);
        return;
      } else {
        setError('You are offline and no cached data is available.');
        setLoading(false);
        return;
      }
    }

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lon: longitude });

      const { data, error: fnError } = await supabase.functions.invoke('nearby-emergency', {
        body: { latitude, longitude, radius: 5000 },
      });

      if (fnError) throw new Error(fnError.message || 'Failed to fetch nearby locations');
      if (data?.error) throw new Error(data.error);

      const fetchedLocations = data?.locations || [];
      setLocations(fetchedLocations);
      
      if (fetchedLocations.length > 0) {
        saveToCache(fetchedLocations, { lat: latitude, lon: longitude });
        toast.success(`Found ${fetchedLocations.length} nearby locations`);
      } else {
        toast.info('No emergency services found nearby');
      }

    } catch (err: any) {
      console.error('Error fetching nearby locations:', err);
      
      let errorMessage = 'Failed to fetch nearby locations';
      if (err?.code === 1) errorMessage = 'Location permission denied. Please enable location access.';
      else if (err?.code === 2) errorMessage = 'Location unavailable.';
      else if (err?.code === 3) errorMessage = 'Location request timed out.';
      else if (err?.message) errorMessage = err.message;
      
      if (hasCachedData) {
        loadFromCache();
        toast.warning('Using cached data');
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDirections = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  const closeMap = () => {
    setIsOpen(false);
    setShowList(false);
    setSelectedLocation(null);
  };

  return (
    <>
      <Button
        onClick={fetchNearbyLocations}
        variant="outline"
        size="sm"
        className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : !isOnline && hasCachedData ? (
          <Database className="h-4 w-4" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {!isOnline && hasCachedData ? 'Cached Help' : 'Nearby Help'}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={closeMap}>
                    <X className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="font-semibold">Nearby Emergency Help</h1>
                    {locations.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {locations.length} locations found
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOnline && !loading && (
                    <Button variant="ghost" size="icon" onClick={fetchNearbyLocations}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  {locations.length > 0 && (
                    <Button
                      variant={showList ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowList(!showList)}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                      List
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Banners */}
              {!isOnline && (
                <Alert className="mx-4 mb-2 border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
                  <WifiOff className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Offline - showing cached locations
                  </AlertDescription>
                </Alert>
              )}
              {isUsingCache && isOnline && (
                <Alert className="mx-4 mb-2 border-blue-500/50 bg-blue-50 dark:bg-blue-900/20">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Cached data from {getCacheAge()}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Map Content */}
            <div className="absolute inset-0 pt-16">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Finding nearby services...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                  <p className="text-center text-muted-foreground">{error}</p>
                  <div className="flex gap-2">
                    {hasCachedData && (
                      <Button onClick={loadFromCache} variant="outline" className="gap-2">
                        <Database className="h-4 w-4" />
                        Use Cached Data
                      </Button>
                    )}
                    {isOnline && (
                      <Button onClick={fetchNearbyLocations} variant="outline">
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!loading && !error && locations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    No nearby services found within 5km
                  </p>
                  {hasCachedData && (
                    <Button onClick={loadFromCache} variant="outline" className="gap-2">
                      <Database className="h-4 w-4" />
                      View Cached Locations
                    </Button>
                  )}
                </div>
              )}

              {!loading && !error && locations.length > 0 && (
                <>
                  {/* Full Screen Map */}
                  <div className="h-full">
                    <EmergencyMap 
                      locations={locations} 
                      userLocation={userLocation}
                      onLocationSelect={setSelectedLocation}
                      fullScreen
                    />
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        Hospital
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        Pharmacy
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Police
                      </Badge>
                    </div>
                  </div>

                  {/* Slide-up List Panel */}
                  <AnimatePresence>
                    {showList && (
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl border-t max-h-[60vh]"
                      >
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-3" />
                        <ScrollArea className="h-[calc(60vh-2rem)] px-4 pb-4">
                          <div className="space-y-3">
                            {locations.map((location) => (
                              <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{location.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">{location.type}</Badge>
                                    <span className="text-xs text-muted-foreground">{location.distance} km</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => getDirections(location)}
                                  className="gap-1.5 shrink-0 ml-2"
                                >
                                  <Navigation className="h-3.5 w-3.5" />
                                  Go
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected Location Card */}
                  <AnimatePresence>
                    {selectedLocation && !showList && (
                      <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-4 left-4 right-4 bg-background rounded-xl shadow-2xl border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{selectedLocation.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{selectedLocation.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge>{selectedLocation.type}</Badge>
                              <span className="text-sm text-muted-foreground">{selectedLocation.distance} km away</span>
                            </div>
                          </div>
                          <Button onClick={() => getDirections(selectedLocation)} className="gap-2 shrink-0">
                            <Navigation className="h-4 w-4" />
                            Directions
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => setSelectedLocation(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
