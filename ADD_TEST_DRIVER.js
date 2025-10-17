// TEST SCRIPT: Add a pending driver to localStorage
// Open browser console and paste this code to test the driver approval system

const testDriver = {
  id: 'driver_' + Date.now(),
  name: 'Rajesh Kumar',
  phone: '+91 9876543210',
  email: 'rajesh.kumar@example.com',
  vehicleType: 'Bike',
  vehicleNumber: 'MH-12-AB-1234',
  licenseNumber: 'DL-1420110012345',
  registeredAt: new Date().toISOString(),
  status: 'pending',
};

// Get existing pending drivers
const existingDrivers = JSON.parse(localStorage.getItem('pendingDrivers') || '[]');

// Add new driver
existingDrivers.push(testDriver);

// Save to localStorage
localStorage.setItem('pendingDrivers', JSON.stringify(existingDrivers));

console.log('✅ Test driver added successfully!');
console.log('Driver Details:', testDriver);
console.log('Refresh the admin dashboard to see the pending driver.');

// To add multiple test drivers, run this:
/*
const testDrivers = [
  {
    id: 'driver_' + Date.now() + '_1',
    name: 'Amit Singh',
    phone: '+91 9988776655',
    email: 'amit.singh@example.com',
    vehicleType: 'Car',
    vehicleNumber: 'DL-01-CD-5678',
    licenseNumber: 'DL-1420110098765',
    registeredAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: 'driver_' + Date.now() + '_2',
    name: 'Priya Sharma',
    phone: '+91 8877665544',
    email: 'priya.sharma@example.com',
    vehicleType: 'Bike',
    vehicleNumber: 'KA-03-EF-9012',
    licenseNumber: 'KA-1420110054321',
    registeredAt: new Date().toISOString(),
    status: 'pending',
  },
];

const existing = JSON.parse(localStorage.getItem('pendingDrivers') || '[]');
localStorage.setItem('pendingDrivers', JSON.stringify([...existing, ...testDrivers]));
console.log('✅ Multiple test drivers added!');
*/
