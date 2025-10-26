import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Dialog, DialogTitle, DialogContent, IconButton, Typography, Chip } from '@mui/material';
import { Close, MyLocation, LocationOn } from '@mui/icons-material';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
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

const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds
const FitBounds = ({ pickupCoords, dropCoords, vehicleCoords }) => {
  const map = useMap();

  React.useEffect(() => {
    const coords = [];
    if (pickupCoords) coords.push(pickupCoords);
    if (dropCoords) coords.push(dropCoords);
    if (vehicleCoords) coords.push(vehicleCoords);

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickupCoords, dropCoords, vehicleCoords, map]);

  return null;
};

const OrderTrackingMap = ({ order, open, onClose }) => {
  // Get coordinates from location strings
  const getCoordinates = (location) => {
    if (!location) return null;

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
    
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (locationLower.includes(city)) {
        return coords;
      }
    }

    return null;
  };

  const pickupCoords = getCoordinates(order.pickupLocation?.address || order.pickupLocation);
  const dropCoords = getCoordinates(order.dropLocation?.address || order.dropLocation);
  
  // Simulate vehicle location (midpoint for demo)
  const vehicleCoords = pickupCoords && dropCoords && order.status === 'in-transit' ? [
    (pickupCoords[0] + dropCoords[0]) / 2,
    (pickupCoords[1] + dropCoords[1]) / 2,
  ] : null;

  const defaultCenter = pickupCoords || dropCoords || [20.5937, 78.9629];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Track Order #{order._id.slice(-6)}</Typography>
          <Chip 
            label={order.status === 'in-transit' ? 'In Transit' : order.status === 'delivered' ? 'Delivered' : 'Pending'} 
            color={order.status === 'in-transit' ? 'info' : order.status === 'delivered' ? 'success' : 'warning'}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MyLocation sx={{ color: '#4caf50', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>Pickup:</strong> {order.pickupLocation?.address || order.pickupLocation}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ color: '#f44336', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>Drop:</strong> {order.dropLocation?.address || order.dropLocation}
            </Typography>
          </Box>
          {order.currentLocation && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
              <Typography variant="caption" color="primary">
                📍 Current Location: {order.currentLocation}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ height: 400, width: '100%', borderRadius: 2, overflow: 'hidden', border: '2px solid #e0e0e0' }}>
          <MapContainer
            center={defaultCenter}
            zoom={pickupCoords && dropCoords ? 10 : 5}
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
                  {order.pickupLocation?.address || order.pickupLocation}
                </Popup>
              </Marker>
            )}

            {/* Drop Marker */}
            {dropCoords && (
              <Marker position={dropCoords} icon={dropIcon}>
                <Popup>
                  <strong>📍 Drop Location</strong>
                  <br />
                  {order.dropLocation?.address || order.dropLocation}
                </Popup>
              </Marker>
            )}

            {/* Vehicle Marker (if in transit) */}
            {vehicleCoords && (
              <Marker position={vehicleCoords} icon={vehicleIcon}>
                <Popup>
                  <strong>🚚 Vehicle Location</strong>
                  <br />
                  {order.vehicleType}
                  <br />
                  Status: In Transit
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

            <FitBounds pickupCoords={pickupCoords} dropCoords={dropCoords} vehicleCoords={vehicleCoords} />
          </MapContainer>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Vehicle</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.vehicleType}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Distance</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.distance || 'N/A'} km</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Expected Delivery</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.expectedDeliveryDate}</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingMap;
