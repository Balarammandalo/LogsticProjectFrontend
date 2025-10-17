import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI, deliveryAPI } from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fade,
  Avatar,
  Chip,
} from '@mui/material';
import { PersonAdd, DirectionsCar, ArrowBack } from '@mui/icons-material';

const AssignDriver = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [currentAssignments, setCurrentAssignments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load vehicles from localStorage (includes newly added vehicles)
      const adminVehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
      const vehiclesRes = await vehicleAPI.getVehicles().catch(() => ({ data: [] }));
      const allVehicles = adminVehicles.length > 0 ? adminVehicles : vehiclesRes.data || [];
      setVehicles(allVehicles);

      // Load drivers from localStorage (includes newly registered drivers)
      const approvedDrivers = JSON.parse(localStorage.getItem('approvedDrivers') || '[]');
      
      // Dummy driver data for fallback
      const dummyDrivers = [
        {
          _id: 'driver1',
          name: 'John Smith',
          email: 'john.smith@logistics.com',
          phone: '+1-555-0101',
          status: 'available'
        },
        {
          _id: 'driver2',
          name: 'Sarah Johnson',
          email: 'sarah.j@logistics.com',
          phone: '+1-555-0102',
          status: 'available'
        },
        {
          _id: 'driver3',
          name: 'Michael Brown',
          email: 'michael.b@logistics.com',
          phone: '+1-555-0103',
          status: 'available'
        }
      ];

      // Merge approved drivers with dummy drivers
      const formattedApprovedDrivers = approvedDrivers.map(d => ({
        _id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        status: 'available'
      }));
      
      const allDrivers = [...formattedApprovedDrivers, ...dummyDrivers];
      // Remove duplicates by email
      const uniqueDrivers = Array.from(new Map(allDrivers.map(d => [d.email, d])).values());
      setDrivers(uniqueDrivers);

      // Dummy current assignments
      // Load assignments from localStorage or use dummy data
      const savedAssignments = localStorage.getItem('driverAssignments');
      const dummyAssignments = [
        {
          vehicleNumber: 'ABC-1234',
          vehicleType: 'Truck',
          driverName: 'John Smith',
          assignedDate: '2024-01-15'
        },
        {
          vehicleNumber: 'XYZ-5678',
          vehicleType: 'Van',
          driverName: 'Sarah Johnson',
          assignedDate: '2024-01-14'
        }
      ];

      const assignments = savedAssignments ? JSON.parse(savedAssignments) : dummyAssignments;
      setCurrentAssignments(assignments);
    } catch (error) {
      setError('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedVehicle || !selectedDriver) {
      setError('Please select both vehicle and driver');
      return;
    }

    setError('');
    setSuccess('');
    setAssigning(true);

    try {
      // Find the selected vehicle and driver
      const vehicle = vehicles.find(v => v._id === selectedVehicle);
      const driver = drivers.find(d => d._id === selectedDriver);

      if (!vehicle || !driver) {
        setError('Invalid vehicle or driver selection');
        setAssigning(false);
        return;
      }

      // Create new assignment
      const newAssignment = {
        vehicleId: vehicle._id || vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.type,
        driverId: driver._id,
        driverName: driver.name,
        assignedDate: new Date().toISOString().split('T')[0]
      };

      // Add to current assignments
      const updatedAssignments = [...currentAssignments, newAssignment];
      setCurrentAssignments(updatedAssignments);

      // Update vehicle to mark as assigned and in-use
      const updatedVehicles = vehicles.map(v => 
        (v._id === selectedVehicle || v.id === selectedVehicle)
          ? { ...v, assignedDriver: selectedDriver, status: 'in-use' }
          : v
      );
      setVehicles(updatedVehicles);
      
      // Save updated vehicles to localStorage
      localStorage.setItem('adminVehicles', JSON.stringify(updatedVehicles));

      // Save to localStorage to update dashboard
      localStorage.setItem('driverAssignments', JSON.stringify(updatedAssignments));
      localStorage.setItem('lastAssignmentUpdate', Date.now().toString());

      setSuccess('Driver assigned successfully!');

      // Reset selections
      setSelectedVehicle('');
      setSelectedDriver('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const getVehicleById = (id) => vehicles.find(v => v._id === id);
  const getDriverById = (id) => drivers.find(d => d._id === id);

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
          Loading...
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
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  <PersonAdd sx={{ fontSize: 28, color: 'white' }} />
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
                    Assign Driver to Vehicle
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage driver and vehicle assignments
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/admin')}
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
                Back
              </Button>
            </Box>
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

        <Grid container spacing={3}>
        {/* Assignment Form */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
              Assign Driver
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="vehicle-label">Select Vehicle</InputLabel>
              <Select
                labelId="vehicle-label"
                id="vehicle"
                value={selectedVehicle}
                label="Select Vehicle"
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle._id} value={vehicle._id}>
                    {vehicle.vehicleNumber} - {vehicle.type} ({vehicle.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="driver-label">Select Driver</InputLabel>
              <Select
                labelId="driver-label"
                id="driver"
                value={selectedDriver}
                label="Select Driver"
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.name} - {driver.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAssign}
              disabled={assigning || !selectedVehicle || !selectedDriver}
              fullWidth
              sx={{
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
              {assigning ? 'Assigning...' : 'Assign Driver'}
            </Button>
          </Paper>
        </Grid>

        {/* Current Assignments */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
              Current Assignments
            </Typography>

            <List>
              {currentAssignments.map((assignment, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`${assignment.vehicleNumber} - ${assignment.vehicleType}`}
                      secondary={`Assigned to: ${assignment.driverName} (Since: ${assignment.assignedDate})`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {currentAssignments.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.2,
                  }}
                >
                  <PersonAdd sx={{ fontSize: 50, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  No Current Assignments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assign drivers to vehicles to see them here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Vehicles */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
              Available Vehicles
            </Typography>

            <List>
              {vehicles
                .filter(vehicle => !vehicle.assignedDriver && (vehicle.status === 'available' || !vehicle.status))
                .map((vehicle) => (
                  <React.Fragment key={vehicle._id}>
                    <ListItem>
                      <ListItemText
                        primary={`${vehicle.vehicleNumber} - ${vehicle.type}`}
                        secondary={`Capacity: ${vehicle.capacity}kg`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>

            {vehicles.filter(vehicle => !vehicle.assignedDriver && (vehicle.status === 'available' || !vehicle.status)).length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.2,
                  }}
                >
                  <DirectionsCar sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  No Available Vehicles
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All vehicles are currently assigned or in maintenance
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Drivers */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
              Available Drivers
            </Typography>

            <List>
              {drivers
                .filter(driver => !vehicles.some(v => v.assignedDriver === driver._id))
                .map((driver) => {
                return (
                  <React.Fragment key={driver._id}>
                    <ListItem>
                      <Avatar
                        sx={{
                          mr: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: 48,
                          height: 48,
                        }}
                      >
                        {driver.name.charAt(0)}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {driver.name}
                            </Typography>
                            <Chip
                              label="Available"
                              size="small"
                              color="success"
                              sx={{ height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {driver.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.phone}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>

            {drivers.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.2,
                  }}
                >
                  <PersonAdd sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  No Drivers Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add drivers to your fleet to get started
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AssignDriver;
