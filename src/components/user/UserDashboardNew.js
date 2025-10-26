import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Fade,
  Slide,
  LinearProgress,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  Download,
  Star,
  Refresh,
  FilterList,
  Search,
  Visibility,
  Add,
  TrendingUp,
  AttachMoney,
  Map,
  LocationOn,
  Phone,
  AccessTime,
  Close,
} from '@mui/icons-material';
import BrandedHeader from '../common/BrandedHeader';
import { BRAND } from '../../constants/branding';

const UserDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    totalSpent: 0,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');

  useEffect(() => {
    loadOrders();
    
    const handleBookingUpdate = () => {
      loadOrders();
    };
    
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    const interval = setInterval(loadOrders, 5000);
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const loadOrders = () => {
    if (!user) return;
    
    const allOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const userOrders = allOrders.filter(order => 
      order.customerEmail === user.email || order.userId === user.id
    );
    
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setOrders(userOrders);
    
    const pending = userOrders.filter(o => o.status === 'pending').length;
    const inTransit = userOrders.filter(o => o.status === 'in-transit' || o.status === 'assigned').length;
    const delivered = userOrders.filter(o => o.status === 'delivered').length;
    const totalSpent = userOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.payment || 0), 0);
    
    setStats({
      total: userOrders.length,
      pending,
      inTransit,
      delivered,
      totalSpent,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'assigned':
      case 'in-transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      case 'in-transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleRateDelivery = (order) => {
    setSelectedOrder(order);
    setRatingDialogOpen(true);
  };

  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    
    // Calculate progress based on status
    let progress = 0;
    switch (order.status) {
      case 'pending':
        progress = 0;
        break;
      case 'assigned':
        progress = 25;
        break;
      case 'in-transit':
        progress = 50;
        break;
      case 'delivered':
        progress = 100;
        break;
      default:
        progress = 0;
    }
    setTrackingProgress(progress);
    
    // Calculate estimated time
    if (order.distance) {
      const avgSpeed = 30; // km/h
      const timeInHours = order.distance / avgSpeed;
      const timeInMinutes = Math.round(timeInHours * 60);
      setEstimatedTime(`${timeInMinutes} minutes`);
    } else {
      setEstimatedTime('Calculating...');
    }
    
    setTrackingDialogOpen(true);
  };

  const handleSubmitRating = () => {
    if (!selectedOrder) return;
    
    const allOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedOrders = allOrders.map(o => {
      if (o._id === selectedOrder._id) {
        return {
          ...o,
          rating,
          feedback,
          ratedAt: new Date().toISOString(),
        };
      }
      return o;
    });
    
    localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
    
    if (selectedOrder.assignedDriver) {
      const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
      const updatedDrivers = drivers.map(d => {
        if (d._id === selectedOrder.assignedDriver.id) {
          const ratings = d.ratings || [];
          ratings.push({ rating, feedback, orderId: selectedOrder._id, date: new Date().toISOString() });
          const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          return { ...d, ratings, averageRating: avgRating };
        }
        return d;
      });
      localStorage.setItem('drivers', JSON.stringify(updatedDrivers));
    }
    
    setRatingDialogOpen(false);
    setRating(0);
    setFeedback('');
    loadOrders();
  };

  const handleDownloadInvoice = (order) => {
    const invoice = `
TRACKMATE INVOICE
================

Order ID: ${order._id}
Date: ${new Date(order.createdAt).toLocaleDateString()}

Customer: ${order.customerName}
Email: ${order.customerEmail}

Pickup: ${order.pickupLocation?.address || order.pickupLocation}
Drop: ${order.dropLocation?.address || order.dropLocation}

Vehicle Type: ${order.vehicleType}
Distance: ${order.distance} km

Amount: ₹${order.payment}
Status: ${order.status}

${order.assignedDriver ? `Driver: ${order.assignedDriver.name}` : ''}
${order.assignedVehicle ? `Vehicle: ${order.assignedVehicle.number}` : ''}

Thank you for using TrackMate!
    `;
    
    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrackMate_Invoice_${order._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReorder = (order) => {
    navigate('/user/book-logistics', { 
      state: { 
        pickupLocation: order.pickupLocation,
        dropLocation: order.dropLocation,
        vehicleType: order.vehicleType,
      } 
    });
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order._id.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.pickupLocation?.address?.toLowerCase().includes(query) ||
        order.dropLocation?.address?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total,
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: BRAND.colors.primary,
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: BRAND.colors.warning,
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: BRAND.colors.info,
      bgColor: 'rgba(33, 150, 243, 0.1)',
    },
    {
      title: 'Delivered',
      value: stats.delivered,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: BRAND.colors.success,
      bgColor: 'rgba(76, 175, 80, 0.1)',
    },
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: darkMode 
          ? 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
          : BRAND.backgrounds.map,
        backgroundColor: darkMode ? '#1a1a1a' : '#f5f7fa',
        transition: 'all 0.3s ease',
      }}
    >
      <BrandedHeader
        user={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
        role="customer"
        additionalContent={
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ffd700',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ffd700',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {darkMode ? '🌙 Dark' : '☀️ Light'}
              </Typography>
            }
          />
        }
      />

      <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
        <Fade in={true} timeout={500}>
          <Card 
            elevation={3}
            sx={{ 
              mb: 3, 
              background: darkMode 
                ? 'rgba(255,255,255,0.05)'
                : BRAND.gradients.primary,
              color: 'white',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Welcome back, {user?.name}! 👋
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Track your deliveries, view order history, and manage your logistics needs.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={() => navigate('/user/book-logistics')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    Book New Delivery
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Slide direction="up" in={true} timeout={300 + index * 100}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography 
                          variant="body2" 
                          color={darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
                          sx={{ mb: 1 }}
                        >
                          {card.title}
                        </Typography>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 700,
                            color: darkMode ? 'white' : card.color,
                          }}
                        >
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
              </Slide>
            </Grid>
          ))}
        </Grid>

        <Fade in={true} timeout={800}>
          <Card 
            elevation={3}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              background: darkMode 
                ? 'rgba(255,255,255,0.05)'
                : BRAND.gradients.success,
              color: 'white',
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Spent
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{stats.totalSpent}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        <Card 
          elevation={3}
          sx={{ 
            borderRadius: 3,
            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: darkMode ? 'white' : 'text.primary',
                }}
              >
                📦 Your Orders
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                      color: darkMode ? 'white' : 'inherit',
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                  sx={{
                    color: darkMode ? 'white' : 'inherit',
                    borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'inherit',
                  }}
                >
                  Filter: {filterStatus === 'all' ? 'All' : getStatusLabel(filterStatus)}
                </Button>
                <Menu
                  anchorEl={filterMenuAnchor}
                  open={Boolean(filterMenuAnchor)}
                  onClose={() => setFilterMenuAnchor(null)}
                >
                  <MenuItem onClick={() => { setFilterStatus('all'); setFilterMenuAnchor(null); }}>
                    All Orders
                  </MenuItem>
                  <MenuItem onClick={() => { setFilterStatus('pending'); setFilterMenuAnchor(null); }}>
                    Pending
                  </MenuItem>
                  <MenuItem onClick={() => { setFilterStatus('in-transit'); setFilterMenuAnchor(null); }}>
                    In Transit
                  </MenuItem>
                  <MenuItem onClick={() => { setFilterStatus('delivered'); setFilterMenuAnchor(null); }}>
                    Delivered
                  </MenuItem>
                </Menu>
                <IconButton 
                  onClick={loadOrders}
                  sx={{ color: darkMode ? 'white' : 'inherit' }}
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Box>

            {filteredOrders.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Order ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Route
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Vehicle
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: darkMode ? 'white' : 'inherit' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow 
                        key={order._id}
                        sx={{
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, 0.05)',
                          },
                        }}
                      >
                        <TableCell sx={{ color: darkMode ? 'white' : 'inherit' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{order._id.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'inherit' }}>
                          <Typography variant="body2">
                            {order.pickupLocation?.address || order.pickupLocation}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            → {order.dropLocation?.address || order.dropLocation}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'inherit' }}>
                          <Chip 
                            label={order.vehicleType} 
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'inherit' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ₹{order.payment}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: darkMode ? 'white' : 'inherit' }}>
                          <Typography variant="body2">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Typography>
                          {order.status === 'delivered' && order.completedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Delivered: {new Date(order.completedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewDetails(order)}
                                sx={{ color: darkMode ? 'white' : BRAND.colors.primary }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {(order.status === 'in-transit' || order.status === 'assigned') && (
                              <Tooltip title="Track Delivery">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleTrackOrder(order)}
                                  sx={{ 
                                    color: darkMode ? '#4fc3f7' : BRAND.colors.info,
                                    bgcolor: darkMode ? 'rgba(79, 195, 247, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                    '&:hover': {
                                      bgcolor: darkMode ? 'rgba(79, 195, 247, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                    },
                                  }}
                                >
                                  <Map />
                                </IconButton>
                              </Tooltip>
                            )}
                            {order.status === 'delivered' && (
                              <>
                                <Tooltip title="Download Invoice">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDownloadInvoice(order)}
                                    sx={{ color: darkMode ? 'white' : BRAND.colors.success }}
                                  >
                                    <Download />
                                  </IconButton>
                                </Tooltip>
                                {!order.rating && (
                                  <Tooltip title="Rate Delivery">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleRateDelivery(order)}
                                      sx={{ color: darkMode ? 'white' : BRAND.colors.warning }}
                                    >
                                      <Star />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                            <Tooltip title="Reorder">
                              <IconButton 
                                size="small" 
                                onClick={() => handleReorder(order)}
                                sx={{ color: darkMode ? 'white' : BRAND.colors.info }}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <LocalShipping sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Start by booking your first delivery'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/user/book-logistics')}
                  sx={{ background: BRAND.gradients.primary }}
                >
                  Book Delivery
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ bgcolor: BRAND.colors.primary, color: 'white' }}>
              Order Details - #{selectedOrder._id.slice(-6)}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pickup Location
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                    📍 {selectedOrder.pickupLocation?.address || selectedOrder.pickupLocation}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">
                    Drop Location
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                    📍 {selectedOrder.dropLocation?.address || selectedOrder.dropLocation}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, textTransform: 'capitalize' }}>
                    {selectedOrder.vehicleType}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">
                    Distance
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedOrder.distance} km
                  </Typography>
                </Grid>
                
                {selectedOrder.assignedDriver && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Driver Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: BRAND.colors.info, width: 50, height: 50 }}>
                        {selectedOrder.assignedDriver.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {selectedOrder.assignedDriver.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📞 {selectedOrder.assignedDriver.mobile}
                        </Typography>
                      </Box>
                    </Box>
                    {selectedOrder.assignedVehicle && (
                      <Typography variant="body2">
                        Vehicle: {selectedOrder.assignedVehicle.number}
                      </Typography>
                    )}
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Total Amount</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: BRAND.colors.success }}>
                      ₹{selectedOrder.payment}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              {selectedOrder.status === 'delivered' && (
                <Button 
                  variant="contained" 
                  startIcon={<Download />}
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  sx={{ background: BRAND.gradients.primary }}
                >
                  Download Invoice
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog 
        open={ratingDialogOpen} 
        onClose={() => setRatingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rate Your Delivery Experience</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              How was your delivery?
            </Typography>
            <Rating
              value={rating}
              onChange={(e, newValue) => setRating(newValue)}
              size="large"
              sx={{ fontSize: '3rem' }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Feedback (Optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitRating}
            disabled={rating === 0}
            sx={{ background: BRAND.gradients.primary }}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>

      {/* Live Tracking Dialog */}
      <Dialog 
        open={trackingDialogOpen} 
        onClose={() => setTrackingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ bgcolor: BRAND.colors.primary, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping />
                <Typography variant="h6">Track Delivery #{selectedOrder._id.slice(-6)}</Typography>
              </Box>
              <IconButton onClick={() => setTrackingDialogOpen(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              {/* Map Placeholder */}
              <Box
                sx={{
                  height: 400,
                  bgcolor: darkMode ? '#2c3e50' : '#e0e0e0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: BRAND.backgrounds.map,
                }}
              >
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <LocalShipping sx={{ fontSize: 80, color: BRAND.colors.primary, mb: 2 }} />
                  <Typography variant="h6" color={darkMode ? 'white' : 'text.secondary'} sx={{ mb: 2 }}>
                    Live Tracking View
                  </Typography>
                  <Box sx={{ bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'white', p: 2, borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn sx={{ color: 'success.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                        {selectedOrder.pickupLocation?.address || selectedOrder.pickupLocation}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                      ↓ {selectedOrder.distance} km
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ color: 'error.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                        {selectedOrder.dropLocation?.address || selectedOrder.dropLocation}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Delivery Progress */}
              <Box sx={{ p: 3, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white' }}>
                <Typography variant="subtitle2" color={darkMode ? 'white' : 'text.secondary'} sx={{ mb: 1 }}>
                  Delivery Progress
                </Typography>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.1)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${trackingProgress}%`,
                        bgcolor: BRAND.colors.primary,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color={darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
                    {trackingProgress}% Complete
                  </Typography>
                  <Typography variant="caption" color={darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
                    {selectedOrder.status === 'delivered' ? 'Delivered' : `ETA: ${estimatedTime}`}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Order Details */}
              <Box sx={{ p: 3, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Pickup Location
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <LocationOn sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                          {selectedOrder.pickupLocation?.address || selectedOrder.pickupLocation}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Drop Location
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <LocationOn sx={{ color: 'error.main', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                          {selectedOrder.dropLocation?.address || selectedOrder.dropLocation}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Distance
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: darkMode ? 'white' : 'inherit' }}>
                        {selectedOrder.distance} km
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Estimated Time
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                          {estimatedTime}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Driver Information */}
              {selectedOrder.assignedDriver && (
                <>
                  <Divider />
                  <Box sx={{ p: 3, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: darkMode ? 'white' : 'inherit' }}>
                      Driver Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: BRAND.colors.info, width: 50, height: 50 }}>
                        {selectedOrder.assignedDriver.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: darkMode ? 'white' : 'inherit' }}>
                          {selectedOrder.assignedDriver.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedOrder.assignedVehicle?.number || 'Vehicle info not available'}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<Phone />}
                        size="small"
                        href={`tel:${selectedOrder.assignedDriver.mobile}`}
                        sx={{
                          color: darkMode ? 'white' : BRAND.colors.primary,
                          borderColor: darkMode ? 'rgba(255,255,255,0.3)' : BRAND.colors.primary,
                        }}
                      >
                        Call
                      </Button>
                    </Box>
                  </Box>
                </>
              )}

              {/* Status */}
              <Divider />
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white' }}>
                <Typography variant="subtitle2" sx={{ color: darkMode ? 'white' : 'inherit' }}>
                  Current Status
                </Typography>
                <Chip 
                  label={getStatusLabel(selectedOrder.status)} 
                  color={getStatusColor(selectedOrder.status)}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setTrackingDialogOpen(false)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  loadOrders();
                  handleTrackOrder(selectedOrder);
                }}
                sx={{ background: BRAND.gradients.primary }}
              >
                Refresh Status
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserDashboardNew;
