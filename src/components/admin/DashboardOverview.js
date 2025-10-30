import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Fade,
} from '@mui/material';
import {
  LocalShipping,
  DirectionsCar,
  People,
  Assignment,
  TrendingUp,
  CheckCircle,
  Schedule,
  Warning,
  Refresh,
  AttachMoney,
} from '@mui/icons-material';
import socketService from '../../services/socket';
import { useAuth } from '../../services/AuthContext';

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up Socket.IO listeners for real-time updates
    try {
      if (user) {
        socketService.connect(user);
        
        setTimeout(() => {
          if (socketService.on) {
            socketService.emit('join-admin-room');
            
            // Listen for events that should trigger dashboard refresh
            socketService.on('new-booking', () => {
              console.log('New booking received, refreshing dashboard...');
              loadDashboardData();
            });
            
            socketService.on('delivery-status-update', () => {
              console.log('Delivery status updated, refreshing dashboard...');
              loadDashboardData();
            });
            
            socketService.on('driver-status-update', () => {
              console.log('Driver status updated, refreshing dashboard...');
              loadDashboardData();
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Socket connection error:', error);
    }
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      try {
        socketService.disconnect();
      } catch (error) {
        console.error('Socket disconnect error:', error);
      }
    };
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      console.log('Dashboard data loaded:', data);
      
      setStats(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.bookings.total,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Active Deliveries',
      value: stats.bookings.active,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#f093fb',
      bgColor: 'rgba(240, 147, 251, 0.1)',
    },
    {
      title: 'Completed',
      value: stats.bookings.completed,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Pending Bookings',
      value: stats.bookings.pending,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
    {
      title: 'Total Vehicles',
      value: stats.vehicles.total,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
    },
    {
      title: 'Available Vehicles',
      value: stats.vehicles.available,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Total Drivers',
      value: stats.drivers.total,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Active Drivers',
      value: stats.drivers.active,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
  ];

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
          📊 Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <IconButton onClick={loadDashboardData} disabled={loading} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mt: 1 }}>
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

      {/* Vehicle Availability Progress */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🚗 Vehicle Availability
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Available</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {stats.vehicles.available} / {stats.vehicles.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.vehicles.total > 0 ? (stats.vehicles.available / stats.vehicles.total) * 100 : 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.vehicles.total > 0
                  ? `${Math.round((stats.vehicles.available / stats.vehicles.total) * 100)}% vehicles available`
                  : 'No vehicles added yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                👥 Driver Availability
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Active</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {stats.drivers.active} / {stats.drivers.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.drivers.total > 0 ? (stats.drivers.active / stats.drivers.total) * 100 : 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#2196f3',
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.drivers.total > 0
                  ? `${Math.round((stats.drivers.active / stats.drivers.total) * 100)}% drivers active`
                  : 'No drivers added yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            📦 Recent Bookings
          </Typography>
          {stats.recentBookings && stats.recentBookings.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Order ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>Route</strong></TableCell>
                    <TableCell><strong>Vehicle</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Payment</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentBookings.map((booking) => (
                    <TableRow key={booking._id} hover>
                      <TableCell>#{booking._id.slice(-6)}</TableCell>
                      <TableCell>{booking.customerName || booking.customer?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {booking.pickupLocation?.address?.split(',')[0] || booking.pickupLocation}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          → {booking.dropLocation?.address?.split(',')[0] || booking.dropLocation}
                        </Typography>
                      </TableCell>
                      <TableCell>{booking.vehicleType}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          size="small"
                          color={getStatusColor(booking.status)}
                        />
                      </TableCell>
                      <TableCell>₹{booking.payment?.amount || booking.payment || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No bookings yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardOverview;
