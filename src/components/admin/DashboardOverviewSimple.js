import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  LocalShipping,
  DirectionsCar,
  People,
  Assignment,
  CheckCircle,
  Schedule,
  Refresh,
} from '@mui/icons-material';

const DashboardOverviewSimple = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      console.log('Fetching dashboard data with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Dashboard API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashboard API error:', errorText);
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      
      setStats(data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
      
      // Fallback to dummy data for testing
      setStats({
        bookings: { total: 0, active: 0, completed: 0, pending: 0 },
        vehicles: { total: 0, available: 0, busy: 0 },
        drivers: { total: 0, active: 0, busy: 0 },
        revenue: { total: 0 },
        recentBookings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load dashboard data. Please refresh the page.
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
          📊 Dashboard Overview
        </Typography>
        <IconButton onClick={loadDashboardData} disabled={loading} size="small">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Showing fallback data
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats.bookings.total}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deliveries"
            value={stats.bookings.active}
            icon={<LocalShipping sx={{ fontSize: 32 }} />}
            color="#f093fb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.bookings.completed}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.bookings.pending}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={stats.vehicles.total}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Vehicles"
            value={stats.vehicles.available}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Drivers"
            value={stats.drivers.total}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={stats.drivers.active}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2 }}>
        Dashboard is loading data from the backend API. If you see zeros, make sure:
        <ul>
          <li>Backend server is running on port 5000</li>
          <li>You're logged in as an admin</li>
          <li>MongoDB has data</li>
        </ul>
      </Alert>
    </Box>
  );
};

export default DashboardOverviewSimple;
