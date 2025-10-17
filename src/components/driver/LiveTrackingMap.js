import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  MyLocation,
  LocationOn,
  Navigation,
  Timer,
  Speed,
  LocalShipping,
} from '@mui/icons-material';

const LiveTrackingMap = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [traveledPath, setTraveledPath] = useState([]);

  useEffect(() => {
    // Load active delivery from localStorage or dummy data
    const dummyActiveDelivery = {
      _id: 'del002',
      customer: { name: 'Retail Store Hyderabad' },
      pickupLocation: {
        address: 'Madhapur, Hyderabad, Telangana 500081',
        coordinates: { lat: 17.4485, lng: 78.3908 },
      },
      dropLocation: {
        address: 'Banjara Hills, Hyderabad, Telangana 500034',
        coordinates: { lat: 17.4239, lng: 78.4738 },
      },
      status: 'on-route',
      estimatedTime: 25, // minutes
      distance: 8.5, // km
    };

    setActiveDelivery(dummyActiveDelivery);
    getCurrentLocation();

    // Load traveled path from localStorage
    const savedPath = localStorage.getItem('driverTraveledPath');
    if (savedPath) {
      setTraveledPath(JSON.parse(savedPath));
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
          };
          setCurrentLocation(location);
          calculateRouteInfo(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use dummy location for demo
          const dummyLocation = {
            lat: 17.4400,
            lng: 78.4000,
            timestamp: new Date().toISOString(),
          };
          setCurrentLocation(dummyLocation);
          calculateRouteInfo(dummyLocation);
        }
      );
    }
  };

  const calculateRouteInfo = (currentLoc) => {
    if (!activeDelivery || !currentLoc) return;

    // Calculate distance to destination (simplified calculation)
    const destination = activeDelivery.dropLocation.coordinates;
    const distance = calculateDistance(
      currentLoc.lat,
      currentLoc.lng,
      destination.lat,
      destination.lng
    );

    // Estimate time (assuming average speed of 30 km/h in city)
    const estimatedTime = Math.round((distance / 30) * 60); // minutes

    setRouteInfo({
      distanceRemaining: distance.toFixed(2),
      estimatedTime: estimatedTime,
      currentSpeed: 25, // km/h (dummy value)
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const startTracking = () => {
    setTracking(true);
    
    // Start watching position
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
          };
          
          setCurrentLocation(newLocation);
          calculateRouteInfo(newLocation);
          
          // Add to traveled path
          const updatedPath = [...traveledPath, newLocation];
          setTraveledPath(updatedPath);
          localStorage.setItem('driverTraveledPath', JSON.stringify(updatedPath));
        },
        (error) => {
          console.error('Error tracking location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      // Store watchId for cleanup
      return () => navigator.geolocation.clearWatch(watchId);
    }
  };

  const stopTracking = () => {
    setTracking(false);
  };

  if (!activeDelivery) {
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
        <Typography variant="h5" sx={{ color: 'white' }}>
          No active delivery found
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
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/driver/dashboard')}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                🗺️ Live Tracking Map
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time navigation and route tracking
              </Typography>
            </Box>
            <Chip
              label={tracking ? 'Tracking Active' : 'Tracking Paused'}
              color={tracking ? 'success' : 'default'}
              icon={<MyLocation />}
            />
          </Box>
        </Paper>

        {/* Route Information Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, background: 'rgba(255, 255, 255, 0.95)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Navigation sx={{ color: '#667eea', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Distance Remaining
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                  {routeInfo?.distanceRemaining || '8.5'} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, background: 'rgba(255, 255, 255, 0.95)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'rgba(76, 175, 80, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Timer sx={{ color: '#4caf50', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Time
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  {routeInfo?.estimatedTime || '25'} min
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, background: 'rgba(255, 255, 255, 0.95)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'rgba(255, 152, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Speed sx={{ color: '#ff9800', fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Speed
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {routeInfo?.currentSpeed || '25'} km/h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Map Container */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            📍 Route Map
          </Typography>

          {/* Interactive Map Visualization */}
          <Box
            sx={{
              height: 400,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%)',
              border: '2px solid #667eea',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Map Background Grid */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Route Line */}
            <Box
              sx={{
                position: 'absolute',
                top: '30%',
                left: '15%',
                width: '70%',
                height: '3px',
                background: 'linear-gradient(90deg, #4caf50 0%, #667eea 50%, #f44336 100%)',
                borderRadius: 2,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-3px',
                  left: 0,
                  right: 0,
                  height: '9px',
                  background: 'linear-gradient(90deg, rgba(76, 175, 80, 0.2) 0%, rgba(102, 126, 234, 0.2) 50%, rgba(244, 67, 54, 0.2) 100%)',
                  borderRadius: 4,
                  filter: 'blur(4px)',
                },
              }}
            />

            {/* Current Location Marker */}
            <Box
              sx={{
                position: 'absolute',
                top: '28%',
                left: tracking ? '45%' : '15%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.5)',
                  animation: tracking ? 'pulse 2s ease-in-out infinite' : 'none',
                  border: '4px solid white',
                }}
              >
                <MyLocation sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  mt: 1,
                  background: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50' }}>
                  📍 You are here
                </Typography>
              </Box>
            </Box>

            {/* Next Location Marker */}
            <Box
              sx={{
                position: 'absolute',
                top: '28%',
                left: '85%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(244, 67, 54, 0.5)',
                  border: '4px solid white',
                  animation: 'bounce 2s ease-in-out infinite',
                }}
              >
                <LocationOn sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  mt: 1,
                  background: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#f44336' }}>
                  🎯 {activeDelivery.dropLocation.address.split(',')[0]}
                </Typography>
              </Box>
            </Box>

            {/* Waypoint Markers */}
            {['Jubilee Hills', 'HITEC City'].map((waypoint, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  top: '28%',
                  left: `${35 + index * 20}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#667eea',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    mt: 0.5,
                    color: '#667eea',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    fontSize: '0.65rem',
                  }}
                >
                  {waypoint}
                </Typography>
              </Box>
            ))}

            {/* Info Box */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                p: 2,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Navigation sx={{ color: '#4caf50', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        From
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {activeDelivery.pickupLocation.address.split(',')[0]}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                        → {routeInfo?.distanceRemaining || '8.5'} km →
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" textAlign="right">
                        Next Stop
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                        {activeDelivery.dropLocation.address.split(',')[0]}
                      </Typography>
                    </Box>
                    <LocationOn sx={{ color: '#f44336', fontSize: 20 }} />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Progress Indicator */}
            {tracking && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <LinearProgress sx={{ height: 3 }} />
              </Box>
            )}

            {/* Animations */}
            <style>
              {`
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
                  }
                  50% {
                    transform: scale(1.1);
                    box-shadow: 0 6px 30px rgba(76, 175, 80, 0.8);
                  }
                }
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-10px);
                  }
                }
              `}
            </style>
          </Box>

          {/* Tracking Controls */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {!tracking ? (
              <Button
                fullWidth
                variant="contained"
                onClick={startTracking}
                startIcon={<MyLocation />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                  },
                }}
              >
                Start Live Tracking
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={stopTracking}
                startIcon={<MyLocation />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#f44336',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#d32f2f',
                    background: 'rgba(244, 67, 54, 0.05)',
                  },
                }}
              >
                Stop Tracking
              </Button>
            )}
          </Box>
        </Paper>

        {/* Current Delivery Details */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            📦 Current Delivery
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {activeDelivery.customer.name}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  📍 Current Location
                </Typography>
                <Typography variant="body1">
                  {currentLocation
                    ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                    : 'Getting location...'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  🎯 Destination
                </Typography>
                <Typography variant="body1">{activeDelivery.dropLocation.address}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label="On Route" color="info" size="small" />
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Traveled Path Info */}
          {traveledPath.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Tracking Active:</strong> {traveledPath.length} location points recorded
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default LiveTrackingMap;
