import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { LocalShipping, Person, DirectionsCar, CheckCircle, Warning } from '@mui/icons-material';

const OrderAssignment = ({ open, onClose, order, onAssign }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableDriversAndVehicles();
    }
  }, [open]);

  const loadAvailableDriversAndVehicles = () => {
    // Load drivers
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const available = drivers.filter(d => d.status === 'available');
    setAvailableDrivers(available);

    // Load vehicles
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const availableVeh = vehicles.filter(v => v.status === 'available');
    setAvailableVehicles(availableVeh);

    // Reset selections
    setSelectedDriver('');
    setSelectedVehicle('');
    setError('');
  };

  const handleAssign = () => {
    setError('');

    // Validation
    if (!selectedDriver) {
      setError('Please select a driver');
      return;
    }

    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    // Check if vehicle is still available
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const vehicle = vehicles.find(v => v._id === selectedVehicle);
    
    if (!vehicle || vehicle.status !== 'available') {
      setError('Selected vehicle is no longer available. Please refresh and try again.');
      return;
    }

    // Check if driver is still available
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const driver = drivers.find(d => d._id === selectedDriver);
    
    if (!driver || driver.status !== 'available') {
      setError('Selected driver is no longer available. Please refresh and try again.');
      return;
    }

    setLoading(true);

    // Update order
    const orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedOrders = orders.map(o => {
      if (o._id === order._id) {
        return {
          ...o,
          status: 'in-transit',
          assignedDriver: {
            id: driver._id,
            name: driver.name,
            mobile: driver.mobile,
          },
          assignedVehicle: {
            id: vehicle._id,
            number: vehicle.vehicleNumber,
            type: vehicle.vehicleType,
          },
          assignedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));

    // Update driver status
    const updatedDrivers = drivers.map(d => {
      if (d._id === selectedDriver) {
        return {
          ...d,
          status: 'on-trip',
          assignedVehicle: selectedVehicle,
          currentOrder: order._id,
        };
      }
      return d;
    });
    localStorage.setItem('drivers', JSON.stringify(updatedDrivers));

    // Update vehicle status
    const updatedVehicles = vehicles.map(v => {
      if (v._id === selectedVehicle) {
        return {
          ...v,
          status: 'in-use',
          assignedDriver: selectedDriver,
          currentOrder: order._id,
        };
      }
      return v;
    });
    localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));

    setLoading(false);
    
    // Call parent callback
    if (onAssign) {
      onAssign({
        orderId: order._id,
        driver: driver,
        vehicle: vehicle,
      });
    }

    onClose();
  };

  const getDriverInfo = (driverId) => {
    const driver = availableDrivers.find(d => d._id === driverId);
    return driver;
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = availableVehicles.find(v => v._id === vehicleId);
    return vehicle;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping sx={{ color: '#667eea', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Assign Driver & Vehicle
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Order Details */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Order Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Order ID:</strong> #{order?._id?.slice(-6)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Customer:</strong> {order?.customerName || order?.customer?.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2">
                <strong>Route:</strong> {order?.pickupLocation?.address?.split(',')[0] || order?.pickupLocation} → {order?.dropLocation?.address?.split(',')[0] || order?.dropLocation}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Weight:</strong> {order?.packageWeight} kg
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Vehicle Type:</strong> {order?.vehicleType}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Availability Check */}
        {availableDrivers.length === 0 || availableVehicles.length === 0 ? (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            {availableDrivers.length === 0 && availableVehicles.length === 0 && (
              <Typography variant="body2">
                <strong>No drivers or vehicles available!</strong> Please add drivers and vehicles or wait for them to become available.
              </Typography>
            )}
            {availableDrivers.length === 0 && availableVehicles.length > 0 && (
              <Typography variant="body2">
                <strong>No drivers available!</strong> Please add drivers or wait for them to become available.
              </Typography>
            )}
            {availableDrivers.length > 0 && availableVehicles.length === 0 && (
              <Typography variant="body2">
                <strong>No vehicles available!</strong> Please add vehicles or wait for them to become available.
              </Typography>
            )}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {availableDrivers.length} driver(s) and {availableVehicles.length} vehicle(s) available for assignment
            </Typography>
          </Alert>
        )}

        {/* Driver Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Driver</InputLabel>
          <Select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            label="Select Driver"
            disabled={availableDrivers.length === 0}
          >
            <MenuItem value="">
              <em>-- Select a driver --</em>
            </MenuItem>
            {availableDrivers.map((driver) => (
              <MenuItem key={driver._id} value={driver._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Person sx={{ color: '#667eea', fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {driver.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📱 {driver.mobile} | 🪪 {driver.licenseNumber}
                    </Typography>
                  </Box>
                  <Chip label="Available" size="small" color="success" />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Vehicle Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Vehicle</InputLabel>
          <Select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            label="Select Vehicle"
            disabled={availableVehicles.length === 0}
          >
            <MenuItem value="">
              <em>-- Select a vehicle --</em>
            </MenuItem>
            {availableVehicles.map((vehicle) => (
              <MenuItem key={vehicle._id} value={vehicle._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <DirectionsCar sx={{ color: '#667eea', fontSize: 20 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {vehicle.vehicleNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {vehicle.vehicleType} | {vehicle.capacity} kg | {vehicle.fuelType}
                    </Typography>
                  </Box>
                  <Chip label="Available" size="small" color="success" />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selected Summary */}
        {selectedDriver && selectedVehicle && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#4caf50', fontWeight: 600 }}>
              ✓ Assignment Summary
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Driver:</strong> {getDriverInfo(selectedDriver)?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Vehicle:</strong> {getVehicleInfo(selectedVehicle)?.vehicleNumber} ({getVehicleInfo(selectedVehicle)?.vehicleType})
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!selectedDriver || !selectedVehicle || loading || availableDrivers.length === 0 || availableVehicles.length === 0}
          startIcon={<CheckCircle />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            },
          }}
        >
          {loading ? 'Assigning...' : 'Assign Delivery'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderAssignment;
