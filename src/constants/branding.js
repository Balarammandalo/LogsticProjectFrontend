// TrackMate Branding Constants

export const BRAND = {
  name: 'TrackMate',
  tagline: 'Smart Logistics, Delivered',
  logo: '📦',
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
    warning: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    info: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    dark: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
  },
  backgrounds: {
    light: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    logistics: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    map: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23667eea\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
};

export const NAVIGATION_ITEMS = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Bookings', path: '/admin', icon: '📦' },
    { label: 'Drivers', path: '/admin', icon: '👥' },
    { label: 'Vehicles', path: '/admin', icon: '🚗' },
  ],
  driver: [
    { label: 'Dashboard', path: '/driver', icon: '📊' },
    { label: 'Deliveries', path: '/driver', icon: '📦' },
    { label: 'Earnings', path: '/driver', icon: '💰' },
    { label: 'Profile', path: '/driver', icon: '👤' },
  ],
  customer: [
    { label: 'Home', path: '/user', icon: '🏠' },
    { label: 'Book Delivery', path: '/user/book-logistics', icon: '📦' },
    { label: 'My Orders', path: '/user', icon: '📋' },
    { label: 'Track', path: '/user', icon: '📍' },
  ],
};

export default BRAND;
