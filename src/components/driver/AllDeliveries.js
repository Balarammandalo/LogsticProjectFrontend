import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  LocalShipping,
  LocationOn,
  Schedule,
  Navigation,
} from '@mui/icons-material';

const AllDeliveries = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    // Load deliveries with location history
    const dummyDeliveries = [
      {
        _id: 'del001',
        customer: { name: 'Tech Solutions Mumbai' },
        pickupLocation: { address: 'Andheri, Mumbai, Maharashtra 400053' },
        dropLocation: { address: 'Bandra, Mumbai, Maharashtra 400050' },
        status: 'delivered',
        payment: 250,
        deliveredAt: '2025-01-15T14:30:00',
        locationHistory: [
          { location: 'Andheri West', time: '10:00 AM', type: 'pickup' },
          { location: 'Juhu', time: '10:15 AM', type: 'transit' },
          { location: 'Santacruz', time: '10:30 AM', type: 'transit' },
          { location: 'Bandra West', time: '10:45 AM', type: 'delivery' },
        ],
        distance: 12.5,
        duration: 45,
      },
      {
        _id: 'del002',
        customer: { name: 'Retail Store Hyderabad' },
        pickupLocation: { address: 'Madhapur, Hyderabad, Telangana 500081' },
        dropLocation: { address: 'Banjara Hills, Hyderabad, Telangana 500034' },
        status: 'on-route',
        payment: 150,
        locationHistory: [
          { location: 'Madhapur', time: '09:30 AM', type: 'pickup' },
          { location: 'HITEC City', time: '09:45 AM', type: 'transit' },
          { location: 'Jubilee Hills', time: '10:00 AM', type: 'transit' },
        ],
        distance: 8.5,
        duration: null,
      },
      {
        _id: 'del003',
        customer: { name: 'Fashion Hub Bangalore' },
        pickupLocation: { address: 'Koramangala, Bangalore, Karnataka 560034' },
        dropLocation: { address: 'Indiranagar, Bangalore, Karnataka 560038' },
        status: 'delivered',
        payment: 200,
        deliveredAt: '2025-01-14T16:20:00',
        locationHistory: [
          { location: 'Koramangala 5th Block', time: '02:00 PM', type: 'pickup' },
          { location: 'Koramangala 1st Block', time: '02:10 PM', type: 'transit' },
          { location: 'Domlur', time: '02:25 PM', type: 'transit' },
          { location: 'Indiranagar 100 Feet Road', time: '02:40 PM', type: 'delivery' },
        ],
        distance: 7.2,
        duration: 40,
      },
      {
        _id: 'del004',
        customer: { name: 'Food Mart Delhi' },
        pickupLocation: { address: 'Connaught Place, Delhi 110001' },
        dropLocation: { address: 'Karol Bagh, Delhi 110005' },
        status: 'picked-up',
        payment: 180,
        locationHistory: [
          { location: 'Connaught Place', time: '11:00 AM', type: 'pickup' },
          { location: 'Rajiv Chowk', time: '11:10 AM', type: 'transit' },
        ],
        distance: 5.8,
        duration: null,
      },
      {
        _id: 'del005',
        customer: { name: 'Book Store Chennai' },
        pickupLocation: { address: 'T Nagar, Chennai, Tamil Nadu 600017' },
        dropLocation: { address: 'Anna Nagar, Chennai, Tamil Nadu 600040' },
        status: 'delivered',
        payment: 220,
        deliveredAt: '2025-01-13T12:15:00',
        locationHistory: [
          { location: 'T Nagar', time: '09:00 AM', type: 'pickup' },
          { location: 'Nungambakkam', time: '09:20 AM', type: 'transit' },
          { location: 'Kilpauk', time: '09:40 AM', type: 'transit' },
          { location: 'Anna Nagar West', time: '10:00 AM', type: 'delivery' },
        ],
        distance: 11.3,
        duration: 60,
      },
      {
        _id: 'del006',
        customer: { name: 'Electronics Store Pune' },
        pickupLocation: { address: 'Hinjewadi, Pune, Maharashtra 411057' },
        dropLocation: { address: 'Viman Nagar, Pune, Maharashtra 411014' },
        status: 'assigned',
        payment: 280,
        locationHistory: [],
        distance: 18.5,
        duration: null,
      },
      {
        _id: 'del007',
        customer: { name: 'Mobile Shop Kolkata' },
        pickupLocation: { address: 'Salt Lake, Kolkata, West Bengal 700091' },
        dropLocation: { address: 'Park Street, Kolkata, West Bengal 700016' },
        status: 'delivered',
        payment: 170,
        deliveredAt: '2025-01-12T15:45:00',
        locationHistory: [
          { location: 'Salt Lake Sector V', time: '01:00 PM', type: 'pickup' },
          { location: 'Bidhannagar', time: '01:15 PM', type: 'transit' },
          { location: 'Sealdah', time: '01:30 PM', type: 'transit' },
          { location: 'Park Street', time: '01:45 PM', type: 'delivery' },
        ],
        distance: 9.8,
        duration: 45,
      },
      {
        _id: 'del008',
        customer: { name: 'Office Supplies Ahmedabad' },
        pickupLocation: { address: 'Satellite, Ahmedabad, Gujarat 380015' },
        dropLocation: { address: 'Vastrapur, Ahmedabad, Gujarat 380015' },
        status: 'delivered',
        payment: 140,
        deliveredAt: '2025-01-11T11:30:00',
        locationHistory: [
          { location: 'Satellite Road', time: '10:00 AM', type: 'pickup' },
          { location: 'Prahladnagar', time: '10:15 AM', type: 'transit' },
          { location: 'Vastrapur Lake', time: '10:30 AM', type: 'delivery' },
        ],
        distance: 4.2,
        duration: 30,
      },
    ];

    setDeliveries(dummyDeliveries);
  };

  const getFilteredDeliveries = () => {
    if (tabValue === 0) return deliveries; // All
    if (tabValue === 1) return deliveries.filter(d => d.status === 'delivered'); // Completed
    if (tabValue === 2) return deliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up'); // Active
    if (tabValue === 3) return deliveries.filter(d => d.status === 'assigned'); // Pending
    return deliveries;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'on-route':
      case 'picked-up':
        return 'info';
      case 'assigned':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatStatus = (status) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'pickup':
        return <LocalShipping sx={{ fontSize: 20 }} />;
      case 'delivery':
        return <CheckCircle sx={{ fontSize: 20 }} />;
      default:
        return <Navigation sx={{ fontSize: 20 }} />;
    }
  };

  const getLocationColor = (type) => {
    switch (type) {
      case 'pickup':
        return 'primary';
      case 'delivery':
        return 'success';
      default:
        return 'grey';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/driver/dashboard')}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                📦 All Deliveries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete delivery history with location tracking
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper
          sx={{
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ px: 2 }}
          >
            <Tab label="All" />
            <Tab label="Completed" />
            <Tab label="Active" />
            <Tab label="Pending" />
          </Tabs>
        </Paper>

        {/* Deliveries Table */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Customer</strong></TableCell>
                  <TableCell><strong>Route</strong></TableCell>
                  <TableCell><strong>Distance</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Payment</strong></TableCell>
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
                    <TableCell>{delivery.customer.name}</TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block" color="text.secondary">
                        <strong>From:</strong> {delivery.pickupLocation.address.split(',')[0]}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        <strong>To:</strong> {delivery.dropLocation.address.split(',')[0]}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{delivery.distance} km</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {delivery.duration ? `${delivery.duration} min` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                        ₹{delivery.payment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(delivery.status)}
                        size="small"
                        color={getStatusColor(delivery.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedDelivery(delivery)}
                        sx={{
                          textTransform: 'none',
                          borderColor: '#667eea',
                          color: '#667eea',
                        }}
                      >
                        View Route
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Selected Delivery Route Details */}
        {selectedDelivery && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🗺️ Route History - #{selectedDelivery._id.slice(-3)}
              </Typography>
              <Button
                size="small"
                onClick={() => setSelectedDelivery(null)}
                sx={{ textTransform: 'none' }}
              >
                Close
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Delivery Info */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, background: 'rgba(102, 126, 234, 0.05)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Delivery Information
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Customer:</strong> {selectedDelivery.customer.name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Distance:</strong> {selectedDelivery.distance} km
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Duration:</strong> {selectedDelivery.duration ? `${selectedDelivery.duration} minutes` : 'In Progress'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Payment:</strong> ₹{selectedDelivery.payment}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong>{' '}
                        <Chip
                          label={formatStatus(selectedDelivery.status)}
                          size="small"
                          color={getStatusColor(selectedDelivery.status)}
                        />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Location History */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, background: 'rgba(76, 175, 80, 0.05)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Location History
                    </Typography>
                    {selectedDelivery.locationHistory.length > 0 ? (
                      <List sx={{ mt: 2 }}>
                        {selectedDelivery.locationHistory.map((loc, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              border: '1px solid',
                              borderColor: loc.type === 'pickup' ? '#667eea' : loc.type === 'delivery' ? '#4caf50' : '#e0e0e0',
                              borderRadius: 2,
                              mb: 1,
                              background: 'white',
                            }}
                          >
                            <ListItemIcon>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: loc.type === 'pickup' ? 'rgba(102, 126, 234, 0.1)' : 
                                             loc.type === 'delivery' ? 'rgba(76, 175, 80, 0.1)' : 
                                             'rgba(158, 158, 158, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {getLocationIcon(loc.type)}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {loc.location}
                                  </Typography>
                                  <Chip
                                    label={loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      background: loc.type === 'pickup' ? '#667eea' : 
                                                 loc.type === 'delivery' ? '#4caf50' : '#9e9e9e',
                                      color: 'white',
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {loc.time}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <LocationOn sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                          No location history available yet
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedDelivery.status === 'assigned' 
                            ? 'Delivery has not started. Location tracking will begin once the driver picks up the package.'
                            : 'Location tracking will appear here once the delivery is in progress.'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default AllDeliveries;
