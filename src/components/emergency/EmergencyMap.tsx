import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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
  onLocationSelect?: (location: Location | null) => void;
  fullScreen?: boolean;
}

const createIcon = (color: string, emoji: string, isSelected?: boolean) => {
  const size = isSelected ? 44 : 36;
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: ${isSelected ? 20 : 16}px;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: all 0.2s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 3px #3b82f6, 0 2px 12px rgba(59, 130, 246, 0.5);
      animation: pulse 2s ease-in-out infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 3px #3b82f6, 0 2px 12px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3), 0 2px 20px rgba(59, 130, 246, 0.4); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

function MapController({ userLocation, locations }: { userLocation: { lat: number; lon: number } | null; locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        ...locations.map(loc => [loc.lat, loc.lon] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 15);
    }
  }, [userLocation, locations, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

export function EmergencyMap({ locations, userLocation, onLocationSelect, fullScreen }: EmergencyMapProps) {
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [20.5937, 78.9629];

  const getDirections = (location: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`;
    window.open(url, '_blank');
  };

  const handleMarkerClick = (location: Location) => {
    onLocationSelect?.(location);
  };

  return (
    <div className={`w-full rounded-lg overflow-hidden ${fullScreen ? 'h-full' : 'h-[400px] border border-border'}`}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={!fullScreen}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController userLocation={userLocation} locations={locations} />
        <MapClickHandler onMapClick={() => onLocationSelect?.(null)} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
            <Popup>
              <div className="text-center font-medium">
                📍 You are here
              </div>
            </Popup>
          </Marker>
        )}

        {locations.map((location) => {
          const iconConfig = typeIcons[location.type] || { color: '#6b7280', emoji: '📍' };
          const icon = createIcon(iconConfig.color, iconConfig.emoji);

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lon]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(location),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
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
