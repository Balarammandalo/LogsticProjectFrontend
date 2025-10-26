import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Edit, Delete, DirectionsCar, LocalGasStation } from '@mui/icons-material';

const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editedVehicle, setEditedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  const loadVehicles = () => {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    setVehicles(storedVehicles);
  };

  const loadDrivers = () => {
    const storedDrivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    setDrivers(storedDrivers);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditedVehicle({ ...vehicle });
    setEditDialogOpen(true);
  };

  const handleDelete = (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      const updatedVehicles = vehicles.filter(v => v._id !== vehicleId);
      localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
      loadVehicles();
    }
  };

  const handleSaveEdit = () => {
    const updatedVehicles = vehicles.map(v => 
      v._id === editedVehicle._id ? editedVehicle : v
    );
    localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
    setEditDialogOpen(false);
    loadVehicles();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in-use':
        return 'info';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d._id === driverId);
    return driver ? driver.name : 'Not Assigned';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
          🚗 Vehicles List
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            label={`Available: ${vehicles.filter(v => v.status === 'available').length}`}
            color="success"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Total: ${vehicles.length}`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>

      {vehicles.length > 0 ? (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                <TableCell><strong>Vehicle Number</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Capacity</strong></TableCell>
                <TableCell><strong>Fuel Type</strong></TableCell>
                <TableCell><strong>Assigned Driver</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow
                  key={vehicle._id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: vehicle.status === 'available' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectionsCar sx={{ color: '#667eea' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {vehicle.vehicleNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {vehicle.vehicleType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {vehicle.capacity} kg
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalGasStation sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">{vehicle.fuelType}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDriverName(vehicle.assignedDriver)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vehicle.status === 'in-use' ? 'In Use' : vehicle.status === 'maintenance' ? 'Maintenance' : 'Available'}
                      size="small"
                      color={getStatusColor(vehicle.status)}
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(vehicle)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(vehicle._id)}
                        sx={{ color: '#f44336' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 3, p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No vehicles added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add vehicles from the "Add Vehicle" tab
          </Typography>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Vehicle</DialogTitle>
        <DialogContent>
          {editedVehicle && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={editedVehicle.vehicleNumber}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, vehicleNumber: e.target.value })}
                sx={{ mb: 2 }}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
              <TextField
                fullWidth
                label="Capacity (kg)"
                type="number"
                value={editedVehicle.capacity}
                onChange={(e) => setEditedVehicle({ ...editedVehicle, capacity: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  value={editedVehicle.fuelType}
                  onChange={(e) => setEditedVehicle({ ...editedVehicle, fuelType: e.target.value })}
                  label="Fuel Type"
                >
                  <MenuItem value="Petrol">Petrol</MenuItem>
                  <MenuItem value="Diesel">Diesel</MenuItem>
                  <MenuItem value="CNG">CNG</MenuItem>
                  <MenuItem value="Electric">Electric</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedVehicle.status}
                  onChange={(e) => setEditedVehicle({ ...editedVehicle, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="in-use">In Use</MenuItem>
                  <MenuItem value="maintenance">Under Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiclesList;
