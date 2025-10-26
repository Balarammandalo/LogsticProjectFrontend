import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../services/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  PendingActions,
  Visibility,
  Refresh,
  TrendingUp,
  ShoppingBag,
  AssignmentInd,
  Person,
  DirectionsCar,
  Notifications,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const BookingManagementEnhanced = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inTransit: 0,
    delivered: 0,
    availableDrivers: 0,
    availableVehicles: 0,
  });

  useEffect(() => {
    loadData();
    
    // Initialize Socket.IO
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Admin connected to socket server');
      newSocket.emit('join-admin-room');
    });

    // Listen for delivery completion notifications
    newSocket.on('deliveryCompleted', (data) => {
      console.log('Delivery completed notification:', data);
      setNotification({
        type: 'success',
        message: data.message,
      });
      
      // Refresh data
      loadData();
    });

    // Listen for driver availability updates
    newSocket.on('driverAvailable', (data) => {
      console.log('Driver available:', data);
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver._id === data.driverId
            ? { ...driver, isAvailable: true }
            : driver
        )
      );
      updateStats();
    });

    // Listen for vehicle availability updates
    newSocket.on('vehicleAvailable', (data) => {
      console.log('Vehicle available:', data);
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle._id === data.vehicleId
            ? { ...vehicle, status: 'available' }
            : vehicle
        )
      );
      updateStats();
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load bookings
      const bookingsRes = await axios.get(`${API_URL}/admin/bookings`, { headers });
      setBookings(bookingsRes.data.data || []);

      // Load drivers
      const driversRes = await axios.get(`${API_URL}/admin/drivers`, { headers });
      setDrivers(driversRes.data.data || []);

      // Load vehicles
      const vehiclesRes = await axios.get(`${API_URL}/vehicles`, { headers });
      setVehicles(vehiclesRes.data || []);

      updateStats(bookingsRes.data.data, driversRes.data.data, vehiclesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const updateStats = (bookingList = bookings, driverList = drivers, vehicleList = vehicles) => {
    setStats({
      total: bookingList.length,
      pending: bookingList.filter(b => b.status === 'pending').length,
      assigned: bookingList.filter(b => b.status === 'assigned').length,
      inTransit: bookingList.filter(b => ['on-route', 'picked-up'].includes(b.status)).length,
      delivered: bookingList.filter(b => b.status === 'delivered').length,
      availableDrivers: driverList.filter(d => d.isAvailable).length,
      availableVehicles: vehicleList.filter(v => v.status === 'available').length,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'picked-up':
      case 'on-route':
        return 'info';
      case 'assigned':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
          📦 Booking Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          icon={<Notifications />}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2">
                    Total Bookings
                  </Typography>
                </Box>
                <ShoppingBag sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2">
                    Pending
                  </Typography>
                </Box>
                <PendingActions sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.inTransit}
                  </Typography>
                  <Typography variant="body2">
                    In Transit
                  </Typography>
                </Box>
                <LocalShipping sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.delivered}
                  </Typography>
                  <Typography variant="body2">
                    Delivered
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Driver & Vehicle Availability */}
        <Grid item xs={12} sm={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                    {stats.availableDrivers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Drivers
                  </Typography>
                </Box>
                <Badge badgeContent={stats.availableDrivers} color="success">
                  <Person sx={{ fontSize: 40, color: '#667eea' }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                    {stats.availableVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Vehicles
                  </Typography>
                </Box>
                <Badge badgeContent={stats.availableVehicles} color="success">
                  <DirectionsCar sx={{ fontSize: 40, color: '#667eea' }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bookings Table */}
      <Paper elevation={3}>
        <Box sx={{ p: 2, bgcolor: '#667eea', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            All Bookings
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      #{booking._id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>{booking.customer?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {booking.driver ? (
                      <Box>
                        <Typography variant="body2">{booking.driver.name}</Typography>
                        {booking.driver.isAvailable !== undefined && (
                          <Chip
                            label={booking.driver.isAvailable ? 'Available' : 'Busy'}
                            size="small"
                            color={booking.driver.isAvailable ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Chip label="Unassigned" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.vehicle ? (
                      <Box>
                        <Typography variant="body2">{booking.vehicle.vehicleNumber}</Typography>
                        {booking.vehicle.status && (
                          <Chip
                            label={booking.vehicle.status}
                            size="small"
                            color={booking.vehicle.status === 'available' ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status.toUpperCase().replace('-', ' ')}
                      color={getStatusColor(booking.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {bookings.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No bookings found
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Completed Deliveries Section */}
      <Paper elevation={3} sx={{ mt: 4 }}>
        <Box sx={{ p: 2, bgcolor: '#4CAF50', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            ✅ Completed Deliveries
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Delivered At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings
                .filter(b => b.status === 'delivered')
                .map((booking) => (
                  <TableRow key={booking._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        #{booking._id.slice(-8)}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{booking.driver?.name || 'N/A'}</TableCell>
                    <TableCell>{booking.vehicle?.vehicleNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {booking.deliveredAt ? (
                        <Typography variant="caption">
                          {new Date(booking.deliveredAt).toLocaleString()}
                        </Typography>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {bookings.filter(b => b.status === 'delivered').length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No completed deliveries yet
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default BookingManagementEnhanced;
