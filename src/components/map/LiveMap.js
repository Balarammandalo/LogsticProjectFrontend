import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useAuth } from '../../services/AuthContext';
import socketService from '../../services/socket';
import { deliveryAPI, vehicleAPI } from '../../services/api';
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
  Chip,
  Fade,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { ArrowBack, Refresh, Search, Clear } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
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

const LiveMap = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);

  // Default center - Center of India for nationwide view
  const defaultCenter = [20.5937, 78.9629];
  
  // Get delivery ID from URL parameter
  const urlParams = new URLSearchParams(location.search);
  const deliveryIdFromUrl = urlParams.get('delivery');

  // India-wide delivery areas across major cities
  const indiaDeliveryAreas = [
    // Hyderabad
    { name: 'Madhapur, Hyderabad', city: 'Hyderabad', pincode: '500081', lat: 17.4485, lng: 78.3908, deliveries: 5 },
    { name: 'Hitech City, Hyderabad', city: 'Hyderabad', pincode: '500081', lat: 17.4435, lng: 78.3772, deliveries: 8 },
    { name: 'Gachibowli, Hyderabad', city: 'Hyderabad', pincode: '500032', lat: 17.4399, lng: 78.3489, deliveries: 6 },
    { name: 'Banjara Hills, Hyderabad', city: 'Hyderabad', pincode: '500034', lat: 17.4239, lng: 78.4738, deliveries: 10 },
    { name: 'Secunderabad', city: 'Hyderabad', pincode: '500003', lat: 17.4399, lng: 78.4983, deliveries: 9 },
    
    // Visakhapatnam
    { name: 'MVP Colony, Visakhapatnam', city: 'Visakhapatnam', pincode: '530017', lat: 17.7231, lng: 83.3044, deliveries: 7 },
    { name: 'Dwaraka Nagar, Visakhapatnam', city: 'Visakhapatnam', pincode: '530016', lat: 17.7172, lng: 83.3103, deliveries: 5 },
    { name: 'Gajuwaka, Visakhapatnam', city: 'Visakhapatnam', pincode: '530026', lat: 17.7000, lng: 83.2167, deliveries: 6 },
    { name: 'Madhurawada, Visakhapatnam', city: 'Visakhapatnam', pincode: '530048', lat: 17.7833, lng: 83.3833, deliveries: 4 },
    { name: 'Rushikonda, Visakhapatnam', city: 'Visakhapatnam', pincode: '530045', lat: 17.7833, lng: 83.3833, deliveries: 8 },
    
    // Mumbai
    { name: 'Andheri, Mumbai', city: 'Mumbai', pincode: '400053', lat: 19.1136, lng: 72.8697, deliveries: 12 },
    { name: 'Bandra, Mumbai', city: 'Mumbai', pincode: '400050', lat: 19.0596, lng: 72.8295, deliveries: 15 },
    { name: 'Powai, Mumbai', city: 'Mumbai', pincode: '400076', lat: 19.1176, lng: 72.9060, deliveries: 9 },
    { name: 'Navi Mumbai', city: 'Mumbai', pincode: '400614', lat: 19.0330, lng: 73.0297, deliveries: 11 },
    
    // Delhi
    { name: 'Connaught Place, Delhi', city: 'Delhi', pincode: '110001', lat: 28.6315, lng: 77.2167, deliveries: 14 },
    { name: 'Dwarka, Delhi', city: 'Delhi', pincode: '110075', lat: 28.5921, lng: 77.0460, deliveries: 10 },
    { name: 'Rohini, Delhi', city: 'Delhi', pincode: '110085', lat: 28.7496, lng: 77.0669, deliveries: 8 },
    { name: 'Saket, Delhi', city: 'Delhi', pincode: '110017', lat: 28.5244, lng: 77.2066, deliveries: 12 },
    
    // Bangalore
    { name: 'Koramangala, Bangalore', city: 'Bangalore', pincode: '560034', lat: 12.9352, lng: 77.6245, deliveries: 13 },
    { name: 'Whitefield, Bangalore', city: 'Bangalore', pincode: '560066', lat: 12.9698, lng: 77.7499, deliveries: 11 },
    { name: 'Indiranagar, Bangalore', city: 'Bangalore', pincode: '560038', lat: 12.9716, lng: 77.6412, deliveries: 9 },
    { name: 'Electronic City, Bangalore', city: 'Bangalore', pincode: '560100', lat: 12.8456, lng: 77.6603, deliveries: 10 },
    
    // Chennai
    { name: 'T Nagar, Chennai', city: 'Chennai', pincode: '600017', lat: 13.0418, lng: 80.2341, deliveries: 11 },
    { name: 'Anna Nagar, Chennai', city: 'Chennai', pincode: '600040', lat: 13.0850, lng: 80.2101, deliveries: 8 },
    { name: 'Velachery, Chennai', city: 'Chennai', pincode: '600042', lat: 12.9750, lng: 80.2210, deliveries: 7 },
    { name: 'OMR, Chennai', city: 'Chennai', pincode: '600097', lat: 12.8996, lng: 80.2209, deliveries: 9 },
    
    // Kolkata
    { name: 'Salt Lake, Kolkata', city: 'Kolkata', pincode: '700064', lat: 22.5726, lng: 88.4194, deliveries: 10 },
    { name: 'Park Street, Kolkata', city: 'Kolkata', pincode: '700016', lat: 22.5542, lng: 88.3516, deliveries: 12 },
    { name: 'Howrah, Kolkata', city: 'Kolkata', pincode: '711101', lat: 22.5958, lng: 88.2636, deliveries: 8 },
    
    // Pune
    { name: 'Hinjewadi, Pune', city: 'Pune', pincode: '411057', lat: 18.5912, lng: 73.7396, deliveries: 11 },
    { name: 'Kothrud, Pune', city: 'Pune', pincode: '411038', lat: 18.5074, lng: 73.8077, deliveries: 7 },
    { name: 'Viman Nagar, Pune', city: 'Pune', pincode: '411014', lat: 18.5679, lng: 73.9143, deliveries: 9 },
  ]

  useEffect(() => {
    loadData();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Auto-select delivery from URL parameter and zoom to its location
  useEffect(() => {
    if (deliveryIdFromUrl && deliveries.length > 0) {
      const delivery = deliveries.find(d => d._id === deliveryIdFromUrl);
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
    }
  }, [deliveryIdFromUrl, deliveries]);

  const loadData = async () => {
    try {
      setError('');
      const vehiclesRes = await vehicleAPI.getVehicles().catch(err => ({ data: [] }));
      setVehicles(vehiclesRes.data || []);

      // Dummy delivery data for filter dropdown
      const dummyDeliveries = [
        {
          _id: 'del001',
          status: 'on-route',
          customer: { name: 'Tech Solutions Mumbai' },
          pickupLocation: { address: 'Andheri, Mumbai', coordinates: { latitude: 19.1136, longitude: 72.8697 } },
          dropLocation: { address: 'Bandra, Mumbai', coordinates: { latitude: 19.0596, longitude: 72.8295 } },
          vehicle: { _id: 'veh1', vehicleNumber: 'MH-01-AB-1234' }
        },
        {
          _id: 'del002',
          status: 'assigned',
          customer: { name: 'Bangalore Enterprises' },
          pickupLocation: { address: 'Whitefield, Bangalore', coordinates: { latitude: 12.9698, longitude: 77.7499 } },
          dropLocation: { address: 'Koramangala, Bangalore', coordinates: { latitude: 12.9352, longitude: 77.6245 } },
          vehicle: { _id: 'veh2', vehicleNumber: 'KA-03-CD-5678' }
        },
        {
          _id: 'del003',
          status: 'on-route',
          customer: { name: 'Delhi Logistics' },
          pickupLocation: { address: 'Connaught Place, Delhi', coordinates: { latitude: 28.6315, longitude: 77.2167 } },
          dropLocation: { address: 'Dwarka, Delhi', coordinates: { latitude: 28.5921, longitude: 77.0460 } },
          vehicle: { _id: 'veh3', vehicleNumber: 'DL-05-EF-9012' }
        },
        {
          _id: 'del004',
          status: 'assigned',
          customer: { name: 'Hyderabad Tech Park' },
          pickupLocation: { address: 'Gachibowli, Hyderabad', coordinates: { latitude: 17.4399, longitude: 78.3489 } },
          dropLocation: { address: 'Hitech City, Hyderabad', coordinates: { latitude: 17.4435, longitude: 78.3772 } },
          vehicle: { _id: 'veh4', vehicleNumber: 'TS-09-GH-3456' }
        },
        {
          _id: 'del005',
          status: 'on-route',
          customer: { name: 'Vizag Shipping Co' },
          pickupLocation: { address: 'MVP Colony, Visakhapatnam', coordinates: { latitude: 17.7231, longitude: 83.3044 } },
          dropLocation: { address: 'Rushikonda, Visakhapatnam', coordinates: { latitude: 17.7833, longitude: 83.3833 } },
          vehicle: { _id: 'veh5', vehicleNumber: 'AP-31-IJ-7890' }
        },
        {
          _id: 'del006',
          status: 'assigned',
          customer: { name: 'Chennai Traders' },
          pickupLocation: { address: 'T Nagar, Chennai', coordinates: { latitude: 13.0418, longitude: 80.2341 } },
          dropLocation: { address: 'OMR, Chennai', coordinates: { latitude: 12.8996, longitude: 80.2209 } },
          vehicle: { _id: 'veh6', vehicleNumber: 'TN-07-KL-2345' }
        },
        {
          _id: 'del007',
          status: 'on-route',
          customer: { name: 'Kolkata Exports' },
          pickupLocation: { address: 'Salt Lake, Kolkata', coordinates: { latitude: 22.5726, longitude: 88.4194 } },
          dropLocation: { address: 'Park Street, Kolkata', coordinates: { latitude: 22.5542, longitude: 88.3516 } },
          vehicle: { _id: 'veh7', vehicleNumber: 'WB-06-MN-6789' }
        },
        {
          _id: 'del008',
          status: 'assigned',
          customer: { name: 'Pune IT Services' },
          pickupLocation: { address: 'Hinjewadi, Pune', coordinates: { latitude: 18.5912, longitude: 73.7396 } },
          dropLocation: { address: 'Viman Nagar, Pune', coordinates: { latitude: 18.5679, longitude: 73.9143 } },
          vehicle: { _id: 'veh8', vehicleNumber: 'MH-12-OP-0123' }
        },
      ];

      setDeliveries(dummyDeliveries);

      // Initialize tracking data
      const initialTracking = {};
      if (vehiclesRes.data && Array.isArray(vehiclesRes.data)) {
        vehiclesRes.data.forEach(vehicle => {
          if (vehicle.currentLocation) {
            initialTracking[vehicle._id] = {
              location: vehicle.currentLocation,
              status: vehicle.status,
            };
          }
        });
      }
      setTrackingData(initialTracking);
    } catch (error) {
      setError('Failed to load map data. Please try again.');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketService.connect(user);

    // Listen for location updates
    socketService.onLocationUpdate((data) => {
      setTrackingData(prev => ({
        ...prev,
        [data.vehicleId || data.driverId]: {
          location: data.location,
          status: data.status,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp,
        },
      }));
    });

    // Listen for status updates
    socketService.onStatusUpdate((data) => {
      // Update vehicle/driver status
      setTrackingData(prev => ({
        ...prev,
        [data.vehicleId || data.driverId]: {
          ...prev[data.vehicleId || data.driverId],
          status: data.status,
        },
      }));
    });
  };

  const getFilteredDeliveries = () => {
    if (user.role === 'admin') {
      return deliveries;
    } else if (user.role === 'driver') {
      return deliveries.filter(d => d.driver?._id === user._id);
    } else {
      return deliveries.filter(d => d.customer?._id === user._id);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const area = indiaDeliveryAreas.find(
      a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
           a.pincode.includes(searchQuery)
    );

    if (area) {
      setMapCenter([area.lat, area.lng]);
      setMapZoom(13);
      setError('');
    } else {
      setError(`No delivery area found for "${searchQuery}". Try searching for cities like Mumbai, Bangalore, Delhi, Hyderabad, Visakhapatnam, or specific areas.`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setMapCenter(defaultCenter);
    setMapZoom(5);
    setError('');
  };

  const getVehicleIcon = (status) => {
    let color = 'blue';
    switch (status) {
      case 'available':
        color = 'green';
        break;
      case 'in-use':
        color = 'orange';
        break;
      case 'maintenance':
        color = 'red';
        break;
      default:
        color = 'blue';
    }

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const getDeliveryAreaIcon = (deliveryCount) => {
    return L.divIcon({
      className: 'delivery-area-icon',
      html: `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        ">
          ${deliveryCount}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const getDeliveryRoute = (delivery) => {
    if (!delivery.pickupLocation?.coordinates || !delivery.dropLocation?.coordinates) {
      return null;
    }

    return [
      [delivery.pickupLocation.coordinates.latitude, delivery.pickupLocation.coordinates.longitude],
      [delivery.dropLocation.coordinates.latitude, delivery.dropLocation.coordinates.longitude],
    ];
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', animation: 'pulse 2s ease-in-out infinite' }}>
          Loading map...
        </Typography>
      </Box>
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
            <Box>
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
                Live Tracking Map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time vehicle and delivery tracking
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#764ba2',
                    background: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                component={Link}
                to={user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/user'}
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
            </Box>
          </Paper>
        </Fade>

        {deliveryIdFromUrl && selectedDelivery && (
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
                    📍 Tracking Delivery #{deliveryIdFromUrl.slice(-3)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Customer:</strong> {deliveries.find(d => d._id === deliveryIdFromUrl)?.customer?.name || 'Loading...'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>From:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {deliveries.find(d => d._id === deliveryIdFromUrl)?.pickupLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>To:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {deliveries.find(d => d._id === deliveryIdFromUrl)?.dropLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Button 
                  variant="outlined"
                  size="small" 
                  onClick={() => {
                    setSelectedDelivery('');
                    setMapCenter(defaultCenter);
                    setMapZoom(5);
                    window.history.pushState({}, '', '/admin/map/live');
                  }}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#764ba2',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  View All
                </Button>
              </Box>
            </Paper>
          </Fade>
        )}

        {error && (
          <Fade in={true}>
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
              action={
                <Button size="small" onClick={loadData}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Search Bar */}
        <Fade in={true} timeout={700}>
          <Paper
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Search by city (Mumbai, Bangalore, Delhi, Hyderabad, Visakhapatnam) or area name or pincode"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ flex: 1, minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Search
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Search delivery areas across India - Mumbai, Bangalore, Delhi, Hyderabad, Visakhapatnam, Chennai, Kolkata, Pune
            </Typography>
          </Paper>
        </Fade>

        {/* Delivery Filter */}
        <Fade in={true} timeout={800}>
          <Paper
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="delivery-select-label">Filter by Delivery</InputLabel>
          <Select
            labelId="delivery-select-label"
            id="delivery-select"
            value={selectedDelivery}
            label="Filter by Delivery"
            onChange={(e) => setSelectedDelivery(e.target.value)}
          >
            <MenuItem value="">
              <em>All Deliveries</em>
            </MenuItem>
            {getFilteredDeliveries().map((delivery) => (
              <MenuItem key={delivery._id} value={delivery._id}>
                Delivery #{delivery._id.slice(-8)} - {delivery.status}
              </MenuItem>
            ))}
          </Select>
          </FormControl>
          {deliveries.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No deliveries available to track
            </Typography>
          )}
          </Paper>
        </Fade>

        {/* Map */}
        <Fade in={true} timeout={900}>
          <Paper
            sx={{
              height: '600px',
              p: 0,
              overflow: 'hidden',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* India Delivery Area Markers - Hide when specific delivery is selected */}
          {!selectedDelivery && indiaDeliveryAreas.map((area) => (
            <Marker
              key={area.pincode + area.name}
              position={[area.lat, area.lng]}
              icon={getDeliveryAreaIcon(area.deliveries)}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea', mb: 1 }}>
                    {area.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Pincode:</strong> {area.pincode}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Active Deliveries:</strong> {area.deliveries}
                  </Typography>
                  <Chip
                    label="Delivery Available"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Popup>
            </Marker>
          ))}

          {/* Vehicle Markers */}
          {vehicles.map((vehicle) => {
            const tracking = trackingData[vehicle._id];
            if (!tracking?.location) return null;

            // Filter by selected delivery if one is chosen
            if (selectedDelivery) {
              const delivery = deliveries.find(d => d._id === selectedDelivery);
              if (delivery?.vehicle?._id !== vehicle._id) return null;
            }

            return (
              <Marker
                key={vehicle._id}
                position={[tracking.location.latitude, tracking.location.longitude]}
                icon={getVehicleIcon(tracking.status)}
              >
                <Popup>
                  <Box>
                    <Typography variant="h6">{vehicle.vehicleNumber}</Typography>
                    <Typography variant="body2">Type: {vehicle.type}</Typography>
                    <Typography variant="body2">Status: {tracking.status}</Typography>
                    {tracking.speed && (
                      <Typography variant="body2">Speed: {tracking.speed} km/h</Typography>
                    )}
                    <Typography variant="body2">
                      Location: {tracking.location.latitude.toFixed(4)}, {tracking.location.longitude.toFixed(4)}
                    </Typography>
                    {tracking.timestamp && (
                      <Typography variant="body2">
                        Last Update: {new Date(tracking.timestamp).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Popup>
              </Marker>
            );
          })}

          {/* Delivery Routes */}
          {getFilteredDeliveries()
            .filter(delivery => !selectedDelivery || delivery._id === selectedDelivery)
            .map((delivery) => {
              const route = getDeliveryRoute(delivery);
              if (!route) return null;

              return (
                <Polyline
                  key={delivery._id}
                  positions={route}
                  color={delivery.status === 'delivered' ? 'green' : delivery.status === 'on-route' ? 'blue' : 'orange'}
                  weight={3}
                  opacity={0.7}
                />
              );
            })}

          {/* Delivery Location Markers */}
          {getFilteredDeliveries()
            .filter(delivery => !selectedDelivery || delivery._id === selectedDelivery)
            .map((delivery) => {
              const markers = [];

              if (delivery.pickupLocation?.coordinates) {
                markers.push(
                  <Marker
                    key={`${delivery._id}-pickup`}
                    position={[
                      delivery.pickupLocation.coordinates.latitude,
                      delivery.pickupLocation.coordinates.longitude,
                    ]}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="h6">Pickup Location</Typography>
                        <Typography variant="body2">{delivery.pickupLocation.address}</Typography>
                        <Typography variant="body2">Delivery #{delivery._id.slice(-8)}</Typography>
                        <Chip
                          label={delivery.status}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Popup>
                  </Marker>
                );
              }

              if (delivery.dropLocation?.coordinates) {
                markers.push(
                  <Marker
                    key={`${delivery._id}-drop`}
                    position={[
                      delivery.dropLocation.coordinates.latitude,
                      delivery.dropLocation.coordinates.longitude,
                    ]}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="h6">Delivery Location</Typography>
                        <Typography variant="body2">{delivery.dropLocation.address}</Typography>
                        <Typography variant="body2">Delivery #{delivery._id.slice(-8)}</Typography>
                        <Chip
                          label={delivery.status}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Popup>
                  </Marker>
                );
              }

              return markers;
            })}
          </MapContainer>
          </Paper>
        </Fade>

        {/* Legend */}
        <Fade in={true} timeout={1100}>
          <Paper
            sx={{
              p: 3,
              mt: 2,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
          Map Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              #
            </Box>
            <Typography variant="body2"><strong>Delivery Area</strong> (Number shows active deliveries)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: 'green', borderRadius: '50%' }} />
            <Typography variant="body2">Available Vehicle</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: 'orange', borderRadius: '50%' }} />
            <Typography variant="body2">In Use Vehicle</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: 'red', borderRadius: '50%' }} />
            <Typography variant="body2">Maintenance</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 4, height: 20, backgroundColor: 'blue' }} />
            <Typography variant="body2">Active Route</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 4, height: 20, backgroundColor: 'green' }} />
            <Typography variant="body2">Completed Route</Typography>
          </Box>
          </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default LiveMap;
