import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import socketService from '../../services/socket';
import OrderAssignment from './OrderAssignment';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  Fade,
  Snackbar,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  PendingActions,
  Visibility,
  Edit,
  Refresh,
  TrendingUp,
  ShoppingBag,
  AssignmentInd,
} from '@mui/icons-material';

const BookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });

  // Load bookings from backend API
  const loadBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/deliveries', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const apiBookings = await response.json();
        console.log('Loaded bookings from API:', apiBookings);
        setBookings(apiBookings);
        updateStats(apiBookings);
        filterBookings(apiBookings, statusFilter);
      } else {
        // Fallback to localStorage if API fails
        const allBookings = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        setBookings(allBookings);
        updateStats(allBookings);
        filterBookings(allBookings, statusFilter);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback to localStorage
      const allBookings = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      setBookings(allBookings);
      updateStats(allBookings);
      filterBookings(allBookings, statusFilter);
    }
  };

  // Update statistics
  const updateStats = (bookingList) => {
    setStats({
      total: bookingList.length,
      pending: bookingList.filter(b => b.status === 'pending').length,
      inTransit: bookingList.filter(b => b.status === 'in-transit').length,
      delivered: bookingList.filter(b => b.status === 'delivered').length,
    });
  };

  // Filter bookings by status
  const filterBookings = (bookingList, filter) => {
    if (filter === 'all') {
      setFilteredBookings(bookingList);
    } else {
      setFilteredBookings(bookingList.filter(b => b.status === filter));
    }
  };

  useEffect(() => {
    loadBookings();

    try {
      // Connect to socket for real-time updates
      if (user) {
        socketService.connect(user);

        // Wait for connection to establish
        setTimeout(() => {
          if (socketService.on) {
            // Join admin room
            socketService.emit('join-admin-room');
            console.log('Admin joined socket room');

            // Listen for new bookings
            socketService.on('new-booking', (data) => {
              console.log('📦 New booking received:', data);
              setSuccessMessage(`New booking from ${data.delivery.customer?.name || 'Customer'}!`);
              loadBookings();
            });

            socketService.on('newBooking', (booking) => {
              console.log('📦 New booking received (legacy):', booking);
              loadBookings();
            });

            // Listen for booking updates
            socketService.on('bookingUpdated', (updatedBooking) => {
              console.log('📦 Booking updated:', updatedBooking);
              loadBookings();
            });

            // Listen for delivery status updates
            socketService.on('delivery-status-update', (data) => {
              console.log('📦 Delivery status updated:', data);
              loadBookings();
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Socket connection error:', error);
      // Continue without socket - app will still work
    }

    return () => {
      try {
        socketService.disconnect();
      } catch (error) {
        console.error('Socket disconnect error:', error);
      }
    };
  }, []);

  useEffect(() => {
    filterBookings(bookings, statusFilter);
  }, [statusFilter, bookings]);

  // Handle status filter change
  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Open booking details
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  // Open update status dialog
  const handleUpdateStatus = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setCurrentLocation(booking.currentLocation || '');
    setUpdateDialogOpen(true);
  };

  // Open assignment dialog
  const handleOpenAssignment = (booking) => {
    setSelectedBooking(booking);
    setAssignmentDialogOpen(true);
  };

  // Handle successful assignment
  const handleAssignmentComplete = (assignmentData) => {
    setSuccessMessage(`Driver ${assignmentData.driver.name} and vehicle ${assignmentData.vehicle.vehicleNumber} assigned successfully!`);
    loadBookings(); // Reload bookings to show updated status
  };

  // Save status update
  const handleSaveUpdate = () => {
    if (!selectedBooking) return;

    // Update booking in localStorage
    const allBookings = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedBookings = allBookings.map(b => {
      if (b._id === selectedBooking._id) {
        return {
          ...b,
          status: newStatus,
          currentLocation: currentLocation || b.currentLocation,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem('customerOrders', JSON.stringify(updatedBookings));

    // Update user-specific orders
    if (selectedBooking.customerEmail) {
      const userKey = `customerOrders_${selectedBooking.customerEmail}`;
      const userOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
      const updatedUserOrders = userOrders.map(b => {
        if (b._id === selectedBooking._id) {
          return {
            ...b,
            status: newStatus,
            currentLocation: currentLocation || b.currentLocation,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });
      localStorage.setItem(userKey, JSON.stringify(updatedUserOrders));
    }

    // Emit socket event for real-time update
    try {
      if (socketService.emit) {
        socketService.emit('updateBooking', {
          bookingId: selectedBooking._id,
          status: newStatus,
          currentLocation: currentLocation,
          customerEmail: selectedBooking.customerEmail,
        });
      }
    } catch (error) {
      console.error('Socket emit error:', error);
      // Continue anyway - localStorage update is already done
    }

    // Reload bookings
    loadBookings();
    setUpdateDialogOpen(false);
    setSelectedBooking(null);
  };

  // Get status color
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

  // Get status label
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

  const statCards = [
    { title: 'Total Bookings', value: stats.total, icon: ShoppingBag, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)' },
    { title: 'Pending', value: stats.pending, icon: PendingActions, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
    { title: 'In Transit', value: stats.inTransit, icon: LocalShipping, color: '#2196f3', bgColor: 'rgba(33, 150, 243, 0.1)' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircle, color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Fade in={true} timeout={600}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  📦 Booking Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage all customer bookings and update order status
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={loadBookings}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Paper>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Fade in={true} timeout={700 + index * 100}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color }}>
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          background: stat.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <stat.icon sx={{ fontSize: 32, color: stat.color }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Bookings Table */}
        <Fade in={true} timeout={800}>
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Filter Section */}
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    All Bookings ({filteredBookings.length})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Filter by Status"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="all">All Bookings</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-transit">In Transit</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(102, 126, 234, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pickup</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Drop</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No bookings found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow
                        key={booking._id}
                        sx={{
                          '&:hover': {
                            background: 'rgba(102, 126, 234, 0.05)',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{booking._id.slice(-6)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{booking.customerName || booking.customer?.name || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.customerEmail || booking.customer?.email || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {booking.vehicleType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.pickupLocation?.address || booking.pickupLocation}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.dropLocation?.address || booking.dropLocation}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            ₹{booking.payment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.paymentMethod}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(booking.status)}
                            color={getStatusColor(booking.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {/* Assign button for pending orders */}
                            {booking.status === 'pending' && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<AssignmentInd />}
                                onClick={() => handleOpenAssignment(booking)}
                                sx={{
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                  },
                                }}
                              >
                                Assign
                              </Button>
                            )}
                            {/* Show assigned info for in-transit orders */}
                            {booking.status === 'in-transit' && booking.assignedDriver && (
                              <Chip
                                label={`${booking.assignedDriver.name}`}
                                size="small"
                                color="info"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(booking)}
                              sx={{ color: '#667eea' }}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateStatus(booking)}
                              sx={{ color: '#ff9800' }}
                            >
                              <Edit />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>

        {/* Booking Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            Booking Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedBooking && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Booking ID</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>#{selectedBooking._id.slice(-6)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.customerName || selectedBooking.customer?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Vehicle Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.vehicleType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Package Details</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.packageDetails}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Pickup Location</Typography>
                  <Typography variant="body1">{selectedBooking.pickupLocation?.address || selectedBooking.pickupLocation}</Typography>
                  {selectedBooking.pickupLocation?.coordinates && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      📍 Coordinates: {selectedBooking.pickupLocation.coordinates.latitude?.toFixed(4)}, {selectedBooking.pickupLocation.coordinates.longitude?.toFixed(4)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Drop Location</Typography>
                  <Typography variant="body1">{selectedBooking.dropLocation?.address || selectedBooking.dropLocation}</Typography>
                  {selectedBooking.dropLocation?.coordinates && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      📍 Coordinates: {selectedBooking.dropLocation.coordinates.latitude?.toFixed(4)}, {selectedBooking.dropLocation.coordinates.longitude?.toFixed(4)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Distance</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.distance} km</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Payment</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>₹{selectedBooking.payment}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getStatusLabel(selectedBooking.status)}
                      color={getStatusColor(selectedBooking.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Expected Delivery</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.expectedDeliveryDate}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            Update Booking Status
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedBooking && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Booking ID: #{selectedBooking._id.slice(-6)}
                </Alert>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="Status"
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Current Location (Optional)"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., Near City Center, Mumbai"
                  helperText="Update the current location of the delivery"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveUpdate}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                },
              }}
            >
              Save Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Order Assignment Dialog */}
        {selectedBooking && (
          <OrderAssignment
            open={assignmentDialogOpen}
            onClose={() => {
              setAssignmentDialogOpen(false);
              setSelectedBooking(null);
            }}
            order={selectedBooking}
            onAssign={handleAssignmentComplete}
          />
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSuccessMessage('')}
            severity="success"
            icon={<CheckCircle />}
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default BookingManagement;
