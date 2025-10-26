import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { DirectionsCar, CheckCircle } from '@mui/icons-material';

const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike', capacity: 200 },
  { value: 'van', label: 'Van', capacity: 500 },
  { value: 'mini-truck', label: 'Mini Truck / Tempo', capacity: 1500 },
  { value: 'truck', label: 'Truck', capacity: 5000 },
  { value: 'lorry', label: 'Lorry', capacity: 10000 },
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];

const AddVehicleNew = () => {
  const [formData, setFormData] = useState({
    vehicleType: 'van',
    vehicleNumber: '',
    capacity: 500,
    fuelType: 'Diesel',
    status: 'available',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'vehicleType') {
      const selectedType = VEHICLE_TYPES.find(t => t.value === value);
      setFormData({
        ...formData,
        vehicleType: value,
        capacity: selectedType?.capacity || formData.capacity,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.vehicleNumber || !formData.capacity) {
      setError('Please fill in all required fields');
      return;
    }

    // Create vehicle object
    const newVehicle = {
      _id: 'veh' + Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      assignedDriver: null,
    };

    // Save to localStorage
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    vehicles.push(newVehicle);
    localStorage.setItem('vehicles', JSON.stringify(vehicles));

    setSuccess(true);
    setFormData({
      vehicleType: 'van',
      vehicleNumber: '',
      capacity: 500,
      fuelType: 'Diesel',
      status: 'available',
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
        🚗 Add New Vehicle
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        label="Vehicle Type"
                      >
                        {VEHICLE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vehicle Number"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., MH01AB1234"
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Capacity (kg)"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Fuel Type</InputLabel>
                      <Select
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleChange}
                        label="Fuel Type"
                      >
                        {FUEL_TYPES.map((fuel) => (
                          <MenuItem key={fuel} value={fuel}>
                            {fuel}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Status"
                      >
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="in-use">In Use</MenuItem>
                        <MenuItem value="maintenance">Under Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<DirectionsCar />}
                      sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    >
                      Add Vehicle
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                ℹ️ Vehicle Types
              </Typography>
              {VEHICLE_TYPES.map((type) => (
                <Box key={type.value} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {type.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Capacity: up to {type.capacity} kg
                  </Typography>
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                💡 Tip: Vehicle capacity is auto-filled based on type
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ borderRadius: 3, mt: 2, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📋 Status Options
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                  Available
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ready for assignment
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2196f3' }}>
                  In Use
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Currently assigned to a driver
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                  Under Maintenance
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Not available for use
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccess(false)}
          severity="success"
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          Vehicle added successfully! 🎉
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddVehicleNew;
