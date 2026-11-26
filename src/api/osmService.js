import axios from 'axios';
import { API_BASE } from '../lib/api';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export const searchCity = async (cityName) => {
  const query = cityName.trim();
  if (query.length < 2 || query.length > 200) throw new Error('Enter a city name between 2 and 200 characters.');
  try {
    const response = await axios.get(API_BASE + '/osm/cities', { params: { query }, timeout: 45000 });
    return response.data;
  } catch {
    throw new Error('City lookup could not reach the geocoder. Try the city name followed by its state or country.');
  }
};

export const fetchAmenities = async (lat, lon, amenities, radius, polygon = null) => {
  try {
    const { data } = await axios.post(API_BASE + '/osm/amenities', {
      lat, lon, amenities: Array.isArray(amenities) ? amenities : [amenities], radius, polygon,
    });
    return data.elements;
  } catch (error) {
    const query = error.response?.data?.detail?.overpass_query;
    if (error.response?.status !== 502 || typeof query !== 'string') throw error;
    const endpoint = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
    const response = query.length > 1500
      ? await axios.post(endpoint, new URLSearchParams({ data: query }), { timeout: 15000 })
      : await axios.get(endpoint, { params: { data: query }, timeout: 15000 });
    if (response.data?.remark || !Array.isArray(response.data?.elements)) throw error;
    return response.data.elements;
  }
};

// Fetch route from User -> Destination using OSRM (Open Source Routing Machine)
export const fetchRoute = async (startLat, startLon, endLat, endLon, mode = 'driving') => {
  // mode can be 'driving', 'walking', 'cycling'
  try {
    const url = `${OSRM_BASE_URL}/${mode}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);
    
    if (response.data.routes && response.data.routes.length > 0) {
      // Returns GeoJSON coordinates of the path [ [lon, lat], ... ]
      const coordinates = response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // Swap to [lat, lon]
      return { 
        coordinates, 
        distance: response.data.routes[0].distance, // Meters
        duration: response.data.routes[0].duration  // Seconds
      };
    }
    return null;
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
};
