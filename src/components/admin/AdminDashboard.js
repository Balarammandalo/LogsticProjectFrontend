import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { vehicleAPI, deliveryAPI } from '../../services/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Fade,
  Grow,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  DirectionsCar,
  LocalShipping,
  TrendingUp,
  People,
  Logout,
  Add,
  Assignment,
  Route,
  Map,
  Visibility,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Close,
  Phone,
  Email,
  CalendarToday,
  ShoppingCart,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDeliveries: 0,
    activeDeliveries: 0,
    totalDrivers: 0,
    pendingDrivers: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState(() => {
    const saved = localStorage.getItem('pendingDrivers');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [driversDialogOpen, setDriversDialogOpen] = useState(false);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [activeDeliveriesDialogOpen, setActiveDeliveriesDialogOpen] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriverForAssignment, setSelectedDriverForAssignment] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    type: 'truck',
    capacity: '',
    status: 'available'
  });
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState(null);

  useEffect(() => {
    loadDashboardData();

    // Reload data when page becomes visible (e.g., returning from another page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also reload when window gains focus
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);

    // Listen for localStorage changes (when new drivers register)
    const handleStorageChange = (e) => {
      if (e.key === 'approvedDrivers' || e.key === null) {
        console.log('🔄 Storage changed, reloading drivers...');
        loadDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleApproveDriver = (driverId) => {
    const driver = pendingDrivers.find(d => d.id === driverId);
    if (!driver) return;

    // Remove from pending drivers
    const updatedPendingDrivers = pendingDrivers.filter(d => d.id !== driverId);
    setPendingDrivers(updatedPendingDrivers);
    localStorage.setItem('pendingDrivers', JSON.stringify(updatedPendingDrivers));

    // Add to approved drivers
    const approvedDrivers = JSON.parse(localStorage.getItem('approvedDrivers') || '[]');
    approvedDrivers.push({
      ...driver,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });
    localStorage.setItem('approvedDrivers', JSON.stringify(approvedDrivers));

    // Update stats
    setStats(prev => ({
      ...prev,
      pendingDrivers: updatedPendingDrivers.length,
      totalDrivers: prev.totalDrivers + 1,
    }));

    alert(`✅ Driver ${driver.name} has been approved and can now accept deliveries!`);
  };

  const handleAssignDriver = (order) => {
    setSelectedOrder(order);
    setAssignDriverDialogOpen(true);
    setSelectedDriverForAssignment('');
    
    // Reload drivers to get latest registered drivers from localStorage
    const approvedDrivers = JSON.parse(localStorage.getItem('approvedDrivers') || '[]');
    console.log('📋 Loading approved drivers from localStorage:', approvedDrivers);
    
    // Format approved drivers for the dropdown
    const formattedDrivers = approvedDrivers.map(d => ({
      _id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      vehicleNumber: d.vehicleNumber || 'Not Assigned'
    }));
    
    // If no registered drivers, show a message
    if (formattedDrivers.length === 0) {
      console.warn('⚠️ No registered drivers found in localStorage!');
      alert('No drivers registered yet. Please register drivers first.');
    }
    
    setAllDrivers(formattedDrivers);
    console.log('✅ Drivers loaded for assignment:', formattedDrivers);
  };

  const handleAddVehicle = () => {
    // Validate inputs
    if (!newVehicle.vehicleNumber || !newVehicle.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    // Create new vehicle object
    const vehicle = {
      id: `veh_${Date.now()}`,
      vehicleNumber: newVehicle.vehicleNumber.toUpperCase(),
      type: newVehicle.type,
      capacity: parseInt(newVehicle.capacity),
      status: newVehicle.status,
      addedAt: new Date().toISOString(),
    };

    // Add to vehicles list
    const updatedVehicles = [...allVehicles, vehicle];
    setAllVehicles(updatedVehicles);

    // Save to localStorage
    localStorage.setItem('adminVehicles', JSON.stringify(updatedVehicles));

    // Update stats
    setStats(prev => ({
      ...prev,
      totalVehicles: updatedVehicles.length
    }));

    // Reset form
    setNewVehicle({
      vehicleNumber: '',
      type: 'truck',
      capacity: '',
      status: 'available'
    });

    alert('✅ Vehicle added successfully!');
  };

  const handleChangeVehicleStatus = (vehicleId, newStatus) => {
    // Update vehicle status
    const updatedVehicles = allVehicles.map(vehicle =>
      vehicle.id === vehicleId
        ? { ...vehicle, status: newStatus }
        : vehicle
    );
    
    setAllVehicles(updatedVehicles);
    
    // Save to localStorage
    localStorage.setItem('adminVehicles', JSON.stringify(updatedVehicles));
    
    console.log(`✅ Vehicle status updated to: ${newStatus}`);
  };

  const handleConfirmAssignment = () => {
    if (!selectedDriverForAssignment) {
      alert('Please select a driver');
      return;
    }

    const driver = allDrivers.find(d => d._id === selectedDriverForAssignment);
    if (!driver) {
      alert('Driver not found');
      return;
    }

    // Update order status
    const updatedOrder = {
      ...selectedOrder,
      status: 'assigned',
      driver: driver,
      assignedAt: new Date().toISOString(),
    };

    // Update in customerOrders localStorage
    const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedOrders = customerOrders.map(order => 
      order._id === selectedOrder._id ? updatedOrder : order
    );
    localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));

    // Add to driver's pending assignments
    const driverAssignments = JSON.parse(localStorage.getItem('driverPendingAssignments') || '[]');
    const driverAssignment = {
      _id: selectedOrder._id,
      customer: selectedOrder.customer,
      pickupLocation: selectedOrder.pickupLocation,
      dropLocation: typeof selectedOrder.dropLocation === 'string' 
        ? { address: selectedOrder.dropLocation }
        : selectedOrder.dropLocation,
      packageDetails: selectedOrder.packageDetails,
      payment: selectedOrder.payment,
      distance: '5 km',
      estimatedTime: '30 mins',
      productLink: selectedOrder.productLink,
      assignedAt: new Date().toISOString(),
    };
    driverAssignments.push(driverAssignment);
    localStorage.setItem('driverPendingAssignments', JSON.stringify(driverAssignments));

    // Remove from pending orders
    const updatedPendingOrders = pendingOrders.filter(order => order._id !== selectedOrder._id);
    setPendingOrders(updatedPendingOrders);

    // Close dialog
    setAssignDriverDialogOpen(false);
    setSelectedOrder(null);
    setSelectedDriverForAssignment('');

    alert(`✅ Order assigned to driver ${driver.name}! Driver will be notified.`);
  };

  const handleRejectDriver = (driverId) => {
    const driver = pendingDrivers.find(d => d.id === driverId);
    if (!driver) return;

    if (window.confirm(`Are you sure you want to reject driver ${driver.name}?`)) {
      // Remove from pending drivers
      const updatedPendingDrivers = pendingDrivers.filter(d => d.id !== driverId);
      setPendingDrivers(updatedPendingDrivers);
      localStorage.setItem('pendingDrivers', JSON.stringify(updatedPendingDrivers));

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingDrivers: updatedPendingDrivers.length,
      }));

      alert(`❌ Driver ${driver.name} has been rejected.`);
    }
  };

  const loadDashboardData = async () => {
    try {
      const vehiclesRes = await vehicleAPI.getVehicles().catch(() => ({ data: [] }));
      const vehicles = vehiclesRes.data || [];

      // No dummy data - only real data from localStorage
      const dummyDeliveries = [];

      // Load vehicles from localStorage
      const adminVehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
      const allVehiclesList = adminVehicles.length > 0 ? adminVehicles : vehicles;
      setAllVehicles(allVehiclesList);

      // Load customer orders
      const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      
      // Filter pending orders (only pending status)
      const pendingCustomerOrders = customerOrders.filter(order => order.status === 'pending');
      setPendingOrders(pendingCustomerOrders);
      
      // Get delivered customer orders for recent deliveries
      const deliveredCustomerOrders = customerOrders.filter(order => 
        order.status === 'delivered' || order.status === 'on-route' || order.status === 'assigned'
      ).map(order => ({
        ...order,
        customer: typeof order.customer === 'string' 
          ? { name: order.customer } 
          : order.customer,
        driver: order.driver || { name: 'Assigned Driver' },
        vehicle: order.vehicle || { vehicleNumber: 'N/A' },
        createdAt: order.createdAt || new Date().toISOString(),
      }));
      
      // Merge dummy deliveries with real customer orders
      const allDeliveriesList = [...dummyDeliveries, ...deliveredCustomerOrders];
      setAllDeliveries(allDeliveriesList);

      // Get driver assignments from localStorage
      const savedAssignments = localStorage.getItem('driverAssignments');
      const driverAssignments = savedAssignments ? JSON.parse(savedAssignments) : [];
      
      // Calculate stats from dummy data and assignments
      const activeDriversFromDeliveries = new Set(dummyDeliveries.filter(d => d.driver).map(d => d.driver._id)).size;
      const activeDriversFromAssignments = new Set(driverAssignments.map(a => a.driverName)).size;
      const totalActiveDrivers = Math.max(activeDriversFromDeliveries, activeDriversFromAssignments);
      
      // Get approved drivers
      const approvedDrivers = JSON.parse(localStorage.getItem('approvedDrivers') || '[]');
      console.log('📋 Approved Drivers from localStorage:', approvedDrivers);
      
      const uniqueDrivers = Array.from(new Set([
        ...dummyDeliveries.filter(d => d.driver).map(d => JSON.stringify(d.driver)),
        ...approvedDrivers.map(d => JSON.stringify({ _id: d.id, name: d.name, phone: d.phone, vehicleNumber: d.vehicleNumber }))
      ])).map(d => JSON.parse(d));
      
      console.log('👥 All Drivers (merged):', uniqueDrivers);
      setAllDrivers(uniqueDrivers);
      
      // Load pending drivers
      const savedPendingDrivers = localStorage.getItem('pendingDrivers');
      const pendingDriversList = savedPendingDrivers ? JSON.parse(savedPendingDrivers) : [];
      setPendingDrivers(pendingDriversList);
      
      setStats({
        totalVehicles: allVehiclesList.length || 1,
        totalDeliveries: allDeliveriesList.length,
        activeDeliveries: allDeliveriesList.filter(d => d.status === 'on-route' || d.status === 'assigned').length,
        totalDrivers: uniqueDrivers.length,
        pendingDrivers: pendingDriversList.length,
      });

      // Get recent 5 deliveries (sorted by date) - includes customer orders
      const sortedDeliveries = allDeliveriesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentDeliveries(sortedDeliveries.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  const handleStatCardClick = (title) => {
    switch(title) {
      case 'Total Vehicles':
        setVehiclesDialogOpen(true);
        break;
      case 'Total Deliveries':
        setDeliveriesDialogOpen(true);
        break;
      case 'Active Deliveries':
        setActiveDeliveriesDialogOpen(true);
        break;
      case 'Active Drivers':
        setDriversDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const statCards = [
    { title: 'Total Vehicles', value: stats.totalVehicles, icon: DirectionsCar, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)', clickable: true },
    { title: 'Total Deliveries', value: stats.totalDeliveries, icon: LocalShipping, color: '#764ba2', bgColor: 'rgba(118, 75, 162, 0.1)', clickable: true },
    { title: 'Active Deliveries', value: stats.activeDeliveries, icon: TrendingUp, color: '#f093fb', bgColor: 'rgba(240, 147, 251, 0.1)', clickable: true },
    { title: 'Active Drivers', value: stats.totalDrivers, icon: People, color: '#4facfe', bgColor: 'rgba(79, 172, 254, 0.1)', clickable: true },
    { title: 'Pending Drivers', value: stats.pendingDrivers, icon: HourglassEmpty, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)', clickable: false },
  ];

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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
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
                  Admin Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Welcome back, {user.name}!
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={logout}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Logout />
            </IconButton>
          </Paper>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={stat.title}>
              <Grow in={true} timeout={600 + index * 100}>
                <Card
                  onClick={() => stat.clickable && handleStatCardClick(stat.title)}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: 'none',
                    transition: 'all 0.3s ease',
                    cursor: stat.clickable ? 'pointer' : 'default',
                    '&:hover': {
                      transform: stat.clickable ? 'translateY(-8px)' : 'none',
                      boxShadow: stat.clickable ? `0 12px 24px ${stat.color}40` : 'none',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          background: stat.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <stat.icon sx={{ fontSize: 28, color: stat.color }} />
                      </Box>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Fade in={true} timeout={800}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setVehiclesDialogOpen(true)}
                  startIcon={<Add />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #667eeadd 100%)',
                    boxShadow: '0 4px 12px #667eea40',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px #667eea60',
                    },
                  }}
                >
                  Add Vehicle
                </Button>
              </Grid>
              {[
                { label: 'Assign Driver', icon: Assignment, to: '/admin/drivers/assign', color: '#764ba2' },
                { label: 'Plan Routes', icon: Route, to: '/admin/routes/plan', color: '#f093fb' },
                { label: 'Live Tracking', icon: Map, to: '/admin/map/live', color: '#4facfe' },
              ].map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={action.label}>
                  <Button
                    fullWidth
                    variant="contained"
                    component={Link}
                    to={action.to}
                    startIcon={<action.icon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${action.color} 0%, ${action.color}dd 100%)`,
                      boxShadow: `0 4px 12px ${action.color}40`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${action.color}60`,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Fade>

        {/* Pending Customer Orders */}
        {pendingOrders.length > 0 && (
          <Fade in={true} timeout={850}>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(240, 147, 251, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ShoppingCart sx={{ color: '#f093fb', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f093fb' }}>
                  Pending Customer Orders ({pendingOrders.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Order ID</strong></TableCell>
                      <TableCell><strong>Customer</strong></TableCell>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell><strong>From → To</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Payment</strong></TableCell>
                      <TableCell align="center"><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow
                        key={order._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(240, 147, 251, 0.05)',
                          },
                        }}
                      >
                        <TableCell sx={{ color: '#f093fb', fontWeight: 600 }}>
                          #{order._id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order.customer?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.packageDetails}
                          </Typography>
                          {order.productLink && (
                            <Typography variant="caption" color="text.secondary">
                              <LinkIcon sx={{ fontSize: 12, mr: 0.5 }} />
                              {order.productLink.substring(0, 30)}...
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            <strong>From:</strong> {order.pickupLocation?.address?.split(',')[0]}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>To:</strong> {typeof order.dropLocation === 'string' 
                              ? order.dropLocation.split(',')[0] 
                              : (order.dropLocation?.address?.split(',')[0] || 'Customer Address')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#4caf50' }}>
                            ₹{order.payment?.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.paymentMethod === 'card' ? 'Card' : order.paymentMethod === 'upi' ? 'UPI' : 'COD'}
                            size="small"
                            color={order.paymentMethod === 'cod' ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Assignment />}
                            onClick={() => handleAssignDriver(order)}
                            sx={{
                              textTransform: 'none',
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                              },
                            }}
                          >
                            Assign Driver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Fade>
        )}

        {/* Pending Drivers Approval */}
        {pendingDrivers.length > 0 && (
          <Fade in={true} timeout={900}>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 152, 0, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <HourglassEmpty sx={{ color: '#ff9800', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
                  Pending Driver Approvals ({pendingDrivers.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Driver Name</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Vehicle Type</strong></TableCell>
                      <TableCell><strong>Vehicle Number</strong></TableCell>
                      <TableCell><strong>License Number</strong></TableCell>
                      <TableCell><strong>Registered</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingDrivers.map((driver) => (
                      <TableRow
                        key={driver.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(255, 152, 0, 0.05)',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                fontWeight: 700,
                              }}
                            >
                              {driver.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {driver.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{driver.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.vehicleType}
                            size="small"
                            sx={{
                              background: 'rgba(102, 126, 234, 0.1)',
                              color: '#667eea',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {driver.vehicleNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {driver.licenseNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(driver.registeredAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApproveDriver(driver.id)}
                              sx={{
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                                },
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Cancel />}
                              onClick={() => handleRejectDriver(driver.id)}
                              sx={{
                                textTransform: 'none',
                                borderColor: '#f44336',
                                color: '#f44336',
                                '&:hover': {
                                  borderColor: '#d32f2f',
                                  background: 'rgba(244, 67, 54, 0.05)',
                                },
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Fade>
        )}

        {/* Recent Deliveries */}
        <Fade in={true} timeout={1000}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Recent Deliveries
            </Typography>
            <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Route</strong></TableCell>
                <TableCell><strong>Driver/Vehicle</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentDeliveries.map((delivery) => (
                <TableRow 
                  key={delivery._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                      #{delivery._id.slice(-3)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{delivery.customer?.name || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>From:</strong> {delivery.pickupLocation?.address?.split(',')[0] || 'N/A'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>To:</strong> {delivery.dropLocation?.address?.split(',')[0] || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {delivery.driver ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {delivery.driver.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.vehicle?.vehicleNumber || 'N/A'}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Not Assigned" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(delivery.status)}
                      size="small"
                      color={
                        delivery.status === 'on-route' ? 'success' :
                        delivery.status === 'assigned' ? 'info' :
                        delivery.status === 'delivered' ? 'success' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(delivery.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {(delivery.status === 'on-route' || delivery.status === 'assigned' || delivery.status === 'pending' || delivery.status === 'picked-up') && (
                      <Button
                        onClick={() => {
                          setSelectedDeliveryForTracking(delivery);
                          setTrackingDialogOpen(true);
                        }}
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        sx={{
                          textTransform: 'none',
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': {
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          },
                        }}
                      >
                        Track
                      </Button>
                    )}
                    {delivery.status === 'delivered' && (
                      <Chip label="Completed" size="small" color="success" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </TableContainer>
            {recentDeliveries.length === 0 && (
              <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No deliveries found
              </Typography>
            )}
          </Paper>
        </Fade>
        {/* Vehicles Dialog */}
        <Dialog open={vehiclesDialogOpen} onClose={() => setVehiclesDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>🚗 Vehicle Management</Typography>
            <IconButton onClick={() => setVehiclesDialogOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            {/* Add New Vehicle Form */}
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(102, 126, 234, 0.05)', border: '2px solid rgba(102, 126, 234, 0.2)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                ➕ Add New Vehicle
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Number"
                    placeholder="e.g., MH-12-AB-1234"
                    value={newVehicle.vehicleNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={newVehicle.type}
                      label="Vehicle Type"
                      onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                    >
                      <MenuItem value="truck">Truck</MenuItem>
                      <MenuItem value="van">Van</MenuItem>
                      <MenuItem value="bike">Bike</MenuItem>
                      <MenuItem value="car">Car</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Capacity (kg)"
                    placeholder="e.g., 500"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newVehicle.status}
                      label="Status"
                      onChange={(e) => setNewVehicle({ ...newVehicle, status: e.target.value })}
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="in-use">In-Use</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddVehicle}
                    startIcon={<Add />}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontWeight: 600,
                    }}
                  >
                    Add Vehicle
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Existing Vehicles List */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              📋 All Vehicles ({allVehicles.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Vehicle Number</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Capacity</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Change Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{vehicle.vehicleNumber}</TableCell>
                      <TableCell><Chip label={vehicle.type.toUpperCase()} size="small" color="primary" /></TableCell>
                      <TableCell>{vehicle.capacity} kg</TableCell>
                      <TableCell>
                        <Chip 
                          label={vehicle.status} 
                          size="small" 
                          color={vehicle.status === 'available' ? 'success' : vehicle.status === 'in-use' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={vehicle.status}
                            onChange={(e) => handleChangeVehicleStatus(vehicle.id, e.target.value)}
                            sx={{ fontSize: '0.875rem' }}
                          >
                            <MenuItem value="available">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
                                Available
                              </Box>
                            </MenuItem>
                            <MenuItem value="in-use">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
                                In-Use
                              </Box>
                            </MenuItem>
                            <MenuItem value="maintenance">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336' }} />
                                Maintenance
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        {/* Drivers Dialog */}
        <Dialog open={driversDialogOpen} onClose={() => setDriversDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>👥 All Active Drivers ({allDrivers.length})</Typography>
            <IconButton onClick={() => setDriversDialogOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Driver Name</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Vehicle</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allDrivers.map((driver) => (
                    <TableRow key={driver._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, background: '#4facfe' }}>
                            {driver.name?.charAt(0)}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600 }}>{driver.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{driver.phone || 'N/A'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{driver.vehicleNumber || 'N/A'}</TableCell>
                      <TableCell><Chip label="Active" size="small" color="success" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        {/* All Deliveries Dialog */}
        <Dialog open={deliveriesDialogOpen} onClose={() => setDeliveriesDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>📦 All Deliveries ({allDeliveries.length})</Typography>
            <IconButton onClick={() => setDeliveriesDialogOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>From → To</strong></TableCell>
                    <TableCell><strong>Driver</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allDeliveries.map((delivery) => (
                    <TableRow key={delivery._id}>
                      <TableCell sx={{ color: '#667eea', fontWeight: 600 }}>#{delivery._id.slice(-3)}</TableCell>
                      <TableCell>{delivery.customer?.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          <strong>From:</strong> {delivery.pickupLocation?.address?.split(',')[0]}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>To:</strong> {delivery.dropLocation?.address?.split(',')[0]}
                        </Typography>
                      </TableCell>
                      <TableCell>{delivery.driver?.name || 'Not Assigned'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={formatStatus(delivery.status)} 
                          size="small" 
                          color={
                            delivery.status === 'delivered' ? 'success' :
                            delivery.status === 'on-route' ? 'info' :
                            delivery.status === 'assigned' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        {/* Active Deliveries Dialog */}
        <Dialog open={activeDeliveriesDialogOpen} onClose={() => setActiveDeliveriesDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🚚 Active Deliveries ({allDeliveries.filter(d => d.status === 'on-route' || d.status === 'assigned').length})
            </Typography>
            <IconButton onClick={() => setActiveDeliveriesDialogOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Customer</strong></TableCell>
                    <TableCell><strong>From → To</strong></TableCell>
                    <TableCell><strong>Driver/Vehicle</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Expected Delivery</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allDeliveries.filter(d => d.status === 'on-route' || d.status === 'assigned').map((delivery) => (
                    <TableRow key={delivery._id}>
                      <TableCell sx={{ color: '#f093fb', fontWeight: 600 }}>#{delivery._id.slice(-3)}</TableCell>
                      <TableCell>{delivery.customer?.name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>
                          📍 {delivery.pickupLocation?.address?.split(',').slice(0, 2).join(',')}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 500, mt: 0.5 }}>
                          📍 {delivery.dropLocation?.address?.split(',').slice(0, 2).join(',')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{delivery.driver?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{delivery.vehicle?.vehicleNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={delivery.status === 'on-route' ? 'On Route' : 'Assigned'} 
                          size="small" 
                          color={delivery.status === 'on-route' ? 'info' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption">
                            {delivery.expectedDeliveryDate || formatDate(delivery.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        {/* Assign Driver Dialog */}
        <Dialog open={assignDriverDialogOpen} onClose={() => setAssignDriverDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment sx={{ color: '#f093fb' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Assign Driver to Order</Typography>
            </Box>
            <IconButton onClick={() => setAssignDriverDialogOpen(false)}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {selectedOrder && (
              <Paper sx={{ p: 2, mb: 3, background: 'rgba(240, 147, 251, 0.05)', border: '1px solid rgba(240, 147, 251, 0.2)' }}>
                <Typography variant="caption" color="text.secondary">Order Details</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedOrder.packageDetails}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Chip label={`₹${selectedOrder.payment?.toLocaleString('en-IN')}`} size="small" color="success" />
                  <Chip label={selectedOrder.paymentMethod?.toUpperCase()} size="small" />
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  <strong>From:</strong> {selectedOrder.pickupLocation?.address}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  <strong>To:</strong> {typeof selectedOrder.dropLocation === 'string' 
                    ? selectedOrder.dropLocation 
                    : (selectedOrder.dropLocation?.address || 'Customer Address')}
                </Typography>
              </Paper>
            )}

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Select Driver</Typography>
            <FormControl fullWidth>
              <InputLabel>Choose Driver</InputLabel>
              <Select
                value={selectedDriverForAssignment}
                onChange={(e) => setSelectedDriverForAssignment(e.target.value)}
                label="Choose Driver"
              >
                {allDrivers.map((driver) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, background: '#4facfe', fontSize: '0.8rem' }}>
                        {driver.name?.charAt(0)}
                      </Avatar>
                      <Typography>{driver.name}</Typography>
                      {driver.vehicleNumber && (
                        <Typography variant="caption" color="text.secondary">
                          ({driver.vehicleNumber})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAssignDriverDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmAssignment}
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                },
              }}
            >
              Assign Driver
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tracking Dialog */}
        <Dialog open={trackingDialogOpen} onClose={() => setTrackingDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Track Delivery</Typography>
            </Box>
            <IconButton onClick={() => setTrackingDialogOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {selectedDeliveryForTracking && (
              <Box>
                {/* Order Details */}
                <Paper sx={{ p: 3, mb: 3, background: 'rgba(102, 126, 234, 0.05)', border: '2px solid rgba(102, 126, 234, 0.2)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                    Order #{selectedDeliveryForTracking._id.slice(-6).toUpperCase()}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Customer</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedDeliveryForTracking.customer?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Status</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={formatStatus(selectedDeliveryForTracking.status)}
                          size="small"
                          color={
                            selectedDeliveryForTracking.status === 'on-route' ? 'success' :
                            selectedDeliveryForTracking.status === 'assigned' ? 'info' :
                            selectedDeliveryForTracking.status === 'picked-up' ? 'warning' :
                            'default'
                          }
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Package Details</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedDeliveryForTracking.packageDetails || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Route Information */}
                <Paper sx={{ p: 3, mb: 3, background: 'rgba(240, 147, 251, 0.05)', border: '2px solid rgba(240, 147, 251, 0.2)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#f093fb' }}>
                    📍 Route Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Pickup Location</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedDeliveryForTracking.pickupLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Drop Location</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedDeliveryForTracking.dropLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Expected Delivery Time */}
                <Paper sx={{ p: 3, mb: 3, background: 'rgba(79, 172, 254, 0.05)', border: '2px solid rgba(79, 172, 254, 0.2)', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#4facfe' }}>
                    ⏰ Expected Delivery Time
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Expected Date</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#4facfe' }}>
                        {selectedDeliveryForTracking.expectedDeliveryDate 
                          ? new Date(selectedDeliveryForTracking.expectedDeliveryDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Not Set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Estimated Time</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#4facfe' }}>
                        {selectedDeliveryForTracking.estimatedTime || '2-3 hours'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Order Created</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedDeliveryForTracking.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Driver & Vehicle Info */}
                {selectedDeliveryForTracking.driver && (
                  <Paper sx={{ p: 3, background: 'rgba(118, 75, 162, 0.05)', border: '2px solid rgba(118, 75, 162, 0.2)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#764ba2' }}>
                      🚚 Driver & Vehicle Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Driver Name</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Avatar sx={{ width: 32, height: 32, background: '#764ba2' }}>
                            {selectedDeliveryForTracking.driver.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {selectedDeliveryForTracking.driver.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Vehicle Number</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace', mt: 0.5 }}>
                          {selectedDeliveryForTracking.vehicle?.vehicleNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      {selectedDeliveryForTracking.currentLocation && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Current Location</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#764ba2' }}>
                            📍 {selectedDeliveryForTracking.currentLocation}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                )}

                {/* If no driver assigned */}
                {!selectedDeliveryForTracking.driver && (
                  <Paper sx={{ p: 3, background: 'rgba(255, 152, 0, 0.05)', border: '2px solid rgba(255, 152, 0, 0.2)', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ textAlign: 'center', color: '#ff9800', fontWeight: 500 }}>
                      ⚠️ No driver assigned yet. Please assign a driver to start tracking.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTrackingDialogOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
