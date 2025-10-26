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
} from '@mui/icons-material';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalDrivers: 0,
    activeDrivers: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    loadStats();
    loadRecentBookings();
  }, []);

  const loadStats = () => {
    // Load from localStorage
    const bookings = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');

    setStats({
      totalBookings: bookings.length,
      activeDeliveries: bookings.filter(b => b.status === 'in-transit' || b.status === 'on-route').length,
      completedDeliveries: bookings.filter(b => b.status === 'delivered').length,
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.status === 'available').length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active' || d.status === 'on-trip').length,
    });
  };

  const loadRecentBookings = () => {
    const bookings = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    setRecentBookings(bookings.slice(-5).reverse());
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#f093fb',
      bgColor: 'rgba(240, 147, 251, 0.1)',
    },
    {
      title: 'Completed',
      value: stats.completedDeliveries,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
    {
      title: 'Available Vehicles',
      value: stats.availableVehicles,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
    {
      title: 'Pending Bookings',
      value: stats.totalBookings - stats.activeDeliveries - stats.completedDeliveries,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
        📊 Dashboard Overview
      </Typography>

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
                    {stats.availableVehicles} / {stats.totalVehicles}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalVehicles > 0 ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0}
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
                {stats.totalVehicles > 0
                  ? `${Math.round((stats.availableVehicles / stats.totalVehicles) * 100)}% vehicles available`
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
                    {stats.activeDrivers} / {stats.totalDrivers}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalDrivers > 0 ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}
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
                {stats.totalDrivers > 0
                  ? `${Math.round((stats.activeDrivers / stats.totalDrivers) * 100)}% drivers active`
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
          {recentBookings.length > 0 ? (
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
                  {recentBookings.map((booking) => (
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
                      <TableCell>₹{booking.payment}</TableCell>
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
