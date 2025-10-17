import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useAuth } from '../../services/AuthContext';
import { deliveryAPI } from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Chip,
  Button,
  Fade,
} from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import L from 'leaflet';

// Component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RouteMap = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]); // Hyderabad
  const [mapZoom, setMapZoom] = useState(12);

  // Default center - Hyderabad
  const defaultCenter = [17.3850, 78.4867];
  
  // Get delivery ID from URL parameter
  const urlParams = new URLSearchParams(location.search);
  const deliveryIdFromUrl = urlParams.get('delivery');

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    if (selectedDelivery) {
      loadRouteDetails(selectedDelivery);
    } else {
      setRouteDetails(null);
    }
  }, [selectedDelivery]);

  const loadDeliveries = async () => {
    try {
      // Dummy delivery data matching customer dashboard
      const dummyDeliveries = [
        {
          _id: 'ord001',
          status: 'on-route',
          pickupLocation: { 
            address: 'Madhapur, Hyderabad, Telangana 500081',
            coordinates: { latitude: 17.4485, longitude: 78.3908 }
          },
          dropLocation: { 
            address: 'Banjara Hills, Hyderabad, Telangana 500034',
            coordinates: { latitude: 17.4239, longitude: 78.4738 }
          },
          packageDetails: 'Electronics - Laptop (2kg)',
          driver: { name: 'Rajesh Kumar' },
          vehicle: { vehicleNumber: 'TS-09-AB-1234' },
          createdAt: new Date('2025-01-16T09:30:00'),
        },
        {
          _id: 'ord004',
          status: 'on-route',
          pickupLocation: { 
            address: 'Secunderabad, Hyderabad, Telangana 500003',
            coordinates: { latitude: 17.4399, longitude: 78.4983 }
          },
          dropLocation: { 
            address: 'Jubilee Hills, Hyderabad, Telangana 500033',
            coordinates: { latitude: 17.4326, longitude: 78.4071 }
          },
          packageDetails: 'Food Items - Groceries (5kg)',
          driver: { name: 'Amit Singh' },
          vehicle: { vehicleNumber: 'TS-09-EF-9012' },
          createdAt: new Date('2025-01-16T07:15:00'),
        },
        {
          _id: 'ord009',
          status: 'picked-up',
          pickupLocation: { 
            address: 'Banjara Hills, Hyderabad, Telangana 500034',
            coordinates: { latitude: 17.4239, longitude: 78.4738 }
          },
          dropLocation: { 
            address: 'Gachibowli, Hyderabad, Telangana 500032',
            coordinates: { latitude: 17.4399, longitude: 78.3489 }
          },
          packageDetails: 'Gifts - Party Items (3kg)',
          driver: { name: 'John Smith' },
          vehicle: { vehicleNumber: 'TS-09-MN-6789' },
          createdAt: new Date('2025-01-16T10:00:00'),
        },
      ];

      setDeliveries(dummyDeliveries);

      // Auto-select from URL or first active delivery
      if (deliveryIdFromUrl) {
        const delivery = dummyDeliveries.find(d => d._id === deliveryIdFromUrl);
        if (delivery) {
          setSelectedDelivery(deliveryIdFromUrl);
          // Zoom to delivery location
          if (delivery.pickupLocation?.coordinates) {
            setMapCenter([
              delivery.pickupLocation.coordinates.latitude,
              delivery.pickupLocation.coordinates.longitude
            ]);
            setMapZoom(13);
          }
        }
      } else {
        // Auto-select the first active delivery
        const activeDelivery = dummyDeliveries.find(d =>
          d.status === 'on-route' || d.status === 'picked-up'
        );
        if (activeDelivery) {
          setSelectedDelivery(activeDelivery._id);
        }
      }
    } catch (error) {
      setError('Failed to load deliveries');
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteDetails = async (deliveryId) => {
    try {
      const delivery = deliveries.find(d => d._id === deliveryId);
      
      if (!delivery) {
        setError('Delivery not found');
        return;
      }

      // Dummy tracking data (simulated vehicle movement)
      const tracking = [];

      setRouteDetails({
        delivery,
        tracking,
      });
    } catch (error) {
      setError('Failed to load route details');
      console.error('Error loading route details:', error);
    }
  };

  const getRouteCoordinates = () => {
    if (!routeDetails?.delivery) return null;

    const { delivery } = routeDetails;
    const coordinates = [];

    // Add pickup location
    if (delivery.pickupLocation?.coordinates) {
      coordinates.push([
        delivery.pickupLocation.coordinates.latitude,
        delivery.pickupLocation.coordinates.longitude,
      ]);
    }

    // Add tracking points (sorted by timestamp)
    const sortedTracking = routeDetails.tracking
      .filter(t => t.location)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    sortedTracking.forEach(track => {
      coordinates.push([track.location.latitude, track.location.longitude]);
    });

    // Add drop location
    if (delivery.dropLocation?.coordinates) {
      coordinates.push([
        delivery.dropLocation.coordinates.latitude,
        delivery.dropLocation.coordinates.longitude,
      ]);
    }

    return coordinates.length >= 2 ? coordinates : null;
  };

  const getMapCenter = () => {
    const coordinates = getRouteCoordinates();
    if (coordinates && coordinates.length > 0) {
      // Calculate center of all coordinates
      const lats = coordinates.map(coord => coord[0]);
      const lngs = coordinates.map(coord => coord[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      return [centerLat, centerLng];
    }
    return defaultCenter;
  };

  const getMapBounds = () => {
    const coordinates = getRouteCoordinates();
    if (coordinates && coordinates.length > 1) {
      return coordinates;
    }
    return null;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading route map...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              📍 Live Delivery Tracking
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/user"
              startIcon={<ArrowBack />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Back
            </Button>
          </Paper>
        </Fade>

        {deliveryIdFromUrl && selectedDelivery && routeDetails && (
          <Fade in={true}>
            <Paper
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid #667eea',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea', mb: 1 }}>
                    🚚 Tracking Order #{deliveryIdFromUrl.slice(-3)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>From:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {routeDetails.delivery.pickupLocation?.address}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>To:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {routeDetails.delivery.dropLocation?.address}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`Status: ${routeDetails.delivery.status}`}
                      size="small"
                      color={
                        routeDetails.delivery.status === 'on-route' ? 'success' :
                        routeDetails.delivery.status === 'picked-up' ? 'warning' : 'default'
                      }
                    />
                    {routeDetails.delivery.driver && (
                      <Chip
                        label={`Driver: ${routeDetails.delivery.driver.name}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {routeDetails.delivery.vehicle && (
                      <Chip
                        label={`Vehicle: ${routeDetails.delivery.vehicle.vehicleNumber}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Fade>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

      {/* Delivery Selector */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="delivery-select-label">Select Delivery to Track</InputLabel>
          <Select
            labelId="delivery-select-label"
            id="delivery-select"
            value={selectedDelivery}
            label="Select Delivery to Track"
            onChange={(e) => setSelectedDelivery(e.target.value)}
          >
            <MenuItem value="">
              <em>Select a delivery</em>
            </MenuItem>
            {deliveries
              .filter(d => d.status !== 'pending' && d.status !== 'cancelled')
              .map((delivery) => (
                <MenuItem key={delivery._id} value={delivery._id}>
                  Delivery #{delivery._id.slice(-8)} - {delivery.status} - {delivery.dropLocation?.address || 'N/A'}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Route Details */}
      {routeDetails && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Route Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Status: ${routeDetails.delivery.status}`}
              color={
                routeDetails.delivery.status === 'delivered' ? 'success' :
                routeDetails.delivery.status === 'on-route' ? 'primary' :
                routeDetails.delivery.status === 'picked-up' ? 'warning' : 'default'
              }
            />
            <Chip
              label={`Tracking Points: ${routeDetails.tracking.length}`}
              variant="outlined"
            />
            {routeDetails.delivery.vehicle && (
              <Chip
                label={`Vehicle: ${routeDetails.delivery.vehicle.vehicleNumber}`}
                variant="outlined"
              />
            )}
            {routeDetails.delivery.driver && (
              <Chip
                label={`Driver: ${routeDetails.delivery.driver.name}`}
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Map */}
      <Fade in={true} timeout={900}>
        <Paper sx={{ height: '600px', p: 0, overflow: 'hidden', mb: 2, borderRadius: 3 }}>
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

          {/* Route Polyline */}
          {getRouteCoordinates() && (
            <Polyline
              positions={getRouteCoordinates()}
              color={routeDetails.delivery.status === 'delivered' ? 'green' : 'blue'}
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Pickup Location */}
          {routeDetails?.delivery?.pickupLocation?.coordinates && (
            <Marker
              position={[
                routeDetails.delivery.pickupLocation.coordinates.latitude,
                routeDetails.delivery.pickupLocation.coordinates.longitude,
              ]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: orange; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">P</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>
                <Box>
                  <Typography variant="h6">Pickup Location</Typography>
                  <Typography variant="body2">{routeDetails.delivery.pickupLocation.address}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coordinates: {routeDetails.delivery.pickupLocation.coordinates.latitude.toFixed(4)}, {routeDetails.delivery.pickupLocation.coordinates.longitude.toFixed(4)}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          )}

          {/* Drop Location */}
          {routeDetails?.delivery?.dropLocation?.coordinates && (
            <Marker
              position={[
                routeDetails.delivery.dropLocation.coordinates.latitude,
                routeDetails.delivery.dropLocation.coordinates.longitude,
              ]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: red; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">D</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup>
                <Box>
                  <Typography variant="h6">Delivery Location</Typography>
                  <Typography variant="body2">{routeDetails.delivery.dropLocation.address}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coordinates: {routeDetails.delivery.dropLocation.coordinates.latitude.toFixed(4)}, {routeDetails.delivery.dropLocation.coordinates.longitude.toFixed(4)}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          )}

          {/* Tracking Points */}
          {routeDetails?.tracking
            .filter(track => track.location)
            .map((track, index) => (
              <Marker
                key={index}
                position={[track.location.latitude, track.location.longitude]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="background-color: blue; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>`,
                  iconSize: [8, 8],
                  iconAnchor: [4, 4],
                })}
              >
                <Popup>
                  <Box>
                    <Typography variant="body2">
                      {new Date(track.timestamp).toLocaleString()}
                    </Typography>
                    {track.speed && (
                      <Typography variant="body2">Speed: {track.speed} km/h</Typography>
                    )}
                    {track.status && (
                      <Typography variant="body2">Status: {track.status}</Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {track.location.latitude.toFixed(6)}, {track.location.longitude.toFixed(6)}
                    </Typography>
                  </Box>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
        </Paper>
      </Fade>

      {/* Legend */}
      <Fade in={true} timeout={1100}>
        <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
            Map Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 24, height: 24, backgroundColor: 'orange', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>P</Box>
              <Typography variant="body2">Pickup Location</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 24, height: 24, backgroundColor: 'red', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>D</Box>
              <Typography variant="body2">Delivery Location</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 4, height: 20, backgroundColor: 'blue' }} />
              <Typography variant="body2">Route Path</Typography>
            </Box>
          </Box>
        </Paper>
      </Fade>
      </Container>
    </Box>
  );
};

export default RouteMap;
