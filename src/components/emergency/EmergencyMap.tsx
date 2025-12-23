import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

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

interface EmergencyMapProps {
  locations: Location[];
  userLocation: { lat: number; lon: number } | null;
}

// Custom marker icons
const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const typeIcons: Record<string, { color: string; emoji: string }> = {
  Hospital: { color: '#ef4444', emoji: '🏥' },
  Clinic: { color: '#f97316', emoji: '🩺' },
  Doctor: { color: '#f97316', emoji: '👨‍⚕️' },
  Pharmacy: { color: '#22c55e', emoji: '💊' },
  'Police Station': { color: '#3b82f6', emoji: '🚔' },
  'Fire Station': { color: '#dc2626', emoji: '🚒' },
  'Ambulance Station': { color: '#ef4444', emoji: '🚑' },
};

// Component to recenter map when locations change
function MapController({ userLocation, locations }: { userLocation: { lat: number; lon: number } | null; locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        ...locations.map(loc => [loc.lat, loc.lon] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 14);
    }
  }, [userLocation, locations, map]);

  return null;
}

export function EmergencyMap({ locations, userLocation }: EmergencyMapProps) {
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [20.5937, 78.9629]; // Default to India center

  const getDirections = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController userLocation={userLocation} locations={locations} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Location markers */}
        {locations.map((location) => {
          const iconConfig = typeIcons[location.type] || { color: '#6b7280', emoji: '📍' };
          const icon = createIcon(iconConfig.color, iconConfig.emoji);

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lon]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-1">{location.name}</h3>
                  <p className="text-xs text-gray-600 mb-1">{location.type}</p>
                  <p className="text-xs text-gray-500 mb-2">{location.address}</p>
                  <p className="text-xs font-medium text-blue-600 mb-2">
                    {location.distance} km away
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-1.5 text-xs h-7"
                    onClick={() => getDirections(location)}
                  >
                    <Navigation className="h-3 w-3" />
                    Get Directions
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
