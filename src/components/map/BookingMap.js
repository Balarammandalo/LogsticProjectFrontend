import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for pickup and drop
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds to markers
const FitBounds = ({ pickupCoords, dropCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && dropCoords) {
      const bounds = L.latLngBounds([pickupCoords, dropCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickupCoords) {
      map.setView(pickupCoords, 13);
    } else if (dropCoords) {
      map.setView(dropCoords, 13);
    }
  }, [pickupCoords, dropCoords, map]);

  return null;
};

const BookingMap = ({ pickupLocation, dropLocation, height = 400 }) => {
  // Default center (India)
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  // Get coordinates from location strings
  const getCoordinates = (location) => {
    if (!location) return null;

    // Major Indian cities coordinates
    const cityCoordinates = {
      'mumbai': [19.0760, 72.8777],
      'delhi': [28.7041, 77.1025],
      'bangalore': [12.9716, 77.5946],
      'bengaluru': [12.9716, 77.5946],
      'hyderabad': [17.3850, 78.4867],
      'chennai': [13.0827, 80.2707],
      'kolkata': [22.5726, 88.3639],
      'pune': [18.5204, 73.8567],
      'ahmedabad': [23.0225, 72.5714],
      'surat': [21.1702, 72.8311],
      'jaipur': [26.9124, 75.7873],
      'lucknow': [26.8467, 80.9462],
      'kanpur': [26.4499, 80.3319],
      'nagpur': [21.1458, 79.0882],
      'visakhapatnam': [17.6868, 83.2185],
      'indore': [22.7196, 75.8577],
      'thane': [19.2183, 72.9781],
      'bhopal': [23.2599, 77.4126],
      'patna': [25.5941, 85.1376],
      'vadodara': [22.3072, 73.1812],
      'ghaziabad': [28.6692, 77.4538],
      'ludhiana': [30.9010, 75.8573],
      'agra': [27.1767, 78.0081],
      'nashik': [19.9975, 73.7898],
      'faridabad': [28.4089, 77.3178],
      'meerut': [28.9845, 77.7064],
      'rajkot': [22.3039, 70.8022],
      'varanasi': [25.3176, 82.9739],
      'srinagar': [34.0837, 74.7973],
      'amritsar': [31.6340, 74.8723],
      'chandigarh': [30.7333, 76.7794],
      'coimbatore': [11.0168, 76.9558],
      'kochi': [9.9312, 76.2673],
      'guwahati': [26.1445, 91.7362],
    };

    const locationLower = location.toLowerCase();
    
    // Check if location matches any city
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (locationLower.includes(city)) {
        return coords;
      }
    }

    return null;
  };

  const pickupCoords = getCoordinates(pickupLocation);
  const dropCoords = getCoordinates(dropLocation);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance);
  };

  const distance = calculateDistance(pickupCoords, dropCoords);

  return (
    <Box sx={{ height, width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid #e0e0e0' }}>
      <MapContainer
        center={pickupCoords || dropCoords || defaultCenter}
        zoom={pickupCoords && dropCoords ? 10 : defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <strong>🎯 Pickup Location</strong>
              <br />
              {pickupLocation}
            </Popup>
          </Marker>
        )}

        {/* Drop Marker */}
        {dropCoords && (
          <Marker position={dropCoords} icon={dropIcon}>
            <Popup>
              <strong>📍 Drop Location</strong>
              <br />
              {dropLocation}
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {pickupCoords && dropCoords && (
          <Polyline
            positions={[pickupCoords, dropCoords]}
            color="#667eea"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* Fit bounds to show both markers */}
        <FitBounds pickupCoords={pickupCoords} dropCoords={dropCoords} />
      </MapContainer>

      {/* Distance Info */}
      {distance > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ fontSize: '1.2rem' }}>📏</Box>
            <Box>
              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Estimated Distance</Box>
              <Box sx={{ fontSize: '1rem', fontWeight: 700, color: '#667eea' }}>{distance} km</Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BookingMap;
