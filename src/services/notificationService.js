// Notification Service for Real-Time Updates

// Notification types
export const NOTIFICATION_TYPES = {
  NEW_BOOKING: 'new_booking',
  DRIVER_ASSIGNED: 'driver_assigned',
  DELIVERY_ACCEPTED: 'delivery_accepted',
  DELIVERY_REJECTED: 'delivery_rejected',
  DELIVERY_STARTED: 'delivery_started',
  DELIVERY_COMPLETED: 'delivery_completed',
  PAYMENT_RECEIVED: 'payment_received',
  STATUS_UPDATE: 'status_update',
};

// Get all notifications for a user
export const getNotifications = (userId, role) => {
  const key = `notifications_${role}_${userId}`;
  const notifications = localStorage.getItem(key);
  return notifications ? JSON.parse(notifications) : [];
};

// Add a new notification
export const addNotification = (userId, role, notification) => {
  const key = `notifications_${role}_${userId}`;
  const notifications = getNotifications(userId, role);
  
  const newNotification = {
    id: 'notif_' + Date.now(),
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  notifications.unshift(newNotification);
  localStorage.setItem(key, JSON.stringify(notifications));
  
  // Trigger custom event for real-time update
  window.dispatchEvent(new CustomEvent('newNotification', { 
    detail: { userId, role, notification: newNotification } 
  }));
  
  return newNotification;
};

// Mark notification as read
export const markAsRead = (userId, role, notificationId) => {
  const key = `notifications_${role}_${userId}`;
  const notifications = getNotifications(userId, role);
  
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
};

// Mark all as read
export const markAllAsRead = (userId, role) => {
  const key = `notifications_${role}_${userId}`;
  const notifications = getNotifications(userId, role);
  
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
};

// Get unread count
export const getUnreadCount = (userId, role) => {
  const notifications = getNotifications(userId, role);
  return notifications.filter(n => !n.read).length;
};

// Clear all notifications
export const clearNotifications = (userId, role) => {
  const key = `notifications_${role}_${userId}`;
  localStorage.removeItem(key);
};

// Create notification for new booking (sent to admin)
export const notifyNewBooking = (booking) => {
  const admins = JSON.parse(localStorage.getItem('users') || '[]')
    .filter(u => u.role === 'admin');
  
  admins.forEach(admin => {
    addNotification(admin.id, 'admin', {
      type: NOTIFICATION_TYPES.NEW_BOOKING,
      title: 'New Booking Request',
      message: `New delivery from ${booking.customerName || 'Customer'}`,
      data: {
        bookingId: booking._id,
        customer: booking.customerName,
        route: `${booking.pickupLocation?.address || booking.pickupLocation} → ${booking.dropLocation?.address || booking.dropLocation}`,
        amount: booking.payment,
      },
      priority: 'high',
    });
  });
};

// Create notification for driver assignment (sent to driver and customer)
export const notifyDriverAssignment = (booking, driver) => {
  // Notify driver
  addNotification(driver._id, 'driver', {
    type: NOTIFICATION_TYPES.DRIVER_ASSIGNED,
    title: 'New Delivery Assigned',
    message: `Pickup: ${booking.pickupLocation?.address || booking.pickupLocation}`,
    data: {
      bookingId: booking._id,
      customer: booking.customerName,
      pickup: booking.pickupLocation,
      drop: booking.dropLocation,
      amount: booking.driverPayment || booking.payment,
      vehicleType: booking.vehicleType,
      distance: booking.distance,
    },
    priority: 'high',
    actionRequired: true,
  });
  
  // Notify customer
  const customer = JSON.parse(localStorage.getItem('users') || '[]')
    .find(u => u.email === booking.customerEmail);
  
  if (customer) {
    addNotification(customer.id, 'customer', {
      type: NOTIFICATION_TYPES.DRIVER_ASSIGNED,
      title: 'Driver Assigned',
      message: `${driver.name} has been assigned to your delivery`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
        driverMobile: driver.mobile,
        vehicleNumber: booking.assignedVehicle?.number,
      },
      priority: 'medium',
    });
  }
};

// Create notification for delivery acceptance (sent to admin and customer)
export const notifyDeliveryAccepted = (booking, driver) => {
  // Notify admin
  const admins = JSON.parse(localStorage.getItem('users') || '[]')
    .filter(u => u.role === 'admin');
  
  admins.forEach(admin => {
    addNotification(admin.id, 'admin', {
      type: NOTIFICATION_TYPES.DELIVERY_ACCEPTED,
      title: 'Delivery Accepted',
      message: `${driver.name} accepted delivery #${booking._id.slice(-6)}`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
      },
      priority: 'medium',
    });
  });
  
  // Notify customer
  const customer = JSON.parse(localStorage.getItem('users') || '[]')
    .find(u => u.email === booking.customerEmail);
  
  if (customer) {
    addNotification(customer.id, 'customer', {
      type: NOTIFICATION_TYPES.DELIVERY_ACCEPTED,
      title: 'Delivery Started',
      message: `Your driver ${driver.name} is on the way!`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
        driverMobile: driver.mobile,
      },
      priority: 'high',
    });
  }
};

// Create notification for delivery rejection (sent to admin)
export const notifyDeliveryRejected = (booking, driver, reason) => {
  const admins = JSON.parse(localStorage.getItem('users') || '[]')
    .filter(u => u.role === 'admin');
  
  admins.forEach(admin => {
    addNotification(admin.id, 'admin', {
      type: NOTIFICATION_TYPES.DELIVERY_REJECTED,
      title: 'Delivery Rejected',
      message: `${driver.name} rejected delivery #${booking._id.slice(-6)}`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
        reason: reason || 'No reason provided',
      },
      priority: 'high',
      actionRequired: true,
    });
  });
};

// Create notification for delivery completion
export const notifyDeliveryCompleted = (booking, driver) => {
  // Notify customer
  const customer = JSON.parse(localStorage.getItem('users') || '[]')
    .find(u => u.email === booking.customerEmail);
  
  if (customer) {
    addNotification(customer.id, 'customer', {
      type: NOTIFICATION_TYPES.DELIVERY_COMPLETED,
      title: 'Delivery Completed',
      message: `Your delivery has been completed successfully!`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
        amount: booking.payment,
      },
      priority: 'high',
    });
  }
  
  // Notify admin
  const admins = JSON.parse(localStorage.getItem('users') || '[]')
    .filter(u => u.role === 'admin');
  
  admins.forEach(admin => {
    addNotification(admin.id, 'admin', {
      type: NOTIFICATION_TYPES.DELIVERY_COMPLETED,
      title: 'Delivery Completed',
      message: `Delivery #${booking._id.slice(-6)} completed by ${driver.name}`,
      data: {
        bookingId: booking._id,
        driverName: driver.name,
      },
      priority: 'low',
    });
  });
  
  // Notify driver about payment
  addNotification(driver._id, 'driver', {
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    title: 'Payment Received',
    message: `₹${booking.driverPayment || booking.payment} added to your balance`,
    data: {
      bookingId: booking._id,
      amount: booking.driverPayment || booking.payment,
    },
    priority: 'medium',
  });
};

export default {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  clearNotifications,
  notifyNewBooking,
  notifyDriverAssignment,
  notifyDeliveryAccepted,
  notifyDeliveryRejected,
  notifyDeliveryCompleted,
  NOTIFICATION_TYPES,
};
