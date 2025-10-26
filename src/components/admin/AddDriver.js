import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import { PersonAdd, CheckCircle } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AddDriver = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    vehicleType: '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/drivers`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          licenseNumber: '',
          vehicleType: '',
        });
        
        // Emit event to refresh drivers list
        window.dispatchEvent(new Event('driverAdded'));
      }
    } catch (err) {
      console.error('Error creating driver:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create driver. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#667eea' }}>
        👤 Add New Driver
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Driver Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter driver's full name"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="driver@example.com"
                      helperText="Driver will use this email to login"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      type="password"
                      placeholder="Minimum 6 characters"
                      helperText="Driver will use this password to login"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      type="tel"
                      placeholder="10-digit phone number"
                      inputProps={{ maxLength: 10 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="License Number"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., MH01-20230001234"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        label="Vehicle Type"
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="Bike">Bike</MenuItem>
                        <MenuItem value="Van">Van</MenuItem>
                        <MenuItem value="Mini Truck">Mini Truck</MenuItem>
                        <MenuItem value="Truck">Truck</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                      sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    >
                      {loading ? 'Adding Driver...' : 'Add Driver'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                ℹ️ Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Required Fields:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Driver Name (Full name)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Email Address (For login)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Password (Min 6 characters)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Mobile Number (10 digits)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    License Number
                  </Typography>
                </li>
              </ul>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                <strong>🔐 Login Credentials:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                The email and password will be used by the driver to login to the Driver Dashboard.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Make sure to share these credentials with the driver securely.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                <strong>Optional:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Assign an available vehicle
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Set initial status
                  </Typography>
                </li>
              </ul>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                💡 Tip: You can assign vehicles later from the Drivers List
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccess(false)}
          severity="success"
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          Driver added successfully! 🎉
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddDriver;
