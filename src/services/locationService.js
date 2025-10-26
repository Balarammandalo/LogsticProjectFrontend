// Location service using OpenStreetMap Nominatim API (free, no API key needed)

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Debounce function to limit API calls
let searchTimeout = null;

/**
 * Search for locations using Nominatim API
 * @param {string} query - Search query
 * @param {string} countryCode - Country code (default: 'in' for India)
 * @returns {Promise<Array>} - Array of location suggestions
 */
export const searchLocations = async (query, countryCode = 'in') => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?` +
      `q=${encodeURIComponent(query)}` +
      `&countrycodes=${countryCode}` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=10` +
      `&accept-language=en`,
      {
        headers: {
          'User-Agent': 'TrackMate-Logistics-App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Location search failed');
    }

    const data = await response.json();

    // Format results for display
    return data.map((item) => ({
      displayName: item.display_name,
      name: item.name,
      city: item.address?.city || item.address?.town || item.address?.village || item.name,
      state: item.address?.state || '',
      district: item.address?.state_district || '',
      country: item.address?.country || 'India',
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      fullAddress: formatAddress(item.address),
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

/**
 * Search with debounce to avoid too many API calls
 * @param {string} query - Search query
 * @param {Function} callback - Callback function with results
 * @param {number} delay - Debounce delay in ms (default: 300)
 */
export const searchLocationsDebounced = (query, callback, delay = 300) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    const results = await searchLocations(query);
    callback(results);
  }, delay);
};

/**
 * Format address for display
 * @param {Object} address - Address object from Nominatim
 * @returns {string} - Formatted address
 */
const formatAddress = (address) => {
  if (!address) return '';

  const parts = [];

  if (address.road) parts.push(address.road);
  if (address.suburb) parts.push(address.suburb);
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  if (address.state_district && address.state_district !== address.city) {
    parts.push(address.state_district);
  }
  if (address.state) parts.push(address.state);

  return parts.join(', ');
};

/**
 * Get coordinates for a location name
 * @param {string} locationName - Location name
 * @returns {Promise<Object>} - Coordinates {lat, lon}
 */
export const getCoordinates = async (locationName) => {
  try {
    const results = await searchLocations(locationName);
    if (results.length > 0) {
      return {
        lat: results[0].lat,
        lon: results[0].lon,
      };
    }
    return null;
  } catch (error) {
    console.error('Get coordinates error:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - {lat, lon}
 * @param {Object} coord2 - {lat, lon}
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} - Address string
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?` +
      `lat=${lat}` +
      `&lon=${lon}` +
      `&format=json` +
      `&addressdetails=1` +
      `&accept-language=en`,
      {
        headers: {
          'User-Agent': 'TrackMate-Logistics-App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data.display_name || '';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '';
  }
};

export default {
  searchLocations,
  searchLocationsDebounced,
  getCoordinates,
  calculateDistance,
  reverseGeocode,
};
