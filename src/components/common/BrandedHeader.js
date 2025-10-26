import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Container,
  Chip,
} from '@mui/material';
import { Logout, Settings } from '@mui/icons-material';
import NotificationBell from './NotificationBell';
import { BRAND } from '../../constants/branding';

const BrandedHeader = ({ 
  user, 
  onLogout, 
  showNotifications = true,
  additionalContent = null,
  role = 'user'
}) => {
  const navigate = useNavigate();

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Admin Portal';
      case 'driver':
        return 'Driver Portal';
      case 'customer':
        return 'Customer Portal';
      default:
        return 'Portal';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'driver':
        return '#2196f3';
      case 'customer':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={3}
      sx={{ 
        background: BRAND.gradients.primary,
        borderBottom: '3px solid rgba(255,255,255,0.2)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1 }}>
          {/* Logo & Brand - Clickable */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              flex: 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {BRAND.logo}
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {BRAND.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                {BRAND.tagline}
              </Typography>
            </Box>
            <Chip
              label={getRoleLabel()}
              size="small"
              sx={{
                ml: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
          </Box>

          {/* Additional Content (e.g., availability toggle) */}
          {additionalContent && (
            <Box sx={{ mr: 2 }}>
              {additionalContent}
            </Box>
          )}

          {/* Right Side - User Info & Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Notifications */}
            {showNotifications && (
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <NotificationBell />
              </Box>
            )}

            {/* Settings */}
            <IconButton
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                },
              }}
            >
              <Settings />
            </IconButton>

            {/* User Profile */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                px: 2,
                py: 0.5,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: getRoleColor(),
                  width: 36,
                  height: 36,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>
                  {user?.email || ''}
                </Typography>
              </Box>
            </Box>

            {/* Logout */}
            <Button
              variant="contained"
              startIcon={<Logout />}
              onClick={onLogout}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default BrandedHeader;
