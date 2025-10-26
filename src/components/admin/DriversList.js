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
import { Edit, Delete, Phone, Badge } from '@mui/icons-material';

const DriversList = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editedDriver, setEditedDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
    loadVehicles();
  }, []);

  const loadDrivers = () => {
    const storedDrivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    setDrivers(storedDrivers);
  };

  const loadVehicles = () => {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    setVehicles(storedVehicles);
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setEditedDriver({ ...driver });
    setEditDialogOpen(true);
  };

  const handleDelete = (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      const updatedDrivers = drivers.filter(d => d._id !== driverId);
      localStorage.setItem('drivers', JSON.stringify(updatedDrivers));
      loadDrivers();
    }
  };

  const handleSaveEdit = () => {
    const updatedDrivers = drivers.map(d => 
      d._id === editedDriver._id ? editedDriver : d
    );
    localStorage.setItem('drivers', JSON.stringify(updatedDrivers));
    
    // Update vehicle assignment if changed
    if (selectedDriver.assignedVehicle !== editedDriver.assignedVehicle) {
      const updatedVehicles = vehicles.map(v => {
        // Free up old vehicle
        if (v._id === selectedDriver.assignedVehicle) {
          return { ...v, status: 'available', assignedDriver: null };
        }
        // Assign new vehicle
        if (v._id === editedDriver.assignedVehicle) {
          return { ...v, status: 'in-use', assignedDriver: editedDriver._id };
        }
        return v;
      });
      localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
    }
    
    setEditDialogOpen(false);
    loadDrivers();
    loadVehicles();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'on-trip':
        return 'info';
      case 'off-duty':
        return 'default';
      default:
        return 'default';
    }
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    return vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : 'Not Assigned';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
          👥 Drivers List
        </Typography>
        <Chip
          label={`Total: ${drivers.length}`}
          color="primary"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {drivers.length > 0 ? (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                <TableCell><strong>Driver Name</strong></TableCell>
                <TableCell><strong>Mobile</strong></TableCell>
                <TableCell><strong>License Number</strong></TableCell>
                <TableCell><strong>Assigned Vehicle</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow
                  key={driver._id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: driver.status === 'available' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge sx={{ color: '#667eea' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {driver.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">{driver.mobile}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {driver.licenseNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getVehicleInfo(driver.assignedVehicle)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={driver.status}
                      size="small"
                      color={getStatusColor(driver.status)}
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
                        onClick={() => handleEdit(driver)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(driver._id)}
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
            No drivers added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add drivers from the "Add Driver" tab
          </Typography>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Driver</DialogTitle>
        <DialogContent>
          {editedDriver && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Driver Name"
                value={editedDriver.name}
                onChange={(e) => setEditedDriver({ ...editedDriver, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Mobile Number"
                value={editedDriver.mobile}
                onChange={(e) => setEditedDriver({ ...editedDriver, mobile: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="License Number"
                value={editedDriver.licenseNumber}
                onChange={(e) => setEditedDriver({ ...editedDriver, licenseNumber: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Assigned Vehicle</InputLabel>
                <Select
                  value={editedDriver.assignedVehicle || ''}
                  onChange={(e) => setEditedDriver({ ...editedDriver, assignedVehicle: e.target.value })}
                  label="Assigned Vehicle"
                >
                  <MenuItem value="">
                    <em>No Vehicle</em>
                  </MenuItem>
                  {vehicles.filter(v => v.status === 'available' || v._id === editedDriver.assignedVehicle).map((vehicle) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber} - {vehicle.vehicleType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedDriver.status}
                  onChange={(e) => setEditedDriver({ ...editedDriver, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="on-trip">On Trip</MenuItem>
                  <MenuItem value="off-duty">Off Duty</MenuItem>
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

export default DriversList;
