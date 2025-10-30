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
import BrandedHeader from '../common/BrandedHeader';
import { BRAND } from '../../constants/branding';

// Import sub-components
import DashboardOverview from './DashboardOverview';
import DashboardOverviewSimple from './DashboardOverviewSimple';
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
    { label: 'Dashboard', icon: <DashboardIcon />, component: <DashboardOverviewSimple /> },
    { label: 'Add Driver', icon: <PersonAdd />, component: <AddDriver /> },
    { label: 'Add Vehicle', icon: <DirectionsCar />, component: <AddVehicleNew /> },
    { label: 'Drivers', icon: <People />, component: <DriversList /> },
    { label: 'Vehicles', icon: <LocalShipping />, component: <VehiclesList /> },
    { label: 'Bookings', icon: <Assignment />, component: <BookingManagement /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: BRAND.backgrounds.map, backgroundColor: '#f5f7fa' }}>
      {/* Branded Header */}
      <BrandedHeader
        user={user}
        onLogout={handleLogout}
        role="admin"
      />

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
