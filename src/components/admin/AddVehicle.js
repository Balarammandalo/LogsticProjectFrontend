import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../../services/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Fade,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, DirectionsCar } from '@mui/icons-material';

const AddVehicle = () => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: 'truck',
    capacity: '',
    status: 'available',
    currentLocation: {
      latitude: '',
      longitude: '',
      address: '',
    },
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Geocode address to get latitude and longitude
  const geocodeAddress = async (address) => {
    if (!address || address.trim() === '') {
      return null;
    }

    setGeocoding(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Geocode the address if provided
      let coordinates = null;
      if (formData.currentLocation.address) {
        coordinates = await geocodeAddress(formData.currentLocation.address);
        if (!coordinates) {
          setError('Could not find coordinates for the provided address. Please check the address.');
          setLoading(false);
          return;
        }
      }

      // Prepare vehicle data
      const vehicleData = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        currentLocation: coordinates
          ? {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              address: formData.currentLocation.address,
            }
          : undefined,
      };

      // Try to save to backend API
      try {
        await vehicleAPI.createVehicle(vehicleData);
      } catch (apiError) {
        console.warn('Backend API error (continuing with localStorage):', apiError);
        // Continue even if backend fails - we'll save to localStorage
      }
      
      // Save to localStorage for driver dashboard sync
      const vehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
      
      // Check if vehicle already exists in localStorage
      const existingVehicle = vehicles.find(v => v.vehicleNumber === vehicleData.vehicleNumber);
      if (existingVehicle) {
        setError('Vehicle with this number already exists in the system.');
        setLoading(false);
        return;
      }
      
      const newVehicle = {
        id: 'veh_' + Date.now(),
        ...vehicleData,
        createdAt: new Date().toISOString(),
      };
      vehicles.push(newVehicle);
      localStorage.setItem('adminVehicles', JSON.stringify(vehicles));
      
      setSuccess('Vehicle added successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError(error.message || 'Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pb: 4,
      }}
    >
      <Container maxWidth="md" sx={{ pt: 4 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DirectionsCar sx={{ fontSize: 28, color: 'white' }} />
              </Box>
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
                  Add New Vehicle
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Register a new vehicle in the fleet
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => navigate('/admin')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          </Paper>
        </Fade>

        {error && (
          <Fade in={true}>
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {success && (
          <Fade in={true}>
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {success}
            </Alert>
          </Fade>
        )}

        <Fade in={true} timeout={800}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="vehicleNumber"
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="type-label">Vehicle Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={formData.type}
                  label="Vehicle Type"
                  onChange={handleChange}
                >
                  <MenuItem value="truck">Truck</MenuItem>
                  <MenuItem value="van">Van</MenuItem>
                  <MenuItem value="bike">Bike</MenuItem>
                  <MenuItem value="car">Car</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="capacity"
                label="Capacity (kg)"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="in-use">In Use</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#667eea',
                  mt: 2,
                }}
              >
                Current Location
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the address and we'll automatically get the coordinates
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                label="Address"
                name="currentLocation.address"
                placeholder="e.g., 123 Main Street, New York, NY 10001"
                multiline
                rows={2}
                value={formData.currentLocation.address}
                onChange={handleChange}
                helperText="Provide a complete address for accurate geocoding"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || geocoding}
              startIcon={loading || geocoding ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                minWidth: 150,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                },
              }}
            >
              {loading ? 'Adding Vehicle...' : geocoding ? 'Getting Location...' : 'Add Vehicle'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin')}
              disabled={loading || geocoding}
              sx={{
                minWidth: 120,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              Cancel
            </Button>
          </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default AddVehicle;
