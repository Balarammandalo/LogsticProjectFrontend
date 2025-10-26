import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PersonAdd,
  DirectionsCar,
  People,
  LocalShipping,
  Assignment,
  Settings,
  Logout,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import sub-components
import DashboardOverview from './DashboardOverview';
import AddDriver from './AddDriver';
import AddVehicleNew from './AddVehicleNew';
import DriversList from './DriversList';
import VehiclesList from './VehiclesList';
import BookingManagement from './BookingManagement';

const AdminDashboardNew = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, component: <DashboardOverview /> },
    { label: 'Add Driver', icon: <PersonAdd />, component: <AddDriver /> },
    { label: 'Add Vehicle', icon: <DirectionsCar />, component: <AddVehicleNew /> },
    { label: 'Drivers', icon: <People />, component: <DriversList /> },
    { label: 'Vehicles', icon: <LocalShipping />, component: <VehiclesList /> },
    { label: 'Bookings', icon: <Assignment />, component: <BookingManagement /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage drivers, vehicles, and bookings
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.name || 'Admin'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrator
                </Typography>
              </Box>
              <IconButton onClick={handleProfileMenuOpen}>
                <Avatar sx={{ bgcolor: '#667eea', width: 45, height: 45 }}>
                  {user?.name?.charAt(0) || 'A'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} fontSize="small" />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Navigation Tabs */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Paper
          elevation={3}
          sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              '& .MuiTab-root': {
                minHeight: 70,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#666',
                '&.Mui-selected': {
                  color: '#667eea',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {tabs[activeTab].component}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboardNew;
