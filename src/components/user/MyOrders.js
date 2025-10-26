import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../services/AuthContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Schedule,
  Person,
  DirectionsCar,
  LocationOn,
  MyLocation,
  Inventory2,
  Phone,
  Close,
  AccessTime,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadOrders();
    
    // Initialize Socket.IO for real-time updates
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      // Join customer room
      newSocket.emit('join-customer-room', user._id);
    });

    newSocket.on('deliveryCompleted', (data) => {
      console.log('Delivery completed notification:', data);
      // Update order status in real-time
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, status: 'delivered', deliveredAt: data.deliveredAt }
            : order
        )
      );
      
      // Show notification
      alert(`✅ Your order #${data.orderId.slice(-8)} has been delivered!`);
    });

    newSocket.on('statusUpdate', (data) => {
      console.log('Status update:', data);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter orders for this customer
      const customerOrders = response.data.filter(
        order => order.customer?._id === user._id || order.customer === user._id
      );

      setOrders(customerOrders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
      setLoading(false);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle />;
      case 'picked-up':
      case 'on-route':
        return <LocalShipping />;
      case 'assigned':
        return <Schedule />;
      default:
        return <Inventory2 />;
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsDialog(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
        📦 My Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} md={6} key={order._id}>
            <Card
              elevation={3}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Order #{order._id.slice(-8)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={order.status.toUpperCase().replace('-', ' ')}
                    color={getStatusColor(order.status)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Locations */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <MyLocation sx={{ color: '#4CAF50', mr: 1, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Pickup
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.pickupLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationOn sx={{ color: '#f44336', mr: 1, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Delivery
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.dropLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Driver Info (if assigned) */}
                {order.driver && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Person sx={{ fontSize: 18, mr: 1, color: '#667eea' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Driver: {order.driver.name}
                      </Typography>
                    </Box>
                    {order.vehicle && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCar sx={{ fontSize: 18, mr: 1, color: '#667eea' }} />
                        <Typography variant="body2" color="text.secondary">
                          {order.vehicle.vehicleNumber} - {order.vehicle.vehicleType}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Delivered Status */}
                {order.status === 'delivered' && order.deliveredAt && (
                  <Alert
                    severity="success"
                    icon={<CheckCircle />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ✅ Delivered
                    </Typography>
                    <Typography variant="caption">
                      {new Date(order.deliveredAt).toLocaleString()}
                    </Typography>
                  </Alert>
                )}

                {/* Action Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleViewDetails(order)}
                  sx={{ mt: 1 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {orders.length === 0 && (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <Inventory2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your orders will appear here once you book a delivery
          </Typography>
        </Paper>
      )}

      {/* Order Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', fontWeight: 700 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📦 Order Details</span>
            <Chip
              label={selectedOrder?.status.toUpperCase().replace('-', ' ')}
              color={getStatusColor(selectedOrder?.status)}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box>
              {/* Order ID and Date */}
              <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                <Typography variant="body2" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  #{selectedOrder._id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </Typography>
              </Paper>

              {/* Delivery Status */}
              {selectedOrder.status === 'delivered' && selectedOrder.deliveredAt && (
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ✅ Delivery Completed
                  </Typography>
                  <Typography variant="body2">
                    Delivered on: {new Date(selectedOrder.deliveredAt).toLocaleString()}
                  </Typography>
                </Alert>
              )}

              {/* Driver & Vehicle Details */}
              {selectedOrder.driver && (
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                    Driver & Vehicle Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Person color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Driver Name"
                        secondary={selectedOrder.driver.name}
                      />
                    </ListItem>
                    {selectedOrder.driver.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Driver Phone"
                          secondary={selectedOrder.driver.phone}
                        />
                      </ListItem>
                    )}
                    {selectedOrder.vehicle && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <DirectionsCar color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Vehicle Number"
                            secondary={selectedOrder.vehicle.vehicleNumber}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocalShipping color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Vehicle Type"
                            secondary={selectedOrder.vehicle.vehicleType}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Paper>
              )}

              {/* Locations */}
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                  Delivery Route
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <MyLocation sx={{ color: '#4CAF50', mr: 1, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Pickup Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder.pickupLocation?.address}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationOn sx={{ color: '#f44336', mr: 1, mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Drop Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedOrder.dropLocation?.address}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {selectedOrder.distance && (
                  <Typography variant="body2" color="text.secondary">
                    📏 Distance: {selectedOrder.distance} km
                  </Typography>
                )}
              </Paper>

              {/* Package Details */}
              {selectedOrder.packageDetails && (
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                    Package Information
                  </Typography>
                  <List dense>
                    {selectedOrder.packageDetails.description && (
                      <ListItem>
                        <ListItemIcon>
                          <Inventory2 color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Description"
                          secondary={selectedOrder.packageDetails.description}
                        />
                      </ListItem>
                    )}
                    {selectedOrder.packageDetails.weight && (
                      <ListItem>
                        <ListItemText
                          primary="Weight"
                          secondary={`${selectedOrder.packageDetails.weight} kg`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDetailsDialog(false)}
            variant="contained"
            startIcon={<Close />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyOrders;
