import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { deliveryAPI } from '../../services/api';
import { useAuth } from '../../services/AuthContext';
import socketService from '../../services/socket';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const TrackDelivery = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDelivery();
    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, [id]);

  const loadDelivery = async () => {
    try {
      const [deliveryRes, trackingRes] = await Promise.all([
        deliveryAPI.getDelivery(id),
        deliveryAPI.getTracking(id),
      ]);

      setDelivery(deliveryRes.data);
      setTrackingData(trackingRes.data || []);
    } catch (error) {
      setError('Failed to load delivery details');
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketService.connect(user);

    // Join delivery room for real-time updates
    socketService.joinDeliveryRoom(id);

    // Listen for tracking updates
    socketService.onTrackingUpdate((data) => {
      if (data.deliveryId === id) {
        setTrackingData(prev => [data, ...prev]);
      }
    });

    // Listen for status updates
    socketService.onDeliveryStatusUpdate((data) => {
      if (data.deliveryId === id) {
        // Refresh delivery data
        loadDelivery();
      }
    });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading delivery tracking...</Typography>
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
        Track Your Delivery
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Delivery Status Overview */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Status
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Order ID
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {delivery._id.slice(-8)}
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
              Driver
            </Typography>
            <Typography variant="body1">
              {delivery.driver?.name || 'Not assigned'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Vehicle
            </Typography>
            <Typography variant="body1">
              {delivery.vehicle?.vehicleNumber || 'Not assigned'}
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
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Delivery Address
          </Typography>
          <Typography variant="body1">
            {delivery.dropLocation?.address || 'N/A'}
          </Typography>
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

      {/* Real-time Tracking */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Live Tracking Updates
        </Typography>

        {trackingData.length > 0 ? (
          <List>
            {trackingData.slice(0, 10).map((track, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {track.status || 'Location Update'}
                        </Typography>
                        <Chip
                          label={track.status || 'tracking'}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(track.timestamp)}
                        </Typography>
                        {track.location && (
                          <Typography variant="body2" color="text.secondary">
                            Location: {track.location.latitude?.toFixed(6)}, {track.location.longitude?.toFixed(6)}
                          </Typography>
                        )}
                        {track.speed && (
                          <Typography variant="body2" color="text.secondary">
                            Speed: {track.speed} km/h
                          </Typography>
                        )}
                        {track.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {track.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < trackingData.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            No tracking data available yet
          </Typography>
        )}
      </Paper>

      {/* Status Timeline */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Timeline
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { status: 'pending', label: 'Order Placed', description: 'Your order has been received' },
            { status: 'assigned', label: 'Driver Assigned', description: 'A driver has been assigned to your delivery' },
            { status: 'on-route', label: 'On Route', description: 'Driver is on the way to pickup location' },
            { status: 'picked-up', label: 'Picked Up', description: 'Package has been picked up and is on the way' },
            { status: 'delivered', label: 'Delivered', description: 'Package has been successfully delivered' },
          ].map((step, index) => {
            const isCompleted = ['pending', 'assigned', 'on-route', 'picked-up', 'delivered'].indexOf(delivery.status) >= index;
            const isCurrent = delivery.status === step.status;

            return (
              <Box
                key={step.status}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: isCurrent ? 'primary.light' : isCompleted ? 'success.light' : 'grey.100',
                  opacity: isCompleted ? 1 : 0.6,
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'success.main' : 'grey.400',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted && (
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '12px' }}>
                      ✓
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={isCurrent ? 'bold' : 'normal'}>
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Container>
  );
};

export default TrackDelivery;
