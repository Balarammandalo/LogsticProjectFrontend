import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import GoogleBookingMapWithAutocomplete from '../map/GoogleBookingMapWithAutocomplete';
import { searchLocationsDebounced, calculateDistance } from '../../services/locationService';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  LocalShipping,
  TwoWheeler,
  DirectionsCar,
  Payment,
  CheckCircle,
  ArrowForward,
  Close,
  CreditCard,
} from '@mui/icons-material';

// Vehicle options with details
const VEHICLES = [
  {
    id: 'bike',
    name: 'Bike',
    capacity: '0-200 kg',
    weightLimit: 200,
    image: '🏍️',
    basePrice: 50,
    pricePerKm: 8,
    description: 'Perfect for small packages and documents',
  },
  {
    id: 'van',
    name: 'Van',
    capacity: '201-500 kg',
    weightLimit: 500,
    image: '🚐',
    basePrice: 150,
    pricePerKm: 15,
    description: 'Ideal for medium-sized goods',
  },
  {
    id: 'mini-truck',
    name: 'Mini Truck / Tempo',
    capacity: '501-1500 kg',
    weightLimit: 1500,
    image: '🚚',
    basePrice: 300,
    pricePerKm: 25,
    description: 'Great for furniture and bulk items',
  },
  {
    id: 'truck',
    name: 'Truck / Lorry',
    capacity: '1501+ kg',
    weightLimit: 10000,
    image: '🚛',
    basePrice: 500,
    pricePerKm: 40,
    description: 'Heavy-duty transport for large shipments',
  },
];

const LogisticsBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Location Details', 'Select Vehicle', 'Payment'];

  // Location states
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Package details
  const [packageWeight, setPackageWeight] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  
  // Vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filteredVehicles, setFilteredVehicles] = useState(VEHICLES);
  
  // Distance and cost
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Indian cities for autocomplete (simulating Google Places API)
  const INDIAN_LOCATIONS = [
    'Mumbai, Maharashtra',
    'Delhi, Delhi',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Pune, Maharashtra',
    'Ahmedabad, Gujarat',
    'Surat, Gujarat',
    'Jaipur, Rajasthan',
    'Lucknow, Uttar Pradesh',
    'Kanpur, Uttar Pradesh',
    'Nagpur, Maharashtra',
    'Indore, Madhya Pradesh',
    'Thane, Maharashtra',
    'Bhopal, Madhya Pradesh',
    'Visakhapatnam, Andhra Pradesh',
    'Patna, Bihar',
    'Vadodara, Gujarat',
    'Ghaziabad, Uttar Pradesh',
    'Connaught Place, Delhi',
    'Andheri, Mumbai',
    'Koramangala, Bangalore',
    'Banjara Hills, Hyderabad',
    'T Nagar, Chennai',
    'Salt Lake, Kolkata',
    'Hinjewadi, Pune',
    'Vastrapur, Ahmedabad',
  ];

  // Handle location search with real-time API
  const handlePickupSearch = (value) => {
    setPickupLocation(value);
    
    if (value.length >= 2) {
      setLoadingSuggestions(true);
      setShowPickupSuggestions(true);
      
      searchLocationsDebounced(value, (results) => {
        setPickupSuggestions(results);
        setLoadingSuggestions(false);
      });
    } else {
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    }
  };

  const handleDropSearch = (value) => {
    setDropLocation(value);
    
    if (value.length >= 2) {
      setLoadingSuggestions(true);
      setShowDropSuggestions(true);
      
      searchLocationsDebounced(value, (results) => {
        setDropSuggestions(results);
        setLoadingSuggestions(false);
      });
    } else {
      setShowDropSuggestions(false);
      setDropSuggestions([]);
    }
  };

  const selectPickupLocation = (location) => {
    setPickupLocation(location.fullAddress || location.displayName);
    setPickupCoords({ lat: location.lat, lon: location.lon });
    setShowPickupSuggestions(false);
  };

  const selectDropLocation = (location) => {
    setDropLocation(location.fullAddress || location.displayName);
    setDropCoords({ lat: location.lat, lon: location.lon });
    setShowDropSuggestions(false);
  };

  // Filter vehicles based on weight
  useEffect(() => {
    if (packageWeight) {
      const weight = parseFloat(packageWeight);
      const suitable = VEHICLES.filter(v => weight <= v.weightLimit);
      setFilteredVehicles(suitable.length > 0 ? suitable : VEHICLES);
    } else {
      setFilteredVehicles(VEHICLES);
    }
  }, [packageWeight]);

  // Calculate estimated distance and cost
  useEffect(() => {
    if (pickupCoords && dropCoords && selectedVehicle) {
      // Calculate real distance using coordinates
      const distance = calculateDistance(pickupCoords, dropCoords);
      setEstimatedDistance(distance);
      
      const cost = selectedVehicle.basePrice + (distance * selectedVehicle.pricePerKm);
      setEstimatedCost(cost);
    }
  }, [pickupCoords, dropCoords, selectedVehicle]);

  // Handle next step
  const handleNext = () => {
    setError('');
    
    if (activeStep === 0) {
      // Validate location details
      if (!pickupLocation || !dropLocation) {
        setError('Please enter both pickup and drop locations');
        return;
      }
      if (!packageWeight || parseFloat(packageWeight) <= 0) {
        setError('Please enter valid package weight');
        return;
      }
      if (!packageDescription) {
        setError('Please describe your package');
        return;
      }
    } else if (activeStep === 1) {
      // Validate vehicle selection
      if (!selectedVehicle) {
        setError('Please select a vehicle');
        return;
      }
    }
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Handle payment
  const handlePayment = () => {
    setError('');
    
    if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 16) {
        setError('Please enter a valid card number');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setError('Please enter valid expiry date (MM/YY)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter valid CVV');
        return;
      }
    }

    // Create booking
    const newBooking = {
      _id: 'ord' + Date.now(),
      status: 'pending',
      customer: { name: user.name, email: user.email, id: user.id || user._id },
      customerEmail: user.email,
      customerName: user.name,
      userId: user.id || user._id,
      pickupLocation: { address: pickupLocation },
      dropLocation: { address: dropLocation },
      packageDetails: `${packageDescription} (${packageWeight} kg)`,
      vehicleType: selectedVehicle.name,
      payment: estimatedCost,
      paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Card',
      distance: estimatedDistance,
      createdAt: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    // Save to localStorage
    const getUserKey = (baseKey) => {
      const userId = user?.id || user?.email || 'default';
      return `${baseKey}_${userId}`;
    };

    const customerOrders = JSON.parse(localStorage.getItem(getUserKey('customerOrders')) || '[]');
    customerOrders.push(newBooking);
    localStorage.setItem(getUserKey('customerOrders'), JSON.stringify(customerOrders));

    // Also save to shared orders
    const sharedOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    sharedOrders.push(newBooking);
    localStorage.setItem('customerOrders', JSON.stringify(sharedOrders));

    setSuccess(true);
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/user');
    }, 2000);
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Fade in={true}>
          <Paper
            sx={{
              p: 5,
              borderRadius: 4,
              textAlign: 'center',
              maxWidth: 500,
            }}
          >
            <CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your booking has been confirmed. Redirecting to dashboard...
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Order ID:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>#{Date.now().toString().slice(-6)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>₹{estimatedCost}</Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Book Logistics Service
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Complete Porter-like booking experience
              </Typography>
            </Box>
            <IconButton onClick={() => navigate('/user')}>
              <Close />
            </IconButton>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Step 1: Location Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                📍 Enter Pickup & Drop Locations
              </Typography>
              <Grid container spacing={3}>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Package Weight (kg)"
                    type="number"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    placeholder="Enter weight in kg"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Package Description"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="e.g., Electronics, Furniture, Documents"
                  />
                </Grid>

                {/* Google Map for Location Selection */}
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#667eea' }}>
                      🗺️ Select Locations on Map
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Click the buttons below and then click on the map to select pickup (green) and drop (red) locations within India.
                    </Typography>
                    <GoogleBookingMapWithAutocomplete
                      onPickupSelect={(location) => {
                        if (location) {
                          setPickupLocation(location.address);
                          setPickupCoords({ lat: location.lat, lng: location.lng });
                        } else {
                          setPickupLocation('');
                          setPickupCoords(null);
                        }
                      }}
                      onDropSelect={(location) => {
                        if (location) {
                          setDropLocation(location.address);
                          setDropCoords({ lat: location.lat, lng: location.lng });
                        } else {
                          setDropLocation('');
                          setDropCoords(null);
                        }
                      }}
                      onDistanceCalculated={(distanceData) => {
                        setEstimatedDistance(Math.round(distanceData.distanceValue));
                      }}
                      pickupCoords={pickupCoords}
                      dropCoords={dropCoords}
                      height={500}
                      apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Vehicle Selection */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🚚 Select Vehicle Type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {packageWeight && `Recommended for ${packageWeight} kg package`}
              </Typography>
              <Grid container spacing={3}>
                {filteredVehicles.map((vehicle) => (
                  <Grid item xs={12} sm={6} md={3} key={vehicle.id}>
                    <Card
                      onClick={() => setSelectedVehicle(vehicle)}
                      sx={{
                        cursor: 'pointer',
                        border: selectedVehicle?.id === vehicle.id ? '3px solid #667eea' : '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Typography sx={{ fontSize: '4rem', mb: 1 }}>
                          {vehicle.image}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {vehicle.name}
                        </Typography>
                        <Chip
                          label={vehicle.capacity}
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {vehicle.description}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Base: ₹{vehicle.basePrice}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          + ₹{vehicle.pricePerKm}/km
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Step 3: Payment */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                📋 Booking Summary & Payment
              </Typography>
              
              {/* Booking Summary */}
              <Paper sx={{ p: 3, mb: 3, background: 'rgba(102, 126, 234, 0.05)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Pickup Location:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                      {pickupLocation}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Drop Location:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                      {dropLocation}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedVehicle?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Package Weight:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {packageWeight} kg
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Estimated Distance:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estimatedDistance} km
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Total Amount:
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                        ₹{estimatedCost}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Options */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                💳 Select Payment Method
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="upi"
                    control={<Radio />}
                    label="UPI Payment"
                  />
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label="Card Payment"
                  />
                </RadioGroup>
              </FormControl>

              {/* UPI Payment */}
              {paymentMethod === 'upi' && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="UPI ID"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    helperText="Enter your UPI ID (e.g., 9876543210@paytm)"
                  />
                </Box>
              )}

              {/* Card Payment */}
              {paymentMethod === 'card' && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="1234 5678 9012 3456"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CreditCard />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setCardExpiry(value);
                      }}
                      placeholder="MM/YY"
                      inputProps={{ maxLength: 5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      type="password"
                      inputProps={{ maxLength: 3 }}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handlePayment}
                endIcon={<Payment />}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  px: 4,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                  },
                }}
              >
                Pay ₹{estimatedCost}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LogisticsBooking;
