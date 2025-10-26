# 🚀 Quick Implementation Guide - Real-Time Dashboard Sync

## Overview
This guide shows you how to integrate the pricing and notification services into your existing dashboards.

---

## ✅ What's Already Done

**Created Files:**
1. ✅ `pricingService.js` - Dynamic payment calculation
2. ✅ `notificationService.js` - Real-time notifications
3. ✅ `NotificationBell.js` - Notification UI component

---

## 📝 Step-by-Step Integration

### **Step 1: Add Notification Bell to All Dashboards**

#### **Admin Dashboard:**
```javascript
// In AdminDashboardNew.js
import NotificationBell from '../common/NotificationBell';

// In header section (around line 340)
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <NotificationBell onNotificationClick={(notif) => {
    // Handle notification click
    if (notif.data?.bookingId) {
      // Navigate to booking
      console.log('Go to booking:', notif.data.bookingId);
    }
  }} />
  <Button variant="outlined" onClick={logout}>
    Logout
  </Button>
</Box>
```

#### **Driver Dashboard:**
```javascript
// In DriverDashboardNew.js
import NotificationBell from '../common/NotificationBell';

// In header section (around line 320)
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  <FormControlLabel
    control={<Switch checked={isAvailable} onChange={handleAvailabilityToggle} />}
    label={isAvailable ? '🟢 Available' : '🔴 Offline'}
  />
  <NotificationBell onNotificationClick={handleNotificationClick} />
  <Button variant="outlined" onClick={logout}>
    Logout
  </Button>
</Box>
```

#### **Customer Dashboard:**
```javascript
// In UserDashboard.js
import NotificationBell from '../common/NotificationBell';

// In header/navbar
<NotificationBell onNotificationClick={(notif) => {
  if (notif.data?.bookingId) {
    // Navigate to order details
    navigate(`/user/orders/${notif.data.bookingId}`);
  }
}} />
```

---

### **Step 2: Update Booking Form with Dynamic Pricing**

#### **In LogisticsBooking.js:**

```javascript
// Add imports
import { calculateDistance, calculateDeliveryCost } from '../../services/pricingService';
import { notifyNewBooking } from '../../services/notificationService';

// Add state for pricing
const [pricing, setPricing] = useState(null);
const [distance, setDistance] = useState(0);

// Calculate price when locations and vehicle type change
useEffect(() => {
  if (pickupLocation && dropLocation && vehicleType) {
    // Calculate distance
    const dist = calculateDistance(
      pickupLocation.lat,
      pickupLocation.lon,
      dropLocation.lat,
      dropLocation.lon
    );
    setDistance(dist);
    
    // Calculate pricing
    const price = calculateDeliveryCost(vehicleType, dist, false);
    setPricing(price);
  }
}, [pickupLocation, dropLocation, vehicleType]);

// Display pricing to customer
{pricing && (
  <Card sx={{ mt: 2, p: 2, bgcolor: 'primary.light' }}>
    <Typography variant="h6">Price Estimate</Typography>
    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.dark' }}>
      ₹{pricing.totalCost}
    </Typography>
    <Typography variant="caption">
      Distance: {distance} km | Base: ₹{pricing.breakdown.baseRate} + 
      Distance Charge: ₹{pricing.breakdown.distanceCharge}
    </Typography>
  </Card>
)}

// On booking submission
const handleSubmit = async () => {
  const booking = {
    _id: 'ord' + Date.now(),
    customerName: user.name,
    customerEmail: user.email,
    pickupLocation,
    dropLocation,
    vehicleType,
    distance,
    payment: pricing.totalCost,
    driverPayment: pricing.driverPayment,
    vehicleCharge: pricing.vehicleCharge,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  // Save booking
  const orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
  orders.push(booking);
  localStorage.setItem('customerOrders', JSON.stringify(orders));
  
  // Send notification to admin
  notifyNewBooking(booking);
  
  // Show success message
  alert('Booking created successfully!');
};
```

---

### **Step 3: Update Admin Assignment with Pricing**

#### **In BookingManagement.js:**

