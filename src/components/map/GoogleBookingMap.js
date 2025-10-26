import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Chip, Paper, Alert } from '@mui/material';
import { CheckCircle, MyLocation, LocationOn, Route } from '@mui/icons-material';

// India bounds for map restriction
const INDIA_BOUNDS = {
  north: 35.5,
  south: 6.5,
  west: 68.0,
  east: 97.5,
};

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

const GoogleBookingMap = ({
  onPickupSelect,
  onDropSelect,
  onDistanceCalculated,
  pickupCoords,
  dropCoords,
  height = 500,
  apiKey = 'YOUR_GOOGLE_MAPS_API_KEY', // Replace with your actual API key
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const geocoderRef = useRef(null);
  const distanceServiceRef = useRef(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectingMode, setSelectingMode] = useState(null); // 'pickup' or 'drop'
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState('');

  // Load Google Maps Script
  useEffect(() => {
    // Check if API key is valid
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY' || apiKey.trim() === '') {
      setError('Google Maps API key is not configured. Please follow the setup instructions below.');
      return;
    }

    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    script.onerror = () => {
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  // Initialize Map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || googleMapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      restriction: {
        latLngBounds: INDIA_BOUNDS,
        strictBounds: true,
      },
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }],
        },
      ],
    });

    googleMapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    distanceServiceRef.current = new window.google.maps.DistanceMatrixService();

    // Add click listener for map
    map.addListener('click', (event) => {
      handleMapClick(event.latLng);
    });
  }, [isMapLoaded]);

  // Handle map click
  const handleMapClick = (latLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    // Check if location is within India bounds
    if (
      lat < INDIA_BOUNDS.south ||
      lat > INDIA_BOUNDS.north ||
      lng < INDIA_BOUNDS.west ||
      lng > INDIA_BOUNDS.east
    ) {
      setError('Please select a location within India only.');
      return;
    }

    setError('');

    if (selectingMode === 'pickup') {
      // Reverse geocode to get address
      geocoderRef.current.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          // Check if address is in India
          if (!address.toLowerCase().includes('india')) {
            setError('Please select a location within India only.');
            return;
          }

          onPickupSelect({
            lat,
            lng,
            address,
          });

          // Add/Update pickup marker (green)
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setMap(null);
          }

          pickupMarkerRef.current = new window.google.maps.Marker({
            position: latLng,
            map: googleMapRef.current,
            title: 'Pickup Location',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new window.google.maps.Size(50, 50),
            },
            animation: window.google.maps.Animation.DROP,
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;">
              <strong style="color: #4CAF50;">🎯 Pickup Location</strong><br/>
              <span style="font-size: 12px;">${address}</span>
            </div>`,
          });

          pickupMarkerRef.current.addListener('click', () => {
            infoWindow.open(googleMapRef.current, pickupMarkerRef.current);
          });

          setSelectingMode(null);
        }
      });
    } else if (selectingMode === 'drop') {
      // Reverse geocode to get address
      geocoderRef.current.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          
          // Check if address is in India
          if (!address.toLowerCase().includes('india')) {
            setError('Please select a location within India only.');
            return;
          }

          onDropSelect({
            lat,
            lng,
            address,
          });

          // Add/Update drop marker (red)
          if (dropMarkerRef.current) {
            dropMarkerRef.current.setMap(null);
          }

          dropMarkerRef.current = new window.google.maps.Marker({
            position: latLng,
            map: googleMapRef.current,
            title: 'Drop Location',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(50, 50),
            },
            animation: window.google.maps.Animation.DROP,
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;">
              <strong style="color: #f44336;">📍 Drop Location</strong><br/>
              <span style="font-size: 12px;">${address}</span>
            </div>`,
          });

          dropMarkerRef.current.addListener('click', () => {
            infoWindow.open(googleMapRef.current, dropMarkerRef.current);
          });

          setSelectingMode(null);
        }
      });
    }
  };

  // Update markers when coordinates change externally
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded) return;

    // Update pickup marker
    if (pickupCoords) {
      const latLng = new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng);
      
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setPosition(latLng);
      } else {
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: googleMapRef.current,
          title: 'Pickup Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(50, 50),
          },
        });
      }
    }

    // Update drop marker
    if (dropCoords) {
      const latLng = new window.google.maps.LatLng(dropCoords.lat, dropCoords.lng);
      
      if (dropMarkerRef.current) {
        dropMarkerRef.current.setPosition(latLng);
      } else {
        dropMarkerRef.current = new window.google.maps.Marker({
          position: latLng,
          map: googleMapRef.current,
          title: 'Drop Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(50, 50),
          },
        });
      }
    }
  }, [pickupCoords, dropCoords, isMapLoaded]);

  // Draw polyline and calculate distance when both markers are set
  useEffect(() => {
    if (!googleMapRef.current || !isMapLoaded || !pickupCoords || !dropCoords) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      return;
    }

    const pickupLatLng = new window.google.maps.LatLng(pickupCoords.lat, pickupCoords.lng);
    const dropLatLng = new window.google.maps.LatLng(dropCoords.lat, dropCoords.lng);

    // Draw polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    polylineRef.current = new window.google.maps.Polyline({
      path: [pickupLatLng, dropLatLng],
      geodesic: true,
      strokeColor: '#667eea',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: googleMapRef.current,
    });

    // Fit bounds to show both markers
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickupLatLng);
    bounds.extend(dropLatLng);
    googleMapRef.current.fitBounds(bounds, { padding: 100 });

    // Calculate distance and duration using Distance Matrix API
    distanceServiceRef.current.getDistanceMatrix(
      {
        origins: [pickupLatLng],
        destinations: [dropLatLng],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const result = response.rows[0].elements[0];
          setDistance(result.distance.text);
          setDuration(result.duration.text);
          
          // Notify parent component of distance calculation
          if (onDistanceCalculated) {
            onDistanceCalculated({
              distanceText: result.distance.text,
              distanceValue: result.distance.value / 1000, // Convert meters to km
              durationText: result.duration.text,
              durationValue: result.duration.value, // In seconds
            });
          }
        }
      }
    );
  }, [pickupCoords, dropCoords, isMapLoaded]);

  return (
    <Box>
      {/* Control Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant={selectingMode === 'pickup' ? 'contained' : 'outlined'}
          color="success"
          startIcon={<MyLocation />}
          onClick={() => setSelectingMode('pickup')}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            ...(selectingMode === 'pickup' && {
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }),
          }}
        >
          {selectingMode === 'pickup' ? 'Click on map to set Pickup' : 'Set Pickup Location'}
        </Button>

        <Button
          variant={selectingMode === 'drop' ? 'contained' : 'outlined'}
          color="error"
          startIcon={<LocationOn />}
          onClick={() => setSelectingMode('drop')}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            ...(selectingMode === 'drop' && {
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }),
          }}
        >
          {selectingMode === 'drop' ? 'Click on map to set Drop' : 'Set Drop Location'}
        </Button>

        {pickupCoords && dropCoords && (
          <Chip
            icon={<CheckCircle />}
            label="Both locations selected"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Instruction */}
      {selectingMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Click anywhere on the map</strong> to select the{' '}
          {selectingMode === 'pickup' ? 'pickup (green marker)' : 'drop (red marker)'} location.
          Only locations within India can be selected.
        </Alert>
      )}

      {/* Map Container */}
      <Box
        ref={mapRef}
        sx={{
          height,
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: '3px solid',
          borderColor: selectingMode === 'pickup' ? '#4CAF50' : selectingMode === 'drop' ? '#f44336' : '#e0e0e0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'border-color 0.3s ease',
        }}
      />

      {/* Distance and Duration Info */}
      {distance && duration && (
        <Paper
          elevation={3}
          sx={{
            mt: 2,
            p: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Route sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Distance
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {distance}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>⏱️</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Estimated Time
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {duration}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Setup Instructions when API key is missing */}
      {error && error.includes('not configured') && (
        <Paper
          elevation={3}
          sx={{
            mt: 2,
            p: 3,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            🔑 Google Maps Setup Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.95 }}>
            To use the interactive map feature, you need to configure your Google Maps API key:
          </Typography>
          <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
            <li>
              <Typography variant="body2">
                Visit <strong>Google Cloud Console</strong> and create a project
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Enable: <strong>Maps JavaScript API, Geocoding API, Distance Matrix API</strong>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Create an <strong>API Key</strong> in Credentials section
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Add the key to <strong>frontend/.env</strong> file:
                <br />
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                  REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
                </code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Restart the development server: <strong>npm start</strong>
              </Typography>
            </li>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', opacity: 0.9 }}>
            📚 See <strong>QUICK_START_GOOGLE_MAPS.md</strong> for detailed instructions
          </Typography>
        </Paper>
      )}

      {/* Loading State */}
      {!isMapLoaded && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Loading Google Maps...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GoogleBookingMap;
