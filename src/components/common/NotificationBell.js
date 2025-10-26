import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Circle,
  CheckCircle,
  LocalShipping,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../services/AuthContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../../services/notificationService';

const NotificationBell = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Listen for new notifications
      const handleNewNotification = (event) => {
        if (event.detail.userId === user.id && event.detail.role === user.role) {
          loadNotifications();
        }
      };
      
      window.addEventListener('newNotification', handleNewNotification);
      
      // Poll for updates every 5 seconds
      const interval = setInterval(loadNotifications, 5000);
      
      return () => {
        window.removeEventListener('newNotification', handleNewNotification);
        clearInterval(interval);
      };
    }
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;
    
    const notifs = getNotifications(user.id, user.role);
    setNotifications(notifs);
    setUnreadCount(getUnreadCount(user.id, user.role));
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(user.id, user.role, notification.id);
      loadNotifications();
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    handleClose();
  };

  const handleMarkAllRead = () => {
    markAllAsRead(user.id, user.role);
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
        return <LocalShipping sx={{ color: '#2196f3' }} />;
      case 'driver_assigned':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'delivery_accepted':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'delivery_rejected':
        return <Warning sx={{ color: '#f44336' }} />;
      case 'delivery_completed':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'payment_received':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      default:
        return <Info sx={{ color: '#757575' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: unreadCount > 0 ? '#667eea' : 'inherit',
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsActive />
          ) : (
            <Notifications />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: notification.read ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                  borderLeft: notification.read ? 'none' : '3px solid #667eea',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'transparent', width: 40, height: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Circle sx={{ fontSize: 8, color: '#667eea', ml: 1 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.timestamp)}
                      </Typography>
                      {notification.priority && (
                        <Chip
                          label={notification.priority}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: getPriorityColor(notification.priority),
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                    {notification.actionRequired && (
                      <Chip
                        label="Action Required"
                        size="small"
                        color="warning"
                        sx={{ mt: 0.5, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