```javascript
// Add imports
import { calculateDeliveryCost } from '../../services/pricingService';
import { notifyDriverAssignment } from '../../services/notificationService';

// In handleAssignmentComplete function
const handleAssignmentComplete = (assignmentData) => {
  const { driver, vehicle } = assignmentData;
  
  // Check if driver has own vehicle
  const hasOwnVehicle = driver.assignedVehicle !== null;
  
  // Recalculate pricing based on vehicle ownership
  const pricing = calculateDeliveryCost(
    selectedBooking.vehicleType,
    selectedBooking.distance,
    hasOwnVehicle
  );
  
  // Update booking
  const updatedBooking = {
    ...selectedBooking,
    assignedDriver: {
      id: driver._id,
      name: driver.name,
      mobile: driver.mobile,
      hasOwnVehicle,
    },
    assignedVehicle: hasOwnVehicle ? 
      { id: driver.assignedVehicle, /* vehicle details */ } : 
      { id: vehicle._id, number: vehicle.vehicleNumber, type: vehicle.vehicleType },
    driverPayment: pricing.driverPayment,
    vehicleCharge: pricing.vehicleCharge,
    status: 'assigned',
    assignedAt: new Date().toISOString(),
  };
  
  // Save
  const orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
  const updatedOrders = orders.map(o => 
    o._id === updatedBooking._id ? updatedBooking : o
  );
  localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
  
  // Send notifications
  notifyDriverAssignment(updatedBooking, driver);
  
  // Refresh and close
  loadBookings();
  setAssignmentDialogOpen(false);
  setSuccessMessage('Driver assigned successfully!');
};

// Display cost breakdown in booking details
<Box>
  <Typography variant="h6">Payment Breakdown</Typography>
  <Typography>Total Cost: ₹{booking.payment}</Typography>
  <Typography>Driver Payment: ₹{booking.driverPayment}</Typography>
  <Typography>Vehicle Charge: ₹{booking.vehicleCharge}</Typography>
  {booking.assignedDriver?.hasOwnVehicle && (
    <Chip label="Driver's Own Vehicle" color="success" size="small" />
  )}
</Box>
```

---

### **Step 4: Add Accept/Reject Dialog to Driver Dashboard**

#### **In DriverDashboardNew.js:**

```javascript
// Add imports
import { notifyDeliveryAccepted, notifyDeliveryRejected } from '../../services/notificationService';

// Add state
const [assignmentDialog, setAssignmentDialog] = useState(false);
const [pendingDelivery, setPendingDelivery] = useState(null);

// Listen for assignment notifications
useEffect(() => {
  const handleNewNotification = (event) => {
    const notification = event.detail.notification;
    if (notification.type === 'driver_assigned' && notification.actionRequired) {
      setPendingDelivery(notification.data);
      setAssignmentDialog(true);
    }
  };
  
  window.addEventListener('newNotification', handleNewNotification);
  return () => window.removeEventListener('newNotification', handleNewNotification);
}, []);

// Accept delivery
const handleAcceptDelivery = () => {
  // Get booking
  const orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
  const booking = orders.find(o => o._id === pendingDelivery.bookingId);
  
  if (booking) {
    // Update status
    booking.status = 'in-transit';
    booking.acceptedAt = new Date().toISOString();
    
    // Save
    const updatedOrders = orders.map(o => o._id === booking._id ? booking : o);
    localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
    
    // Notify admin and customer
    notifyDeliveryAccepted(booking, driverData);
    
    // Close dialog and refresh
    setAssignmentDialog(false);
    setPendingDelivery(null);
    loadDeliveries();
    setSuccessMessage('Delivery accepted! Good luck!');
  }
};

// Reject delivery
const handleRejectDelivery = () => {
  const orders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
  const booking = orders.find(o => o._id === pendingDelivery.bookingId);
  
  if (booking) {
    // Remove assignment
    booking.status = 'pending';
    booking.assignedDriver = null;
    booking.assignedVehicle = null;
    
    // Save
    const updatedOrders = orders.map(o => o._id === booking._id ? booking : o);
    localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
    
    // Notify admin
    notifyDeliveryRejected(booking, driverData, 'Not available');
    
    // Close dialog
    setAssignmentDialog(false);
    setPendingDelivery(null);
    setSuccessMessage('Delivery rejected');
  }
};

// Add dialog before closing Container
<Dialog 
  open={assignmentDialog} 
  onClose={() => {}} 
  maxWidth="sm" 
  fullWidth
  disableEscapeKeyDown
>
  <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
    🚚 New Delivery Assigned
  </DialogTitle>
  <DialogContent sx={{ mt: 2 }}>
    {pendingDelivery && (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Route</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            📍 {pendingDelivery.pickup?.address || pendingDelivery.pickup}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
            ↓
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            📍 {pendingDelivery.drop?.address || pendingDelivery.drop}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Distance</Typography>
          <Typography variant="h6">{pendingDelivery.distance} km</Typography>
        </Box>
        
        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="success.dark">Your Earnings</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.dark' }}>
            ₹{pendingDelivery.amount}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
            {pendingDelivery.vehicleType}
          </Typography>
        </Box>
      </Box>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button 
      onClick={handleRejectDelivery} 
      color="error" 
      variant="outlined"
      fullWidth
    >
      Reject
    </Button>
    <Button 
      onClick={handleAcceptDelivery} 
      color="success" 
      variant="contained"
      fullWidth
    >
      Accept Delivery
    </Button>
  </DialogActions>
</Dialog>
```

