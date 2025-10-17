import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryAPI, vehicleAPI } from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Divider,
  Avatar,
  Checkbox,
} from '@mui/material';
import { LocalShipping, Route as RouteIcon, ArrowBack, CalendarToday, DirectionsCar } from '@mui/icons-material';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const PlanRoutes = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    vehicleId: '',
    driverId: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const vehiclesRes = await vehicleAPI.getVehicles().catch(() => ({ data: [] }));
      setVehicles(vehiclesRes.data || []);

      // Dummy delivery data with expected delivery dates
      const dummyDeliveries = [
        {
          _id: 'del001',
          status: 'pending',
          customer: { name: 'Acme Corporation', email: 'contact@acme.com' },
          pickupLocation: { address: '123 Warehouse St, New York, NY 10001' },
          dropLocation: { address: '456 Business Ave, Brooklyn, NY 11201' },
          packageDetails: 'Electronics - 50kg',
          expectedDeliveryDate: '2025-01-20',
          priority: 'high'
        },
        {
          _id: 'del002',
          status: 'pending',
          customer: { name: 'Tech Solutions Inc', email: 'info@techsol.com' },
          pickupLocation: { address: '789 Industrial Rd, Queens, NY 11354' },
          dropLocation: { address: '321 Office Plaza, Manhattan, NY 10018' },
          packageDetails: 'Office Supplies - 30kg',
          expectedDeliveryDate: '2025-01-21',
          priority: 'medium'
        },
        {
          _id: 'del003',
          status: 'pending',
          customer: { name: 'Global Traders LLC', email: 'orders@globaltraders.com' },
          pickupLocation: { address: '555 Port Authority, Staten Island, NY 10301' },
          dropLocation: { address: '888 Retail Center, Bronx, NY 10451' },
          packageDetails: 'Consumer Goods - 75kg',
          expectedDeliveryDate: '2025-01-19',
          priority: 'urgent'
        },
        {
          _id: 'del004',
          status: 'assigned',
          customer: { name: 'Metro Supplies Co', email: 'support@metrosupplies.com' },
          driver: { name: 'John Smith', _id: 'driver1' },
          vehicle: { vehicleNumber: 'NYC-1234', _id: 'veh1' },
          pickupLocation: { address: '200 Distribution Center, Newark, NJ 07102' },
          dropLocation: { address: '150 Commerce St, Jersey City, NJ 07302' },
          packageDetails: 'Industrial Parts - 120kg',
          expectedDeliveryDate: '2025-01-18',
          priority: 'high'
        },
        {
          _id: 'del005',
          status: 'on-route',
          customer: { name: 'Fresh Foods Market', email: 'delivery@freshfoods.com' },
          driver: { name: 'Sarah Johnson', _id: 'driver2' },
          vehicle: { vehicleNumber: 'NYC-5678', _id: 'veh2' },
          pickupLocation: { address: '777 Farm Road, Long Island, NY 11747' },
          dropLocation: { address: '999 Market Square, Manhattan, NY 10002' },
          packageDetails: 'Perishable Goods - 45kg',
          expectedDeliveryDate: '2025-01-17',
          priority: 'urgent'
        }
      ];

      setDeliveries(dummyDeliveries);
    } catch (error) {
      setError('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDelivery = (delivery) => {
    setSelectedDeliveries(prev => {
      const isSelected = prev.some(d => d._id === delivery._id);
      if (isSelected) {
        return prev.filter(d => d._id !== delivery._id);
      } else {
        if (prev.length >= 4) {
          setError('You can only select up to 4 deliveries at a time');
          return prev;
        }
        return [...prev, delivery];
      }
    });
  };

  const handleOpenAssignDialog = () => {
    if (selectedDeliveries.length === 0) {
      setError('Please select at least one delivery');
      return;
    }
    setAssignDialogOpen(true);
  };

  const handleAssignmentSubmit = async () => {
    if (selectedDeliveries.length === 0) {
      setError('Please select at least one delivery');
      return;
    }

    if (!assignmentData.vehicleId) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setError('');
      
      // Find the selected vehicle
      const vehicle = vehicles.find(v => v._id === assignmentData.vehicleId);
      
      if (!vehicle) {
        setError('Selected vehicle not found');
        return;
      }

      // Update deliveries: move selected ones from pending to assigned/on-route
      const updatedDeliveries = deliveries.map(delivery => {
        const isSelected = selectedDeliveries.some(d => d._id === delivery._id);
        if (isSelected) {
          return {
            ...delivery,
            status: 'assigned',
            vehicle: { vehicleNumber: vehicle.vehicleNumber, _id: vehicle._id },
            driver: { name: 'John Smith', _id: 'driver1' }, // Dummy driver
          };
        }
        return delivery;
      });

      // Update vehicles: mark the assigned vehicle as in-use and remove from available
      const updatedVehicles = vehicles.map(v => {
        if (v._id === assignmentData.vehicleId) {
          return {
            ...v,
            status: 'in-use',
            assignedDriver: 'driver1'
          };
        }
        return v;
      });

      setDeliveries(updatedDeliveries);
      setVehicles(updatedVehicles);
      setSuccess(`Successfully assigned ${selectedDeliveries.length} ${selectedDeliveries.length === 1 ? 'delivery' : 'deliveries'} to ${vehicle.vehicleNumber}!`);
      setAssignDialogOpen(false);
      setSelectedDeliveries([]);
      setAssignmentData({ vehicleId: '', driverId: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign deliveries');
    }
  };

  const getPendingDeliveries = () => {
    return deliveries.filter(d => d.status === 'pending');
  };

  const getAssignedDeliveries = () => {
    return deliveries.filter(d => d.status === 'assigned' || d.status === 'on-route');
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(v => v.status === 'available' && !v.assignedDriver);
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
          Loading route planning...
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
                  <RouteIcon sx={{ fontSize: 28, color: 'white' }} />
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
                    Route Planning
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage deliveries and optimize routes
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
        {/* Pending Deliveries */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                Pending Deliveries ({getPendingDeliveries().length})
              </Typography>
              {selectedDeliveries.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={`${selectedDeliveries.length} selected`}
                    color="primary"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleOpenAssignDialog}
                    sx={{
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      },
                    }}
                  >
                    Assign Selected
                  </Button>
                </Box>
              )}
            </Box>

            <List>
              {getPendingDeliveries().map((delivery) => (
                <React.Fragment key={delivery._id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                      <Checkbox
                        checked={selectedDeliveries.some(d => d._id === delivery._id)}
                        onChange={() => handleToggleDelivery(delivery)}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': {
                            color: '#667eea',
                          },
                        }}
                      />
                      <Avatar
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <LocalShipping sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Delivery #{delivery._id.slice(-3)}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', ml: 7 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Customer:</strong> {delivery.customer?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>From:</strong> {delivery.pickupLocation?.address || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>To:</strong> {delivery.dropLocation?.address || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Package:</strong> {delivery.packageDetails || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#667eea' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                          Expected: {delivery.expectedDeliveryDate}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, width: '100%', ml: 7 }}>
                      <Chip
                        label={delivery.priority?.toUpperCase()}
                        size="small"
                        color={delivery.priority === 'urgent' ? 'error' : delivery.priority === 'high' ? 'warning' : 'default'}
                      />
                      <Chip
                        label={formatStatus(delivery.status)}
                        size="small"
                        sx={{ backgroundColor: getStatusColor(delivery.status) }}
                      />
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {getPendingDeliveries().length === 0 && (
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
                  <LocalShipping sx={{ fontSize: 50, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  No Pending Deliveries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All deliveries have been assigned
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Assigned Deliveries */}
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
              Active Deliveries ({getAssignedDeliveries().length})
            </Typography>

            <List>
              {getAssignedDeliveries().map((delivery) => (
                <React.Fragment key={delivery._id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <RouteIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Delivery #{delivery._id.slice(-3)}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', ml: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Customer:</strong> {delivery.customer?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Driver:</strong> {delivery.driver?.name || 'Not assigned'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Vehicle:</strong> {delivery.vehicle?.vehicleNumber || 'Not assigned'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>To:</strong> {delivery.dropLocation?.address || 'N/A'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#10b981' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                          Expected: {delivery.expectedDeliveryDate}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, ml: 6 }}>
                      <Chip
                        label={delivery.priority?.toUpperCase()}
                        size="small"
                        color={delivery.priority === 'urgent' ? 'error' : delivery.priority === 'high' ? 'warning' : 'default'}
                      />
                      <Chip
                        label={formatStatus(delivery.status)}
                        size="small"
                        color={delivery.status === 'on-route' ? 'success' : 'info'}
                      />
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {getAssignedDeliveries().length === 0 && (
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.2,
                  }}
                >
                  <RouteIcon sx={{ fontSize: 50, color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  No Active Deliveries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assign pending deliveries to get started
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Vehicles */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
              Available Vehicles ({getAvailableVehicles().length})
            </Typography>

            <Grid container spacing={2}>
              {getAvailableVehicles().map((vehicle) => (
                <Grid item xs={12} sm={6} md={4} key={vehicle._id}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: '2px solid rgba(102, 126, 234, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
                        borderColor: '#667eea',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DirectionsCar sx={{ color: '#667eea' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vehicle.vehicleNumber}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Type:</strong> {vehicle.type}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Capacity:</strong> {vehicle.capacity}kg
                      </Typography>
                      <Chip
                        label={vehicle.status}
                        color="success"
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {getAvailableVehicles().length === 0 && (
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
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                  All vehicles are currently assigned to deliveries or in maintenance. Vehicles will become available once deliveries are completed.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        </Grid>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping sx={{ color: '#667eea' }} />
            <Typography variant="h6">
              Assign {selectedDeliveries.length} {selectedDeliveries.length === 1 ? 'Delivery' : 'Deliveries'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Selected Deliveries:
            </Typography>
            
            <Box sx={{ mb: 3, maxHeight: '200px', overflowY: 'auto' }}>
              {selectedDeliveries.map((delivery, index) => (
                <Paper
                  key={delivery._id}
                  sx={{
                    p: 2,
                    mb: 1,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {index + 1}. Delivery #{delivery._id.slice(-3)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    <strong>Customer:</strong> {delivery.customer?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    <strong>To:</strong> {delivery.dropLocation?.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    <strong>Package:</strong> {delivery.packageDetails}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <FormControl fullWidth>
              <InputLabel id="vehicle-select-label">Select Vehicle</InputLabel>
              <Select
                labelId="vehicle-select-label"
                id="vehicle-select"
                value={assignmentData.vehicleId}
                label="Select Vehicle"
                onChange={(e) => setAssignmentData({ ...assignmentData, vehicleId: e.target.value })}
              >
                {vehicles
                  .filter(v => v.status === 'available')
                  .map((vehicle) => (
                    <MenuItem key={vehicle._id} value={vehicle._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsCar sx={{ fontSize: 20, color: '#667eea' }} />
                        <Box>
                          <Typography variant="body1">
                            {vehicle.vehicleNumber} - {vehicle.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Capacity: {vehicle.capacity}kg
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignmentSubmit}
            variant="contained"
            sx={{
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Assign to Vehicle
          </Button>
        </DialogActions>
      </Dialog>

      </Container>
    </Box>
  );
};

export default PlanRoutes;
