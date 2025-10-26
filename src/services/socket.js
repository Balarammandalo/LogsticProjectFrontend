import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(user) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;

      // Join appropriate rooms based on user role
      if (user.role === 'driver') {
        this.socket.emit('join-driver-room', user._id);
      } else if (user.role === 'admin') {
        this.socket.emit('join-admin-room');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Driver methods
  updateLocation(driverId, vehicleId, deliveryId, location, speed, heading, status) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-location', {
        driverId,
        vehicleId,
        deliveryId,
        location,
        speed,
        heading,
        status,
      });
    }
  }

  updateDeliveryStatus(deliveryId, status, notes) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-delivery-status', {
        deliveryId,
        status,
        notes,
      });
    }
  }

  updateDriverStatus(driverId, status) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-driver-status', {
        driverId,
        status,
      });
    }
  }

  // Customer/Admin methods
  joinDeliveryRoom(deliveryId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-delivery-room', deliveryId);
    }
  }

  // Generic event methods
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Event listeners
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('location-update', callback);
    }
  }

  onStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('status-update', callback);
    }
  }

  onTrackingUpdate(callback) {
    if (this.socket) {
      this.socket.on('tracking-update', callback);
    }
  }

  onDriverStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('driver-status-update', callback);
    }
  }

  onDeliveryStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('delivery-status-update', callback);
    }
  }

  // Remove listeners
  offLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('location-update', callback);
    }
  }

  offStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('status-update', callback);
    }
  }

  offTrackingUpdate(callback) {
    if (this.socket) {
      this.socket.off('tracking-update', callback);
    }
  }

  offDriverStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('driver-status-update', callback);
    }
  }

  offDeliveryStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('delivery-status-update', callback);
    }
  }

  // Error handling
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  offError(callback) {
    if (this.socket) {
      this.socket.off('error', callback);
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
