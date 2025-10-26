import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  LocationOn,
  MyLocation,
  Person,
  Phone,
  Inventory2,
  LocalShipping,
  Schedule,
  DirectionsCar,
  ArrowBack,
  Warning,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DeliveryCompletion = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, [orderId]);

  const loadDelivery = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/driver/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const foundDelivery = response.data.data.find(d => d._id === orderId);
      
      if (!foundDelivery) {
        setError('Delivery not found or not assigned to you');
        setLoading(false);
        return;
      }

      setDelivery(foundDelivery);
      setLoading(false);
    } catch (err) {
      console.error('Error loading delivery:', err);
      setError('Failed to load delivery details');
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    setCompleting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/driver/deliver/${orderId}`,
        {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setConfirmDialog(false);
        
        // Show success message for 2 seconds then redirect
        setTimeout(() => {
          navigate('/driver/deliveries');
        }, 2000);
      }
    } catch (err) {
      console.error('Error marking as delivered:', err);
      setError(
        err.response?.data?.message ||
        'Failed to mark delivery as delivered. Please try again.'
      );
      setCompleting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/driver/deliveries/${orderId}/status`,
        {
          status,
          notes: `Status updated to ${status}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Reload delivery
      loadDelivery();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !delivery) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/driver/deliveries')}
          sx={{ mt: 2 }}
        >
          Back to Deliveries
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Success Message */}
      {success && (
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{ mb: 3, fontSize: '1.1rem' }}
        >
          ✅ Delivery marked as completed successfully! Redirecting...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
            📦 Delivery Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order ID: #{delivery?._id.slice(-8)}
          </Typography>
        </Box>
        <Chip
          label={delivery?.status.toUpperCase()}
          color={
            delivery?.status === 'delivered' ? 'success' :
            delivery?.status === 'picked-up' ? 'info' :
            delivery?.status === 'on-route' ? 'warning' : 'default'
          }
          sx={{ fontWeight: 700, fontSize: '0.9rem', px: 2, py: 2.5 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                👤 Customer Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Name"
                    secondary={delivery?.customer?.name || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={delivery?.customer?.phone || 'N/A'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicle Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                🚚 Vehicle Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <DirectionsCar color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vehicle Number"
                    secondary={delivery?.vehicle?.vehicleNumber || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocalShipping color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vehicle Type"
                    secondary={delivery?.vehicle?.vehicleType || delivery?.vehicleType || 'N/A'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pickup Location */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#4CAF50' }}>
                <MyLocation sx={{ mr: 1, verticalAlign: 'middle' }} />
                Pickup Location
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {delivery?.pickupLocation?.address || 'N/A'}
              </Typography>
              {delivery?.pickupLocation?.coordinates && (
                <Typography variant="caption" color="text.secondary">
                  📍 {delivery.pickupLocation.coordinates.latitude?.toFixed(6)}, 
                  {delivery.pickupLocation.coordinates.longitude?.toFixed(6)}
                </Typography>
              )}
              {delivery?.actualPickupTime && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<CheckCircle />}
                    label={`Picked up at ${new Date(delivery.actualPickupTime).toLocaleString()}`}
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Drop Location */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f44336' }}>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Drop Location
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {delivery?.dropLocation?.address || 'N/A'}
              </Typography>
              {delivery?.dropLocation?.coordinates && (
                <Typography variant="caption" color="text.secondary">
                  📍 {delivery.dropLocation.coordinates.latitude?.toFixed(6)}, 
                  {delivery.dropLocation.coordinates.longitude?.toFixed(6)}
                </Typography>
              )}
              {delivery?.deliveredAt && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<CheckCircle />}
                    label={`Delivered at ${new Date(delivery.deliveredAt).toLocaleString()}`}
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Package Details */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                <Inventory2 sx={{ mr: 1, verticalAlign: 'middle' }} />
                Package Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {delivery?.packageDetails?.description || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Weight
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {delivery?.packageDetails?.weight ? `${delivery.packageDetails.weight} kg` : 'N/A'}
                  </Typography>
                </Grid>
                {delivery?.distance && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {delivery.distance} km
                    </Typography>
                  </Grid>
                )}
                {delivery?.payment?.amount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#4CAF50' }}>
                      ₹{delivery.payment.amount}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
              Update Delivery Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {delivery?.status === 'assigned' && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => handleUpdateStatus('on-route')}
                  sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
                >
                  Mark as On Route
                </Button>
              )}
              {(delivery?.status === 'assigned' || delivery?.status === 'on-route') && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => handleUpdateStatus('picked-up')}
                >
                  Mark as Picked Up
                </Button>
              )}
              {delivery?.status !== 'delivered' && delivery?.status !== 'cancelled' && (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircle />}
                  onClick={() => setConfirmDialog(true)}
                  sx={{
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #388E3C 30%, #66BB6A 90%)',
                    },
                  }}
                >
                  Mark as Delivered
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/driver/deliveries')}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Back to Deliveries
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark this delivery as <strong>DELIVERED</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="✓ Update delivery status to 'Delivered'" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Set you as available for new deliveries" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Mark the vehicle as available" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Notify the customer and admin" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✓ Update your earnings" />
            </ListItem>
          </List>
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
            onClick={handleMarkAsDelivered}
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
    </Container>
  );
};

export default DeliveryCompletion;
