import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  AccountBalanceWallet,
  TrendingUp,
  DirectionsCar,
  Notifications,
  Person,
  Edit,
  Visibility,
  Add,
  Warning,
} from '@mui/icons-material';
import BrandedHeader from '../common/BrandedHeader';
import { BRAND } from '../../constants/branding';

const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike', capacity: 200 },
  { value: 'van', label: 'Van', capacity: 500 },
  { value: 'mini-truck', label: 'Mini Truck', capacity: 1500 },
  { value: 'truck', label: 'Truck', capacity: 5000 },
  { value: 'lorry', label: 'Lorry', capacity: 10000 },
];

const DriverDashboardNew = () => {
  const { user, logout } = useAuth();
  const [driverData, setDriverData] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completed: 0,
    active: 0,
    pending: 0,
    availableBalance: 0,
    totalEarnings: 0,
    pendingAmount: 0,
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    vehicleType: 'bike',
    vehicleNumber: '',
    capacity: 200,
    fuelType: 'Petrol',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadDriverData();
    loadDeliveries();
    checkVehicle();
  }, [user]);

  const loadDriverData = () => {
    if (!user) return;
    
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const driver = drivers.find(d => d.email === user.email);
    
    if (driver) {
      setDriverData(driver);
      setIsAvailable(driver.status === 'available' || driver.status === 'on-trip');
    }
  };

  const loadDeliveries = () => {
    if (!user) return;

    const allOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const driver = drivers.find(d => d.email === user.email);

    if (!driver) return;

    const driverOrders = allOrders.filter(order => 
      order.assignedDriver && order.assignedDriver.id === driver._id
    );

    setDeliveries(driverOrders);
    calculateStats(driverOrders);
  };

  const calculateStats = (orders) => {
    const completed = orders.filter(o => o.status === 'delivered');
    const active = orders.filter(o => o.status === 'in-transit' || o.status === 'on-route');
    const pending = orders.filter(o => o.status === 'pending');

    const availableBalance = completed.reduce((sum, o) => sum + (o.payment || 0), 0);
    const totalEarnings = availableBalance;
    const pendingAmount = active.reduce((sum, o) => sum + (o.payment || 0), 0);

    setStats({
      totalDeliveries: orders.length,
      completed: completed.length,
      active: active.length,
      pending: pending.length,
      availableBalance,
      totalEarnings,
      pendingAmount,
    });
  };

  const checkVehicle = () => {
    if (!user) return;

    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const driver = drivers.find(d => d.email === user.email);

    if (driver && driver.assignedVehicle) {
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const vehicle = vehicles.find(v => v._id === driver.assignedVehicle);
      
      if (vehicle) {
        setHasVehicle(true);
        setVehicleData({
          vehicleType: vehicle.vehicleType,
          vehicleNumber: vehicle.vehicleNumber,
          capacity: vehicle.capacity,
          fuelType: vehicle.fuelType,
        });
      }
    }
  };

  const handleAvailabilityToggle = () => {
    if (!user) return;

    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const updatedDrivers = drivers.map(d => {
      if (d.email === user.email) {
        const newStatus = isAvailable ? 'off-duty' : 'available';
        return { ...d, status: newStatus };
      }
      return d;
    });

    localStorage.setItem('drivers', JSON.stringify(updatedDrivers));
    setIsAvailable(!isAvailable);
    setSuccessMessage(isAvailable ? 'You are now offline' : 'You are now available for deliveries');
  };

  const handleVehicleSave = () => {
    if (!vehicleData.vehicleNumber) {
      alert('Please enter vehicle number');
      return;
    }

    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const driver = drivers.find(d => d.email === user.email);

    if (!driver) return;

    let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    
    if (hasVehicle && driver.assignedVehicle) {
      vehicles = vehicles.map(v => {
        if (v._id === driver.assignedVehicle) {
          return { ...v, ...vehicleData };
        }
        return v;
      });
    } else {
      const newVehicle = {
        _id: 'veh' + Date.now(),
        ...vehicleData,
        status: 'in-use',
        assignedDriver: driver._id,
        createdAt: new Date().toISOString(),
      };
      vehicles.push(newVehicle);

      const updatedDrivers = drivers.map(d => {
        if (d._id === driver._id) {
          return { ...d, assignedVehicle: newVehicle._id };
        }
        return d;
      });
      localStorage.setItem('drivers', JSON.stringify(updatedDrivers));
    }

    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    setHasVehicle(true);
    setVehicleDialogOpen(false);
    setSuccessMessage('Vehicle saved successfully!');
    checkVehicle();
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'in-transit':
      case 'on-route':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const statCards = [
    {
      title: 'Total Deliveries',
      value: stats.totalDeliveries,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
  ];

  const earningsCards = [
    {
      title: 'Available Balance',
      value: `₹${stats.availableBalance}`,
      subtitle: `From ${stats.completed} completed deliveries`,
      icon: <AccountBalanceWallet sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Total Earnings',
      value: `₹${stats.totalEarnings}`,
      subtitle: 'All-time earnings',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Pending Amount',
      value: `₹${stats.pendingAmount}`,
      subtitle: `${stats.active} deliveries in progress`,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: BRAND.backgrounds.map, backgroundColor: '#f5f7fa' }}>
      {/* Branded Header */}
      <BrandedHeader
        user={user}
        onLogout={logout}
        role="driver"
        additionalContent={
          <FormControlLabel
            control={
              <Switch
                checked={isAvailable}
                onChange={handleAvailabilityToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4caf50',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4caf50',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {isAvailable ? '🟢 Available' : '🔴 Offline'}
              </Typography>
            }
          />
        }
      />

      <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
        {/* Vehicle Info/Warning */}
        {!hasVehicle && (
          <Alert
            severity="info"
            icon={<DirectionsCar />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setVehicleDialogOpen(true)}
                startIcon={<Add />}
              >
                Add Vehicle
              </Button>
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              You can add your own vehicle (optional). Admin can also assign you a vehicle for deliveries.
            </Typography>
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: card.color, mt: 1 }}>
                        {card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: card.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Earnings Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {earningsCards.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mt: 1 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.subtitle}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: card.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Vehicle Section */}
        <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🚗 My Vehicle
              </Typography>
              <Button
                variant="outlined"
                startIcon={hasVehicle ? <Edit /> : <Add />}
                onClick={() => setVehicleDialogOpen(true)}
              >
                {hasVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </Button>
            </Box>
            {hasVehicle ? (
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {vehicleData.vehicleType}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {vehicleData.vehicleNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Capacity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {vehicleData.capacity} kg
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Fuel Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {vehicleData.fuelType}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                No vehicle added yet. Please add your vehicle to start accepting deliveries.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Deliveries Table */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📦 Your Deliveries
            </Typography>
            {deliveries.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                      <TableCell><strong>ID</strong></TableCell>
                      <TableCell><strong>Customer</strong></TableCell>
                      <TableCell><strong>Route</strong></TableCell>
                      <TableCell><strong>Payment</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery._id} hover>
                        <TableCell>#{delivery._id.slice(-6)}</TableCell>
                        <TableCell>{delivery.customerName || delivery.customer?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            {delivery.pickupLocation?.address?.split(',')[0] || delivery.pickupLocation}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            → {delivery.dropLocation?.address?.split(',')[0] || delivery.dropLocation}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            ₹{delivery.payment}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={delivery.status}
                            size="small"
                            color={getStatusColor(delivery.status)}
                            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(delivery)}
                            sx={{ color: '#667eea' }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No deliveries assigned yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Wait for admin to assign deliveries to you
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Dialog */}
        <Dialog open={vehicleDialogOpen} onClose={() => setVehicleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{hasVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                select
                fullWidth
                label="Vehicle Type"
                value={vehicleData.vehicleType}
                onChange={(e) => {
                  const selected = VEHICLE_TYPES.find(t => t.value === e.target.value);
                  setVehicleData({
                    ...vehicleData,
                    vehicleType: e.target.value,
                    capacity: selected?.capacity || vehicleData.capacity,
                  });
                }}
                sx={{ mb: 2 }}
              >
                {VEHICLE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={vehicleData.vehicleNumber}
                onChange={(e) => setVehicleData({ ...vehicleData, vehicleNumber: e.target.value.toUpperCase() })}
                placeholder="e.g., MH01AB1234"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Capacity (kg)"
                type="number"
                value={vehicleData.capacity}
                onChange={(e) => setVehicleData({ ...vehicleData, capacity: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                fullWidth
                label="Fuel Type"
                value={vehicleData.fuelType}
                onChange={(e) => setVehicleData({ ...vehicleData, fuelType: e.target.value })}
              >
                <MenuItem value="Petrol">Petrol</MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
                <MenuItem value="CNG">CNG</MenuItem>
                <MenuItem value="Electric">Electric</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVehicleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVehicleSave} variant="contained">
              Save Vehicle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delivery Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogContent>
            {selectedDelivery && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Order ID:</strong> #{selectedDelivery._id.slice(-6)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Customer:</strong> {selectedDelivery.customerName || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Pickup:</strong> {selectedDelivery.pickupLocation?.address || selectedDelivery.pickupLocation}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Drop:</strong> {selectedDelivery.dropLocation?.address || selectedDelivery.dropLocation}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Payment:</strong> ₹{selectedDelivery.payment}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> {selectedDelivery.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Vehicle Type:</strong> {selectedDelivery.vehicleType}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default DriverDashboardNew;
