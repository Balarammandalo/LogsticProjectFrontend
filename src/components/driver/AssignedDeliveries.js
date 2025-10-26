import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../../services/api';
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
  Fade,
  Grow,
  Skeleton,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  Inventory2,
  Schedule,
  Person,
  ArrowForward,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const AssignedDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await deliveryAPI.getDeliveries();
      // Filter deliveries assigned to this driver
      const driverDeliveries = res.data.filter(d => d.driver?._id === user._id);
      setDeliveries(driverDeliveries);
    } catch (error) {
      setError('Failed to load deliveries');
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Assigned Deliveries
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: 280 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="80%" height={24} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Skeleton variant="rectangular" width={80} height={32} />
                    <Skeleton variant="rectangular" width={100} height={36} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Assigned Deliveries
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {deliveries.map((delivery, index) => (
            <Grow in={true} timeout={500 + index * 100} key={delivery._id}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header with ID and Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          #{delivery._id.slice(-8)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {formatDate(delivery.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label={formatStatus(delivery.status)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(delivery.status),
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>

                    {/* Customer */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {delivery.customer?.name || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Pickup Location */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <MyLocation sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Pickup
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                        {delivery.pickupLocation?.address || 'N/A'}
                      </Typography>
                      {delivery.pickupLocation?.coordinates && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                          {delivery.pickupLocation.coordinates.latitude.toFixed(4)}, {delivery.pickupLocation.coordinates.longitude.toFixed(4)}
                        </Typography>
                      )}
                    </Box>

                    {/* Drop Location */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LocationOn sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Delivery
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                        {delivery.dropLocation?.address || 'N/A'}
                      </Typography>
                      {delivery.dropLocation?.coordinates && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                          {delivery.dropLocation.coordinates.latitude.toFixed(4)}, {delivery.dropLocation.coordinates.longitude.toFixed(4)}
                        </Typography>
                      )}
                    </Box>

                    {/* Package Details */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Inventory2 sx={{ mr: 1, mt: 0.3, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Package
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {delivery.packageDetails || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        component={Link}
                        to={`/driver/delivery/${delivery._id}/complete`}
                        disabled={delivery.status === 'delivered' || delivery.status === 'cancelled'}
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          background: delivery.status === 'picked-up' 
                            ? 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        {delivery.status === 'picked-up' ? 'Mark as Delivered' : 'Update Status'}
                        <ArrowForward sx={{ ml: 1, fontSize: 16 }} />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grow>
          ))}
        </Grid>

        {deliveries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Inventory2 sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No deliveries assigned to you
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new assignments
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" component={Link} to="/driver">
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Fade>
  );
};

export default AssignedDeliveries;
