import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { PersonAdd, CheckCircle } from '@mui/icons-material';

const AddDriver = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    licenseNumber: '',
    assignedVehicle: '',
    status: 'available',
  });

  const [vehicles, setVehicles] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    // Only show available vehicles
    setVehicles(storedVehicles.filter(v => v.status === 'available'));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.mobile || !formData.licenseNumber) {
      setError('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.mobile.length !== 10) {
      setError('Mobile number must be 10 digits');
      return;
    }

    // Check if email already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.some(u => u.email === formData.email)) {
      setError('Email already exists. Please use a different email.');
      return;
    }

    // Create driver object
    const newDriver = {
      _id: 'drv' + Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
    };

    // Save driver to localStorage
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    drivers.push(newDriver);
    localStorage.setItem('drivers', JSON.stringify(drivers));

    // Create user account for driver login
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      id: newDriver._id,
      name: formData.name,
      email: formData.email,
      password: formData.password, // In production, this should be hashed
      role: 'driver',
      mobile: formData.mobile,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // If vehicle assigned, update vehicle status
    if (formData.assignedVehicle) {
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const updatedVehicles = vehicles.map(v => {
        if (v._id === formData.assignedVehicle) {
          return { ...v, status: 'in-use', assignedDriver: newDriver._id };
        }
        return v;
      });
      localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
    }

    setSuccess(true);
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      licenseNumber: '',
      assignedVehicle: '',
      status: 'available',
    });
    loadVehicles(); // Reload vehicles list
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
                      label="Mobile Number"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      type="tel"
                      placeholder="10-digit mobile number"
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
                      <InputLabel>Assigned Vehicle</InputLabel>
                      <Select
                        name="assignedVehicle"
                        value={formData.assignedVehicle}
                        onChange={handleChange}
                        label="Assigned Vehicle"
                      >
                        <MenuItem value="">
                          <em>No Vehicle (Available for assignment)</em>
                        </MenuItem>
                        {vehicles.map((vehicle) => (
                          <MenuItem key={vehicle._id} value={vehicle._id}>
                            {vehicle.vehicleNumber} - {vehicle.vehicleType} ({vehicle.capacity} kg)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Status"
                      >
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="on-trip">On Trip</MenuItem>
                        <MenuItem value="off-duty">Off Duty</MenuItem>
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
                      startIcon={<PersonAdd />}
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
                      Add Driver
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
