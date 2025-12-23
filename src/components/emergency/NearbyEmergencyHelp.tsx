import React, { useState, useEffect } from 'react';
import { MapPin, Hospital, Building2, Pill, Shield, Loader2, Navigation, AlertTriangle, Map, List, WifiOff, RefreshCw, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EmergencyMap } from './EmergencyMap';
import { useEmergencyCache } from '@/hooks/useEmergencyCache';

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

const categoryIcons: Record<string, React.ReactNode> = {
  Hospital: <Hospital className="h-5 w-5" />,
  Clinic: <Building2 className="h-5 w-5" />,
  Doctor: <Building2 className="h-5 w-5" />,
  Pharmacy: <Pill className="h-5 w-5" />,
  'Police Station': <Shield className="h-5 w-5" />,
  'Fire Station': <AlertTriangle className="h-5 w-5" />,
  'Ambulance Station': <Hospital className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  medical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  emergency: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export function NearbyEmergencyHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('map');
  const [isUsingCache, setIsUsingCache] = useState(false);

  const { isOnline, cachedData, saveToCache, getCacheAge, hasCachedData } = useEmergencyCache();

  // Load cached data when offline or on error
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

    // If offline, immediately load from cache
    if (!isOnline) {
      if (hasCachedData) {
        loadFromCache();
        setLoading(false);
        return;
      } else {
        setError('You are offline and no cached data is available. Connect to the internet to fetch nearby locations.');
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
      console.log('User location:', latitude, longitude);
      setUserLocation({ lat: latitude, lon: longitude });

      const { data, error: fnError } = await supabase.functions.invoke('nearby-emergency', {
        body: { latitude, longitude, radius: 5000 },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch nearby locations');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const fetchedLocations = data?.locations || [];
      setLocations(fetchedLocations);
      
      // Save to cache for offline use
      if (fetchedLocations.length > 0) {
        saveToCache(fetchedLocations, { lat: latitude, lon: longitude });
      }
      
      if (fetchedLocations.length === 0) {
        toast.info('No emergency or medical services found nearby');
      } else {
        toast.success(`Found ${fetchedLocations.length} nearby locations (cached for offline use)`);
      }

    } catch (err: any) {
      console.error('Error fetching nearby locations:', err);
      
      let errorMessage = 'Failed to fetch nearby locations';
      
      if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // If fetch fails and we have cached data, offer to use it
      if (hasCachedData) {
        loadFromCache();
        toast.warning('Using cached data due to network error');
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (location: Location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  const getDirections = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  const groupedLocations = locations.reduce((acc, loc) => {
    if (!acc[loc.category]) {
      acc[loc.category] = [];
    }
    acc[loc.category].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-red-500" />
              Nearby Emergency & Medical Help
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4">
            {/* Offline / Cache Status Banner */}
            {!isOnline && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
                <WifiOff className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  You are currently offline. {hasCachedData ? 'Showing cached emergency locations.' : 'No cached data available.'}
                </AlertDescription>
              </Alert>
            )}

            {isUsingCache && isOnline && (
              <Alert className="mb-4 border-blue-500/50 bg-blue-50 dark:bg-blue-900/20">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200 flex items-center justify-between">
                  <span>Showing cached data from {getCacheAge()}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-7"
                    onClick={fetchNearbyLocations}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Finding nearby services...</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
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
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <MapPin className="h-10 w-10 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No nearby services found within 5km radius
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="map" className="gap-2">
                    <Map className="h-4 w-4" />
                    Map View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="mt-0">
                  <EmergencyMap locations={locations} userLocation={userLocation} />
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Hospital
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      Clinic/Doctor
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Pharmacy
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      Police
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <ScrollArea className="h-[50vh] pr-4">
                    <div className="space-y-6">
                      {Object.entries(groupedLocations).map(([category, locs]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            {category === 'medical' ? '🏥 Medical Services' : '🚨 Emergency Services'}
                            <span className="ml-2 text-xs font-normal">({locs.length})</span>
                          </h3>
                          <div className="space-y-3">
                            {locs.map((location) => (
                              <Card key={location.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className={`p-2 rounded-lg ${categoryColors[location.category]}`}>
                                        {categoryIcons[location.type] || <Building2 className="h-5 w-5" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{location.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="secondary" className="text-xs">
                                            {location.type}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {location.distance} km away
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                          {location.address}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() => openInMaps(location)}
                                      >
                                        <MapPin className="h-3.5 w-3.5" />
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="gap-1.5"
                                        onClick={() => getDirections(location)}
                                      >
                                        <Navigation className="h-3.5 w-3.5" />
                                        Go
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
