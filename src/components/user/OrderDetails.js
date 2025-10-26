import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  Alert,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  CheckCircle,
  PendingActions,
  LocationOn,
  MyLocation,
  Phone,
  Email,
  CalendarToday,
  Payment as PaymentIcon,
  DirectionsCar,
} from '@mui/icons-material';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = () => {
    try {
      const getUserKey = (baseKey) => {
        const userId = user?.id || user?.email || 'default';
        return `${baseKey}_${userId}`;
      };

      const customerOrders = JSON.parse(localStorage.getItem(getUserKey('customerOrders')) || '[]');
      const foundOrder = customerOrders.find(o => o._id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        // Try shared orders
        const sharedOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        const sharedOrder = sharedOrders.find(o => o._id === orderId);
        if (sharedOrder) {
          setOrder(sharedOrder);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-transit':
        return 'info';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        label: 'Order Placed',
        status: 'completed',
        icon: <CheckCircle />,
        time: order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
      },
      {
        label: 'In Transit',
        status: order?.status === 'in-transit' || order?.status === 'delivered' ? 'completed' : order?.status === 'pending' ? 'pending' : 'pending',
        icon: <LocalShipping />,
        time: order?.status === 'in-transit' || order?.status === 'delivered' ? (order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'In Progress') : 'Pending',
      },
      {
        label: 'Delivered',
        status: order?.status === 'delivered' ? 'completed' : 'pending',
        icon: <CheckCircle />,
        time: order?.status === 'delivered' ? (order?.deliveredAt || order?.expectedDeliveryDate || 'Completed') : 'Expected: ' + (order?.expectedDeliveryDate || 'TBD'),
      },
    ];
    return steps;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5">Order not found</Typography>
        <Button variant="contained" component={Link} to="/user">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate('/user')}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order ID: #{order._id.slice(-8)}
              </Typography>
            </Box>
            <Chip
              label={getStatusLabel(order.status)}
              color={getStatusColor(order.status)}
              sx={{ fontWeight: 600, fontSize: '1rem', px: 2, py: 2.5 }}
            />
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column - Order Info */}
          <Grid item xs={12} md={6}>
            {/* Locations Card */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📍 Route Details
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <MyLocation sx={{ color: '#4caf50', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pickup Location
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {order.pickupLocation?.address || order.pickupLocation}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <LocationOn sx={{ color: '#f44336', mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Drop Location
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {order.dropLocation?.address || order.dropLocation}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Map Placeholder */}
              <Box
                sx={{
                  width: '100%',
                  height: 250,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed rgba(102, 126, 234, 0.3)',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <LocationOn sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Map View
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Distance: {order.distance || 'N/A'} km
                  </Typography>
                </Box>
              </Box>

              {order.currentLocation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Current Location: {order.currentLocation}
                  </Typography>
                </Alert>
              )}
            </Paper>

            {/* Package Details */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📦 Package Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Vehicle Type
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <DirectionsCar sx={{ color: '#667eea' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {order.vehicleType}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Package Info
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {order.packageDetails}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Expected Delivery
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 18, color: '#667eea' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {order.expectedDeliveryDate}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <PaymentIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      ₹{order.payment}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {order.paymentMethod}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column - Timeline */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                🚚 Delivery Timeline
              </Typography>
              <Stack spacing={3}>
                {getTimelineSteps().map((step, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                    {/* Connector Line */}
                    {index < getTimelineSteps().length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 19,
                          top: 40,
                          width: 2,
                          height: 'calc(100% + 12px)',
                          background: step.status === 'completed' ? '#4caf50' : '#e0e0e0',
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: step.status === 'completed' ? '#4caf50' : '#e0e0e0',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: step.status === 'completed' ? '0 0 0 4px rgba(76, 175, 80, 0.2)' : 'none',
                        zIndex: 1,
                      }}
                    >
                      {step.icon}
                    </Box>
                    
                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Customer Support */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mt: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                💬 Need Help?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contact our support team for any queries
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Phone />}
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Call Support
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Email Us
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default OrderDetails;
