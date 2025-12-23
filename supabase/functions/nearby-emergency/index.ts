import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCategoryLabel(amenity: string): { type: string; category: string } {
  const mapping: Record<string, { type: string; category: string }> = {
    hospital: { type: 'Hospital', category: 'medical' },
    clinic: { type: 'Clinic', category: 'medical' },
    doctors: { type: 'Doctor', category: 'medical' },
    pharmacy: { type: 'Pharmacy', category: 'medical' },
    police: { type: 'Police Station', category: 'emergency' },
    fire_station: { type: 'Fire Station', category: 'emergency' },
    ambulance_station: { type: 'Ambulance Station', category: 'emergency' },
  };
  return mapping[amenity] || { type: amenity, category: 'other' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json();

    console.log(`Fetching nearby emergency locations for: ${latitude}, ${longitude}, radius: ${radius}m`);

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Overpass API query for nearby emergency and medical services
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        node["amenity"="clinic"](around:${radius},${latitude},${longitude});
        node["amenity"="doctors"](around:${radius},${latitude},${longitude});
        node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
        node["amenity"="police"](around:${radius},${latitude},${longitude});
        node["amenity"="fire_station"](around:${radius},${latitude},${longitude});
        node["amenity"="ambulance_station"](around:${radius},${latitude},${longitude});
        way["amenity"="hospital"](around:${radius},${latitude},${longitude});
        way["amenity"="clinic"](around:${radius},${latitude},${longitude});
        way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
        way["amenity"="police"](around:${radius},${latitude},${longitude});
      );
      out center;
    `;

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    console.log('Sending request to Overpass API...');
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status, response.statusText);
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.elements?.length || 0} locations`);

    const locations: Location[] = (data.elements || [])
      .filter((el: any) => el.tags?.name || el.tags?.amenity)
      .map((el: any) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const { type, category } = getCategoryLabel(el.tags.amenity);
        
        // Build address from available tags
        const addressParts = [
          el.tags['addr:street'],
          el.tags['addr:housenumber'],
          el.tags['addr:city'],
          el.tags['addr:postcode'],
        ].filter(Boolean);
        
        const address = addressParts.length > 0 
          ? addressParts.join(', ') 
          : el.tags.address || 'Address not available';

        return {
          id: String(el.id),
          name: el.tags.name || `${type} (Unnamed)`,
          type,
          category,
          address,
          distance: Math.round(haversineDistance(latitude, longitude, lat, lon) * 100) / 100,
          lat,
          lon,
        };
      })
      .sort((a: Location, b: Location) => a.distance - b.distance);

    console.log(`Returning ${locations.length} processed locations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        locations,
        total: locations.length,
        searchRadius: radius,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in nearby-emergency function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch nearby locations', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
