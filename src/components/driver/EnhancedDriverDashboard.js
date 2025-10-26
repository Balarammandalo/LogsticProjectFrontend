import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  TrendingUp,
  DirectionsCar,
  Person,
  Phone,
  Notifications,
  Logout,
  LocationOn,
  MyLocation,
  Inventory2,
  AttachMoney,
  Close,
  Visibility,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const EnhancedDriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedCount: 0,
    pendingPayments: 0,
    totalDeliveries: 0,
    activeDeliveries: 0,
  });
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [socket, setSocket] = useState(null);
  const [assignmentNotification, setAssignmentNotification] = useState(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  useEffect(() => {
    loadData();
    
    // Initialize Socket.IO
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Driver connected to socket server');
      newSocket.emit('join-driver-room', user._id);
    });

    newSocket.on('driver-connected', (data) => {
      console.log('Driver connection confirmed:', data);
    });

    newSocket.on('driverAssigned', (data) => {
      console.log('New delivery assigned:', data);
      
      // Show toast notification
      setNotification({
        type: 'info',
        message: `🚚 New delivery assigned! Check your dashboard for details.`,
      });
      
      // Show detailed assignment dialog
      setAssignmentNotification({
        bookingId: data.bookingId,
        pickup: data.pickup?.address || 'N/A',
        drop: data.drop?.address || 'N/A',
        distance: data.estimatedDistanceKm || 'N/A',
        vehicleType: data.vehicleType || 'N/A',
        payment: data.payment || 0,
        packageDetails: data.packageDetails || 'N/A',
      });
      setShowAssignmentDialog(true);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Audio not available');
      }
      
      loadData(); // Refresh data
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load deliveries
      const deliveriesRes = await axios.get(`${API_URL}/driver/deliveries`, { headers });
      const allDeliveries = deliveriesRes.data.data || [];
      
      setActiveDeliveries(allDeliveries.filter(d => 
        ['assigned', 'on-route', 'picked-up'].includes(d.status)
      ));

      // Load completed deliveries
      const allDeliveriesRes = await axios.get(`${API_URL}/deliveries`, { headers });
      const completed = (allDeliveriesRes.data || []).filter(d => 
        d.driver?._id === user._id && d.status === 'delivered'
      );
      setCompletedDeliveries(completed);

      // Load stats
      const statsRes = await axios.get(`${API_URL}/driver/stats`, { headers });
      setStats({
        totalEarnings: statsRes.data.data.totalEarnings || 0,
        completedCount: statsRes.data.data.completedDeliveries || 0,
        pendingPayments: 0, // Calculate from payment status
        totalDeliveries: statsRes.data.data.totalDeliveries || 0,
        activeDeliveries: allDeliveries.length,
      });

      // Load vehicle info (if assigned)
      // This would come from the driver's profile or assignment
      setVehicle({
        number: 'mh123451',
        type: 'Mini-Truck',
        status: 'Available',
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedDelivery) return;

    setCompleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/driver/deliver/${selectedDelivery._id}`,
        { deliveredAt: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotification({
          type: 'success',
          message: '✅ Delivery marked as completed successfully!',
        });
        setConfirmDialog(false);
        setSelectedDelivery(null);
        loadData(); // Refresh data
      }
    } catch (err) {
      console.error('Error marking as delivered:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to mark as delivered',
      });
    } finally {
      setCompleting(false);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#667eea', color: 'white', py: 2, px: 3, boxShadow: 2 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
              onClick={() => navigate('/')}
            >
              <LocalShipping sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                TrackMate - Driver Portal
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<CheckCircle />}
                label="Available"
                color="success"
                sx={{ fontWeight: 600 }}
              />
              <Badge badgeContent={activeDeliveries.length} color="error">
                <Notifications sx={{ fontSize: 28 }} />
              </Badge>
              <Avatar sx={{ bgcolor: '#764ba2' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption">
                  {user?.phone}
                </Typography>
              </Box>
              <IconButton onClick={logout} sx={{ color: 'white' }}>
                <Logout />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
            sx={{ width: '100%' }}
          >
            {notification?.message}
          </Alert>
        </Snackbar>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.totalDeliveries}
                    </Typography>
                    <Typography variant="body2">
                      Total Deliveries
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
                      {stats.completedCount}
                    </Typography>
                    <Typography variant="body2">
                      Completed
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
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
                      {stats.activeDeliveries}
                    </Typography>
                    <Typography variant="body2">
                      Active
                    </Typography>
                  </Box>
                  <Schedule sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      ₹{stats.totalEarnings}
                    </Typography>
                    <Typography variant="body2">
                      Total Earnings
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Driver Profile & Vehicle Info */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Driver Profile
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#667eea', fontSize: 28 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {user?.phone || user?.email}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Deliveries
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stats.totalDeliveries}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                      {stats.completedCount}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                  <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
                  My Vehicle
                </Typography>
                {vehicle ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle Number
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vehicle.number.toUpperCase()}
                        </Typography>
                      </Box>
                      <Chip
                        label={vehicle.status}
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Vehicle Type
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {vehicle.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fuel Type
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Petrol
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <Alert severity="info">No vehicle assigned yet</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Active and Completed Deliveries */}
        <Paper elevation={3}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: '#667eea',
              '& .MuiTab-root': { color: 'white', fontWeight: 600 },
              '& .Mui-selected': { color: 'white !important' },
            }}
          >
            <Tab
              label={
                <Badge badgeContent={activeDeliveries.length} color="error">
                  Active Deliveries
                </Badge>
              }
            />
            <Tab label={`Completed Deliveries (${completedDeliveries.length})`} />
          </Tabs>

          {/* Active Deliveries Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {activeDeliveries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No active deliveries
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New deliveries will appear here when assigned
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeDeliveries.map((delivery) => (
                        <TableRow key={delivery._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              #{delivery._id.slice(-6)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{delivery.customer?.name || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {delivery.customer?.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                <MyLocation sx={{ fontSize: 12, color: '#4CAF50', mr: 0.5 }} />
                                {delivery.pickupLocation?.address?.substring(0, 30)}...
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                <LocationOn sx={{ fontSize: 12, color: '#f44336', mr: 0.5 }} />
                                {delivery.dropLocation?.address?.substring(0, 30)}...
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                              ₹{delivery.payment?.amount || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={delivery.status.toUpperCase().replace('-', ' ')}
                              color={getStatusColor(delivery.status)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/driver/delivery/${delivery._id}/complete`)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              {delivery.status === 'picked-up' && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => {
                                    setSelectedDelivery(delivery);
                                    setConfirmDialog(true);
                                  }}
                                  sx={{ fontWeight: 600 }}
                                >
                                  Product Was Delivered
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Completed Deliveries Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              {completedDeliveries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No completed deliveries yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Delivered At</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Earnings</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedDeliveries.map((delivery) => (
                        <TableRow key={delivery._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              #{delivery._id.slice(-6)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{delivery.customer?.name || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {delivery.deliveredAt
                                ? new Date(delivery.deliveredAt).toLocaleString()
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ₹{delivery.payment?.amount || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                              ₹{delivery.payment?.amount ? (delivery.payment.amount * 0.7).toFixed(2) : 0}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      {/* New Assignment Notification Dialog */}
      <Dialog
        open={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', 
            fontWeight: 700,
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Notifications sx={{ fontSize: 32, animation: 'pulse 1.5s infinite' }} />
          🚚 New Delivery Assigned!
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {assignmentNotification && (
            <Box>
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  You have been assigned a new delivery!
                </Typography>
                <Typography variant="body2">
                  Please check the details below and prepare for pickup.
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Order ID
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      #{assignmentNotification.bookingId?.slice(-8) || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '2px solid #4CAF50', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MyLocation sx={{ color: '#4CAF50', mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                        Pickup Location
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {assignmentNotification.pickup}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '2px solid #f44336', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ color: '#f44336', mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                        Drop Location
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {assignmentNotification.drop}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3' }}>
                      {assignmentNotification.distance} km
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                      ₹{assignmentNotification.payment}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Vehicle Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {assignmentNotification.vehicleType}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Your Earnings (70%)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                      ₹{(assignmentNotification.payment * 0.7).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>

                {assignmentNotification.packageDetails && assignmentNotification.packageDetails !== 'N/A' && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255, 193, 7, 0.1)', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Inventory2 sx={{ color: '#FFC107', mr: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Package Details
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {assignmentNotification.packageDetails}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
          <Button
            onClick={() => setShowAssignmentDialog(false)}
            variant="outlined"
            size="large"
            sx={{ fontWeight: 600 }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setShowAssignmentDialog(false);
              setActiveTab(0); // Switch to Active Deliveries tab
            }}
            variant="contained"
            size="large"
            startIcon={<CheckCircle />}
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            View Delivery
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => !completing && setConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#4CAF50', color: 'white', fontWeight: 700 }}>
          <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Delivery Completion
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark this delivery as <strong>DELIVERED</strong>?
          </Typography>
          {selectedDelivery && (
            <Box sx={{ p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Order ID: <strong>#{selectedDelivery._id.slice(-8)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer: <strong>{selectedDelivery.customer?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment: <strong>₹{selectedDelivery.payment?.amount || 0}</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog(false)}
            disabled={completing}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkDelivered}
            disabled={completing}
            variant="contained"
            color="success"
            startIcon={completing ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            sx={{ fontWeight: 600 }}
          >
            {completing ? 'Processing...' : 'Confirm Delivery'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedDriverDashboard;
