import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import socketService from '../../services/socket';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const MarkCompleted = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    loadDelivery();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [id]);

  const loadDelivery = async () => {
    try {
      const res = await deliveryAPI.getDelivery(id);
      setDelivery(res.data);

      // Set initial status based on current delivery status
      if (res.data.status === 'assigned') {
        setStatusUpdate({ status: 'on-route', notes: '' });
      } else if (res.data.status === 'on-route') {
        setStatusUpdate({ status: 'picked-up', notes: '' });
      } else if (res.data.status === 'picked-up') {
        setStatusUpdate({ status: 'delivered', notes: '' });
      }
    } catch (error) {
      setError('Failed to load delivery details');
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketService.connect(user);
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate.status) {
      setError('Please select a status');
      return;
    }

    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      await deliveryAPI.updateStatus(id, statusUpdate);

      // Send real-time update via socket
      socketService.updateDeliveryStatus(id, statusUpdate.status, statusUpdate.notes);

      setSuccess('Status updated successfully!');

      // Refresh delivery data
      await loadDelivery();

      // Reset form
      setStatusUpdate({ status: '', notes: '' });

      // If delivered, redirect after a delay
      if (statusUpdate.status === 'delivered') {
        setTimeout(() => {
          navigate('/driver/deliveries');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableStatuses = () => {
    if (!delivery) return [];

    switch (delivery.status) {
      case 'assigned':
        return [
          { value: 'on-route', label: 'On Route' },
          { value: 'cancelled', label: 'Cancelled' },
        ];
      case 'on-route':
        return [
          { value: 'picked-up', label: 'Picked Up' },
          { value: 'cancelled', label: 'Cancelled' },
        ];
      case 'picked-up':
        return [
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading delivery details...</Typography>
        </Box>
      </Container>
    );
  }

  if (!delivery) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Delivery not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Update Delivery Status
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Delivery Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Details
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Delivery ID
            </Typography>
            <Typography variant="body1">
              {delivery._id.slice(-8)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1">
              {delivery.customer?.name || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Current Status
            </Typography>
            <Chip
              label={formatStatus(delivery.status)}
              sx={{ backgroundColor: getStatusColor(delivery.status), mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {formatDate(delivery.createdAt)}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Pickup Location
          </Typography>
          <Typography variant="body1">
            {delivery.pickupLocation?.address || 'N/A'}
          </Typography>
          {delivery.pickupLocation?.coordinates && (
            <Typography variant="caption" color="text.secondary">
              Coordinates: {delivery.pickupLocation.coordinates.latitude.toFixed(4)}, {delivery.pickupLocation.coordinates.longitude.toFixed(4)}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Drop Location
          </Typography>
          <Typography variant="body1">
            {delivery.dropLocation?.address || 'N/A'}
          </Typography>
          {delivery.dropLocation?.coordinates && (
            <Typography variant="caption" color="text.secondary">
              Coordinates: {delivery.dropLocation.coordinates.latitude.toFixed(4)}, {delivery.dropLocation.coordinates.longitude.toFixed(4)}
            </Typography>
          )}
        </Box>

        {delivery.packageDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Package Details
            </Typography>
            <Typography variant="body1">
              {delivery.packageDetails}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Status Update Form */}
      {(delivery.status !== 'delivered' && delivery.status !== 'cancelled') && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Update Status
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-label">New Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={statusUpdate.status}
              label="New Status"
              onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
            >
              {getAvailableStatuses().map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={statusUpdate.notes}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleStatusUpdate}
              disabled={updating || !statusUpdate.status}
              sx={{ minWidth: 120 }}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/driver/deliveries')}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {(delivery.status === 'delivered' || delivery.status === 'cancelled') && (
        <Alert severity="info">
          This delivery has been {delivery.status === 'delivered' ? 'completed' : 'cancelled'} and cannot be updated further.
        </Alert>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('/driver/deliveries')}>
          Back to Deliveries
        </Button>
      </Box>
    </Container>
  );
};

export default MarkCompleted;
