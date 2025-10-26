import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { deliveryAPI } from '../../services/api';
import socketService from '../../services/socket';
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
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
} from '@mui/material';
import {
  ShoppingBag,
  CheckCircle,
  LocalShipping,
  PendingActions,
  Logout,
  Map,
  Visibility,
  Home,
  Add,
  Edit,
  Delete,
  ShoppingCart,
  Payment,
  Link as LinkIcon,
  Close,
  CreditCard,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

// Metro cities in India
const METRO_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Thane', state: 'Maharashtra' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { name: 'Ludhiana', state: 'Punjab' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Faridabad', state: 'Haryana' },
  { name: 'Meerut', state: 'Uttar Pradesh' },
  { name: 'Rajkot', state: 'Gujarat' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Srinagar', state: 'Jammu and Kashmir' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Kochi', state: 'Kerala' },
  { name: 'Guwahati', state: 'Assam' },
];

const UserDashboard = () => {
  const { user, logout } = useAuth();
  
  // Helper function to get user-specific localStorage key
  const getUserKey = (baseKey) => {
    const userId = user?.id || user?.email || 'default';
    return `${baseKey}_${userId}`;
  };
  
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    activeDeliveries: 0,
    pendingDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'delivered', 'in-transit', 'pending'
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(() => {
    const saved = localStorage.getItem('customerProfile');
    return saved ? JSON.parse(saved) : {
      name: user.name || 'Customer Name',
      email: user.email || 'customer@example.com',
      phone: user.phone || '+91 9876543210',
      profilePicture: null,
    };
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({...customerProfile});
  const [profilePicturePreview, setProfilePicturePreview] = useState(customerProfile.profilePicture);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    loadDeliveries();
    connectSocket();

    // Reload deliveries when window gains focus (user switches back to tab)
    const handleFocus = () => {
      console.log('🔄 Customer dashboard focused, reloading deliveries...');
      loadDeliveries();
    };

    // Reload deliveries when localStorage changes (driver marks as delivered)
    const handleStorageChange = (e) => {
      if (e.key === 'customerOrders' || e.key === null) {
        console.log('🔄 Customer orders updated, reloading...');
        loadDeliveries();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    // Also reload every 10 seconds to catch updates
    const interval = setInterval(() => {
      loadDeliveries();
    }, 10000);

    return () => {
      socketService.disconnect();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadDeliveries = async () => {
    try {
      // Load customer orders from USER-SPECIFIC localStorage - NO DUMMY DATA
      const customerOrders = JSON.parse(localStorage.getItem(getUserKey('customerOrders')) || '[]');
      
      // Use only real customer orders for THIS user
      const allDeliveries = customerOrders;
      setDeliveries(allDeliveries);
      
      console.log(`📦 Customer Orders for ${user?.email}:`, customerOrders.length);
      console.log('📊 Total Deliveries:', allDeliveries.length);

      const completed = allDeliveries.filter(d => d.status === 'delivered').length;
      const active = allDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length;
      const pending = allDeliveries.filter(d => d.status === 'pending' || d.status === 'assigned').length;

      setStats({
        totalDeliveries: allDeliveries.length,
        completedDeliveries: completed,
        activeDeliveries: active,
        pendingDeliveries: pending,
      });
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketService.connect(user);

    // Listen for delivery status updates
    socketService.onDeliveryStatusUpdate((data) => {
      if (data.deliveryId) {
        // Check if this delivery belongs to the user
        const userDelivery = deliveries.find(d => d._id === data.deliveryId);
        if (userDelivery) {
          loadDeliveries(); // Refresh deliveries
        }
      }
    });
  };

  const getFilteredDeliveries = () => {
    if (filterStatus === 'all') return deliveries;
    if (filterStatus === 'delivered') return deliveries.filter(d => d.status === 'delivered');
    if (filterStatus === 'in-transit') return deliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up');
    if (filterStatus === 'pending') return deliveries.filter(d => d.status === 'pending' || d.status === 'assigned');
    return deliveries;
  };

  const handleStatCardClick = (filter) => {
    setFilterStatus(filterStatus === filter ? 'all' : filter);
  };

  const loadAddresses = () => {
    // Load addresses from USER-SPECIFIC localStorage - NO DUMMY DATA
    const savedAddresses = localStorage.getItem(getUserKey('userAddresses'));
    const loadedAddresses = savedAddresses ? JSON.parse(savedAddresses) : [];
    setAddresses(loadedAddresses);
    console.log(`📍 Addresses for ${user?.email}:`, loadedAddresses.length);
  };

  const handleOpenAddressDialog = (address = null) => {
    if (address) {
      setEditingAddressId(address.id);
      setNewAddress({
        label: address.label,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddressId(null);
      setNewAddress({
        label: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
    }
    setAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setAddressDialogOpen(false);
    setEditingAddressId(null);
    setNewAddress({
      label: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleViewProfile = () => {
    setEditedProfile({...customerProfile});
    setProfileDialogOpen(true);
    setEditingProfile(false);
    handleProfileMenuClose();
  };

  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
    setEditingProfile(false);
    setEditedProfile({...customerProfile});
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    setCustomerProfile(editedProfile);
    setProfilePicturePreview(editedProfile.profilePicture);
    localStorage.setItem('customerProfile', JSON.stringify(editedProfile));
    setEditingProfile(false);
    alert('✅ Profile updated successfully!');
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, profilePicture: reader.result });
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setEditedProfile({ ...editedProfile, profilePicture: null });
    setProfilePicturePreview(null);
  };

  const handleCancelEditProfile = () => {
    setEditedProfile({...customerProfile});
    setEditingProfile(false);
  };

  const handleSaveAddress = () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      alert('Please fill all fields');
      return;
    }

    let updatedAddresses;
    if (editingAddressId) {
      // Edit existing address
      updatedAddresses = addresses.map(addr =>
        addr.id === editingAddressId
          ? { ...addr, ...newAddress }
          : newAddress.isDefault ? { ...addr, isDefault: false } : addr
      );
    } else {
      // Add new address
      const newAddr = {
        id: 'addr' + Date.now(),
        ...newAddress,
      };
      updatedAddresses = newAddress.isDefault
        ? [...addresses.map(addr => ({ ...addr, isDefault: false })), newAddr]
        : [...addresses, newAddr];
    }

    setAddresses(updatedAddresses);
    localStorage.setItem(getUserKey('userAddresses'), JSON.stringify(updatedAddresses));
    handleCloseAddressDialog();
  };

  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      setAddresses(updatedAddresses);
      localStorage.setItem(getUserKey('userAddresses'), JSON.stringify(updatedAddresses));
    }
  };

  const handleSetDefaultAddress = (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem(getUserKey('userAddresses'), JSON.stringify(updatedAddresses));
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

  const statCards = [
    { title: 'Total Orders', value: stats.totalDeliveries, icon: ShoppingBag, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)', filter: 'all' },
    { title: 'Delivered', value: stats.completedDeliveries, icon: CheckCircle, color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.1)', filter: 'delivered' },
    { title: 'In Transit', value: stats.activeDeliveries, icon: LocalShipping, color: '#f093fb', bgColor: 'rgba(240, 147, 251, 0.1)', filter: 'in-transit' },
    { title: 'Pending', value: stats.pendingDeliveries, icon: PendingActions, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)', filter: 'pending' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        pb: 4,
      }}
    >
      {/* Animated Background with Video Concept */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(240, 147, 251, 0.2) 0%, transparent 40%)
            `,
            animation: 'float 20s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 60px,
                rgba(255, 255, 255, 0.03) 60px,
                rgba(255, 255, 255, 0.03) 61px
              )
            `,
            animation: 'slide 30s linear infinite',
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translate(0, 0) scale(1)',
            },
            '33%': {
              transform: 'translate(30px, -30px) scale(1.1)',
            },
            '66%': {
              transform: 'translate(-20px, 20px) scale(0.9)',
            },
          },
          '@keyframes slide': {
            '0%': {
              transform: 'translateX(0)',
            },
            '100%': {
              transform: 'translateX(60px)',
            },
          },
        }}
      />

      <Container maxWidth="lg" sx={{ pt: 4, position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* TrackMate Logo - Clickable to Home */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button
                component={Link}
                to="/"
                sx={{
                  textTransform: 'none',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  padding: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                🚚 TrackMate
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* User Profile Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar
                    src={customerProfile.profilePicture}
                    sx={{
                      width: 60,
                      height: 60,
                      background: customerProfile.profilePicture ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '3px solid rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.5)',
                      },
                    }}
                  >
                    {!customerProfile.profilePicture && user.name?.charAt(0)}
                  </Avatar>
                </IconButton>
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
                    Welcome, {user.name}! 👋
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Your Customer Dashboard
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
            </Box>

            {/* Profile Menu */}
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <MenuItem onClick={handleViewProfile}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                  <Typography>View Profile</Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Paper>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Grow in={true} timeout={700 + index * 100}>
                <Card
                  onClick={() => handleStatCardClick(stat.filter)}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: filterStatus === stat.filter ? `3px solid ${stat.color}` : 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 24px ${stat.color}40`,
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
        <Fade in={true} timeout={900}>
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
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/user/book-logistics"
                  startIcon={<LocalShipping />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(240, 147, 251, 0.6)',
                    },
                  }}
                >
                  Book Logistics Service
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/user/map/route"
                  startIcon={<Map />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)',
                    },
                  }}
                >
                  Track Deliveries
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleOpenAddressDialog()}
                  startIcon={<Home />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#667eea',
                    color: '#667eea',
                    borderWidth: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#764ba2',
                      background: 'rgba(102, 126, 234, 0.05)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Manage Addresses
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Recent Deliveries */}
        <Fade in={true} timeout={1100}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Your Orders {filterStatus !== 'all' && `(${filterStatus === 'delivered' ? 'Delivered' : filterStatus === 'in-transit' ? 'In Transit' : 'Pending'})`}
              </Typography>
              {filterStatus !== 'all' && (
                <Chip
                  label="Clear Filter"
                  onClick={() => setFilterStatus('all')}
                  onDelete={() => setFilterStatus('all')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Route</strong></TableCell>
                <TableCell><strong>Package</strong></TableCell>
                <TableCell><strong>Current Location</strong></TableCell>
                <TableCell><strong>Expected Delivery</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredDeliveries().map((delivery) => (
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
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>From:</strong> {delivery.pickupLocation?.address?.split(',')[0]}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>To:</strong> {delivery.dropLocation?.address?.split(',')[0]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{delivery.packageDetails || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    {delivery.currentLocation ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#f093fb' }}>
                          📍 {delivery.currentLocation}
                        </Typography>
                        {delivery.driver && (
                          <Typography variant="caption" color="text.secondary">
                            Driver: {delivery.driver.name}
                          </Typography>
                        )}
                      </Box>
                    ) : delivery.status === 'delivered' ? (
                      <Chip label="Delivered" size="small" color="success" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Awaiting Pickup
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      📅 {new Date(delivery.expectedDeliveryDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </Typography>
                    {delivery.deliveredAt && (
                      <Typography variant="caption" color="success.main">
                        ✓ Delivered on {new Date(delivery.deliveredAt).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(delivery.status)}
                      size="small"
                      color={
                        delivery.status === 'on-route' || delivery.status === 'picked-up' ? 'success' :
                        delivery.status === 'delivered' ? 'success' :
                        delivery.status === 'assigned' ? 'info' :
                        'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {(delivery.status === 'on-route' || delivery.status === 'picked-up') && (
                      <Button
                        size="small"
                        variant="contained"
                        component={Link}
                        to={`/user/map/route?delivery=${delivery._id}`}
                        startIcon={<Visibility />}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.5)',
                          },
                        }}
                      >
                        Track
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </TableContainer>
            {getFilteredDeliveries().length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ShoppingBag sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  {filterStatus === 'all' ? 'No orders found' : 
                   filterStatus === 'delivered' ? 'No delivered orders' :
                   filterStatus === 'in-transit' ? 'No orders in transit' :
                   'No pending orders'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filterStatus === 'all' ? 'Start by placing your first order' : 'Try selecting a different filter'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>

        {/* Address Management Dialog */}
        <Dialog 
          open={addressDialogOpen} 
          onClose={handleCloseAddressDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
          }}>
            {editingAddressId ? '✏️ Edit Address' : '➕ Add New Address'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {/* Existing Addresses */}
            {!editingAddressId && addresses.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
                  📍 Your Addresses
                </Typography>
                <List>
                  {addresses.map((address, index) => (
                    <React.Fragment key={address.id}>
                      <ListItem
                        sx={{
                          border: address.isDefault ? '2px solid #667eea' : '1px solid #e0e0e0',
                          borderRadius: 2,
                          mb: 1,
                          background: address.isDefault ? 'rgba(102, 126, 234, 0.05)' : 'white',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {address.label}
                              </Typography>
                              {address.isDefault && (
                                <Chip label="Default" size="small" color="primary" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {address.street}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {address.city}, {address.state} - {address.pincode}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {!address.isDefault && (
                              <Button
                                size="small"
                                onClick={() => handleSetDefaultAddress(address.id)}
                                sx={{ textTransform: 'none' }}
                              >
                                Set Default
                              </Button>
                            )}
                            <IconButton
                              edge="end"
                              onClick={() => handleOpenAddressDialog(address)}
                              sx={{ color: '#667eea' }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteAddress(address.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < addresses.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
                <Divider sx={{ my: 3 }} />
              </Box>
            )}

            {/* Add/Edit Address Form */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea', mb: 2 }}>
                {editingAddressId ? 'Edit Address Details' : 'Add New Address'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Label"
                    placeholder="e.g., Home, Office, etc."
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    placeholder="House/Flat No, Building Name, Street"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="city-select-label">City</InputLabel>
                    <Select
                      labelId="city-select-label"
                      id="city-select"
                      value={newAddress.city}
                      label="City"
                      onChange={(e) => {
                        const selectedCity = METRO_CITIES.find(city => city.name === e.target.value);
                        setNewAddress({ 
                          ...newAddress, 
                          city: e.target.value,
                          state: selectedCity ? selectedCity.state : newAddress.state
                        });
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a city</em>
                      </MenuItem>
                      {METRO_CITIES.map((city) => (
                        <MenuItem key={city.name} value={city.name}>
                          {city.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    value={newAddress.state}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Auto-filled based on selected city"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Button
                      variant={newAddress.isDefault ? 'contained' : 'outlined'}
                      onClick={() => setNewAddress({ ...newAddress, isDefault: !newAddress.isDefault })}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#667eea',
                        color: newAddress.isDefault ? 'white' : '#667eea',
                        background: newAddress.isDefault ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                      }}
                    >
                      {newAddress.isDefault ? '✓ Default Address' : 'Set as Default'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={handleCloseAddressDialog}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              variant="contained"
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              {editingAddressId ? 'Update Address' : 'Add Address'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Customer Profile Dialog */}
        <Dialog
          open={profileDialogOpen}
          onClose={handleCloseProfileDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {customerProfile.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Customer Profile
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View and edit your profile information
                  </Typography>
                </Box>
              </Box>
              {!editingProfile && (
                <IconButton onClick={handleEditProfile} sx={{ color: '#667eea' }}>
                  <Edit />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              {/* Profile Picture Upload */}
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar
                    src={profilePicturePreview}
                    sx={{
                      width: 120,
                      height: 120,
                      margin: '0 auto',
                      mb: 2,
                      background: profilePicturePreview ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '3rem',
                      fontWeight: 700,
                      border: '4px solid rgba(102, 126, 234, 0.2)',
                    }}
                  >
                    {!profilePicturePreview && customerProfile.name?.charAt(0)}
                  </Avatar>
                  {editingProfile && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        component="label"
                        size="small"
                        sx={{
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        Upload Picture
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                        />
                      </Button>
                      {profilePicturePreview && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={handleRemoveProfilePicture}
                          sx={{ textTransform: 'none' }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                  )}
                  {editingProfile && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Max file size: 5MB (JPG, PNG, GIF)
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Full Name
                  </Typography>
                  {editingProfile ? (
                    <TextField
                      fullWidth
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {customerProfile.name}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Email Address
                  </Typography>
                  {editingProfile ? (
                    <TextField
                      fullWidth
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      variant="outlined"
                      size="small"
                      type="email"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {customerProfile.email}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Phone Number
                  </Typography>
                  {editingProfile ? (
                    <TextField
                      fullWidth
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {customerProfile.phone}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            {editingProfile ? (
              <>
                <Button
                  onClick={handleCancelEditProfile}
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                    },
                  }}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCloseProfileDialog}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Close
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserDashboard;