---

### **Step 5: Add Status Color Indicators**

#### **Create utility function (add to any component):**

```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'; // Yellow
    case 'assigned':
      return 'info'; // Light Blue
    case 'in-transit':
      return 'primary'; // Blue
    case 'delivered':
      return 'success'; // Green
    case 'cancelled':
      return 'error'; // Red
    default:
      return 'default';
  }
};

// Usage
<Chip 
  label={order.status} 
  color={getStatusColor(order.status)}
  size="small"
  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
/>
```

---

## 🎨 UI Enhancements

### **Earnings Display with Breakdown:**

```javascript
<Card elevation={3}>
  <CardContent>
    <Typography variant="h6">Delivery Earnings</Typography>
    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', my: 1 }}>
      ₹{delivery.driverPayment}
    </Typography>
    
    {delivery.vehicleCharge > 0 ? (
      <Box>
        <Typography variant="caption" color="text.secondary">
          Driver Share: ₹{delivery.driverPayment} | 
          Vehicle Cost: ₹{delivery.vehicleCharge}
        </Typography>
      </Box>
    ) : (
      <Chip 
        label="Own Vehicle - Full Payment" 
        color="success" 
        size="small"
        icon={<CheckCircle />}
      />
    )}
  </CardContent>
</Card>
```

### **Delivery Cards with Actions:**

```javascript
<Card elevation={3}>
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h6">#{delivery._id.slice(-6)}</Typography>
      <Chip label={delivery.status} color={getStatusColor(delivery.status)} />
    </Box>
    
    <Typography variant="body2" color="text.secondary">Customer</Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
      {delivery.customerName}
    </Typography>
    
    <Typography variant="body2" color="text.secondary">Route</Typography>
    <Typography variant="body1" sx={{ mb: 1 }}>
      {delivery.pickupLocation} → {delivery.dropLocation}
    </Typography>
    
    <Typography variant="body2" color="text.secondary">Earnings</Typography>
    <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 700, mb: 2 }}>
      ₹{delivery.driverPayment}
    </Typography>
    
    <Box sx={{ display: 'flex', gap: 1 }}>
      {delivery.status === 'in-transit' && (
        <>
          <Button 
            variant="contained" 
            color="success" 
            fullWidth
            startIcon={<CheckCircle />}
            onClick={() => handleMarkDelivered(delivery)}
          >
            Mark Delivered
          </Button>
          <IconButton onClick={() => handleViewMap(delivery)}>
            <Map />
          </IconButton>
        </>
      )}
      {delivery.status === 'delivered' && (
        <Button 
          variant="outlined" 
          fullWidth
          startIcon={<Visibility />}
          onClick={() => handleViewDetails(delivery)}
        >
          View Details
        </Button>
      )}
    </Box>
  </CardContent>
</Card>
```

---

## 🔄 Real-Time Sync

### **Add to all dashboards:**

```javascript
// Auto-refresh data every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    loadBookings();
    loadDeliveries();
    // Load other data
  }, 5000);
  
  return () => clearInterval(interval);
}, []);

// Listen for custom events
useEffect(() => {
  const handleBookingUpdate = () => {
    loadBookings();
  };
  
  window.addEventListener('bookingUpdated', handleBookingUpdate);
  return () => window.removeEventListener('bookingUpdated', handleBookingUpdate);
}, []);
```

---

## ✅ Testing Checklist

- [ ] Customer can see dynamic pricing
- [ ] Admin receives new booking notification
- [ ] Admin can assign driver with cost breakdown
- [ ] Driver receives assignment notification popup
- [ ] Driver can accept/reject delivery
- [ ] Customer sees driver details after assignment
- [ ] All notification bells show unread count
- [ ] Status colors display correctly
- [ ] Real-time updates work across dashboards
- [ ] Own vehicle detection works
- [ ] Payment breakdown displays correctly

---

## 🎯 Quick Test Flow

1. **Customer:** Book delivery → See price → Confirm
2. **Admin:** See notification → Assign driver → See breakdown
3. **Driver:** See popup → Accept → See in active deliveries
4. **Customer:** See driver assigned notification
5. **Driver:** Mark delivered → See payment
6. **Customer:** See completion notification

---

## 📝 Notes

- All services use localStorage for demo
- Notifications auto-refresh every 5 seconds
- Custom events provide real-time updates
- For production, replace with WebSocket/API calls
- All pricing calculations are automatic
- Own vehicle detection is built-in

**Implementation is straightforward - just follow the steps above!** ✅
