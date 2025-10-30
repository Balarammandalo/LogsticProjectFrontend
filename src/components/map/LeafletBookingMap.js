import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Button, Chip, Paper, Alert, TextField, InputAdornment, CircularProgress, Card, CardContent, Grid } from '@mui/material';
import { CheckCircle, MyLocation, LocationOn, Route, Close, Refresh, Navigation } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// India bounds for map restriction
const INDIA_BOUNDS = {
  north: 35.5,
  south: 6.5,
  west: 68.0,
  east: 97.5,
};

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const LeafletBookingMap = ({
  onPickupSelect,
  onDropSelect,
  onDistanceCalculated,
  pickupCoords,
  dropCoords,
  height = 500,
}) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const routingControlRef = useRef(null);

  const [selectingMode, setSelectingMode] = useState(null); // 'pickup' or 'drop'
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Check if location is within India
  const isWithinIndia = useCallback((lat, lng) => {
    return (
      lat >= INDIA_BOUNDS.south &&
      lat <= INDIA_BOUNDS.north &&
      lng >= INDIA_BOUNDS.west &&
      lng <= INDIA_BOUNDS.east
    );
  }, []);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    try {
      // Create map
      const map = L.map(mapRef.current, {
        center: [INDIA_CENTER.lat, INDIA_CENTER.lng],
        zoom: 5,
        maxBounds: [
          [INDIA_BOUNDS.south, INDIA_BOUNDS.west],
          [INDIA_BOUNDS.north, INDIA_BOUNDS.east],
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 4,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add click listener
      map.on('click', (e) => {
        handleMapClick(e.latlng);
      });

      leafletMapRef.current = map;
      setMapReady(true);

      console.log('Leaflet map initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    // Cleanup
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    async (latlng) => {
      const lat = latlng.lat;
      const lng = latlng.lng;

      // Check if location is within India bounds
      if (!isWithinIndia(lat, lng)) {
        setError('Please select a location within India only.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      setError('');
      setLoading(true);

      try {
        // Get address for the location
        const address = await reverseGeocode(lat, lng);

        // Auto-determine mode: if no pickup, set pickup; else set drop
        let mode = selectingMode;
        if (!mode) {
          mode = !pickupMarkerRef.current ? 'pickup' : 'drop';
        }

        handleLocationSelect(mode, lat, lng, address);
      } catch (err) {
        console.error('Error getting address:', err);
        setError('Failed to get address for this location.');
        setTimeout(() => setError(''), 3000);
      } finally {
        setLoading(false);
      }
    },
    [selectingMode, isWithinIndia, reverseGeocode]
  );

  // Handle location selection
  const handleLocationSelect = useCallback(
    (type, lat, lng, address) => {
      if (!leafletMapRef.current) return;

      const map = leafletMapRef.current;

      if (type === 'pickup') {
        setPickupAddress(address);

        // Remove existing pickup marker
        if (pickupMarkerRef.current) {
          map.removeLayer(pickupMarkerRef.current);
        }

        // Create green marker for pickup
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon('#4CAF50'),
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; padding: 5px;">
            <strong style="color: #4CAF50;">🎯 Pickup Location</strong><br/>
            <span style="font-size: 12px;">${address}</span>
          </div>
        `);
        marker.openPopup();

        pickupMarkerRef.current = marker;

        // Notify parent
        if (onPickupSelect) {
          onPickupSelect({ lat, lng, address });
        }

        // Pan to location
        map.setView([lat, lng], 12);
        
        console.log('Pickup selected:', { lat, lng, address });
      } else if (type === 'drop') {
        setDropAddress(address);

        // Remove existing drop marker
        if (dropMarkerRef.current) {
          map.removeLayer(dropMarkerRef.current);
        }

        // Create red marker for drop
        const marker = L.marker([lat, lng], {
          icon: createCustomIcon('#f44336'),
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; padding: 5px;">
            <strong style="color: #f44336;">📍 Drop Location</strong><br/>
            <span style="font-size: 12px;">${address}</span>
          </div>
        `);
        marker.openPopup();

        dropMarkerRef.current = marker;

        // Notify parent
        if (onDropSelect) {
          onDropSelect({ lat, lng, address });
        }

        // Pan to location
        map.setView([lat, lng], 12);
        
        console.log('Drop selected:', { lat, lng, address });
      }

      setSelectingMode(null);
    },
    [onPickupSelect, onDropSelect]
  );

  // Reset map function
  const handleResetMap = useCallback(() => {
    if (!leafletMapRef.current) return;

    const map = leafletMapRef.current;

    // Clear markers
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (dropMarkerRef.current) {
      map.removeLayer(dropMarkerRef.current);
      dropMarkerRef.current = null;
    }

    // Clear polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // Clear routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Reset state
    setPickupAddress('');
    setDropAddress('');
    setDistance(null);
    setDuration(null);
    setSelectingMode(null);
    setError('');

    // Notify parent components
    onPickupSelect(null);
    onDropSelect(null);

    // Reset map view to India center
    map.setView([INDIA_CENTER.lat, INDIA_CENTER.lng], 5);
  }, [onPickupSelect, onDropSelect]);

  // Draw polyline and calculate distance when both markers are set
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady || !pickupCoords || !dropCoords) {
      if (polylineRef.current && leafletMapRef.current) {
        leafletMapRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (routingControlRef.current && leafletMapRef.current) {
        leafletMapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      return;
    }

    const map = leafletMapRef.current;

    // Clear existing polyline and routing
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Calculate distance
    const dist = calculateDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      dropCoords.lat,
      dropCoords.lng
    );

    // Estimate duration (assuming average speed of 40 km/h)
    const estimatedDuration = (dist / 40) * 60; // in minutes

    setDistance(dist.toFixed(2));
    setDuration(Math.round(estimatedDuration));

    // Notify parent
    if (onDistanceCalculated) {
      onDistanceCalculated({
        distanceText: `${dist.toFixed(2)} km`,
        distanceValue: dist,
        durationText: `${Math.round(estimatedDuration)} mins`,
        durationValue: estimatedDuration,
      });
    }

    // Draw simple polyline
    const polyline = L.polyline(
      [
        [pickupCoords.lat, pickupCoords.lng],
        [dropCoords.lat, dropCoords.lng],
      ],
      {
        color: '#667eea',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
      }
    ).addTo(map);

    polylineRef.current = polyline;

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [pickupCoords.lat, pickupCoords.lng],
      [dropCoords.lat, dropCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Optional: Add routing machine for actual road route
    // Uncomment if you want to show actual driving route
    /*
    try {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(pickupCoords.lat, pickupCoords.lng),
          L.latLng(dropCoords.lat, dropCoords.lng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#667eea', weight: 4, opacity: 0.8 }],
        },
        createMarker: () => null, // Don't create default markers
      }).addTo(map);

      routingControlRef.current = routingControl;
    } catch (err) {
      console.error('Routing error:', err);
    }
    */
  }, [pickupCoords, dropCoords, mapReady, calculateDistance, onDistanceCalculated]);

  return (
    <Box>
      {/* Input Fields */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <TextField
          fullWidth
          label="Pickup Location"
          placeholder="Click 'Select Pickup' then click on map..."
          value={pickupAddress}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <MyLocation sx={{ color: '#4CAF50' }} />
              </InputAdornment>
            ),
            endAdornment: pickupAddress && (
              <InputAdornment position="end">
                <Close
                  sx={{ cursor: 'pointer', fontSize: 20 }}
                  onClick={() => {
                    setPickupAddress('');
                    if (pickupMarkerRef.current && leafletMapRef.current) {
                      leafletMapRef.current.removeLayer(pickupMarkerRef.current);
                      pickupMarkerRef.current = null;
                    }
                    onPickupSelect(null);
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#4CAF50',
              },
            },
          }}
        />
        <TextField
          fullWidth
          label="Drop Location"
          placeholder="Click 'Select Drop' then click on map..."
          value={dropAddress}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn sx={{ color: '#f44336' }} />
              </InputAdornment>
            ),
            endAdornment: dropAddress && (
              <InputAdornment position="end">
                <Close
                  sx={{ cursor: 'pointer', fontSize: 20 }}
                  onClick={() => {
                    setDropAddress('');
                    if (dropMarkerRef.current && leafletMapRef.current) {
                      leafletMapRef.current.removeLayer(dropMarkerRef.current);
                      dropMarkerRef.current = null;
                    }
                    onDropSelect(null);
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#f44336',
              },
            },
          }}
        />
      </Box>

      {/* Control Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
          {selectingMode === 'pickup' ? 'Click on map to set Pickup' : 'Select Pickup on Map'}
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
          {selectingMode === 'drop' ? 'Click on map to set Drop' : 'Select Drop on Map'}
        </Button>

        {pickupCoords && dropCoords && (
          <Chip
            icon={<CheckCircle />}
            label="Both locations selected"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        )}

        {(pickupCoords || dropCoords) && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Refresh />}
            onClick={handleResetMap}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Reset Map
          </Button>
        )}

        {loading && <CircularProgress size={24} />}
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
          position: 'relative',
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
          },
        }}
      />

      {/* Route Summary Card */}
      {distance && duration && pickupAddress && dropAddress && (
        <Card
          elevation={3}
          sx={{
            mt: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Navigation /> Route Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    🟢 Pickup Location:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {pickupAddress}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    🔴 Drop Location:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {dropAddress}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Route sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Distance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {distance} km
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>⏱️</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Est. Time
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {duration} mins
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LeafletBookingMap;
