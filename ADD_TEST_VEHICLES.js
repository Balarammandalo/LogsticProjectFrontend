// TEST SCRIPT: Add test vehicles to localStorage
// Open browser console and paste this code to test the vehicle sync system

const testVehicles = [
  {
    id: 'veh_' + Date.now() + '_1',
    vehicleNumber: 'MH-12-AB-1234',
    type: 'bike',
    capacity: 50,
    status: 'available',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Andheri, Mumbai, Maharashtra 400053',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh_' + Date.now() + '_2',
    vehicleNumber: 'DL-01-CD-5678',
    type: 'car',
    capacity: 500,
    status: 'available',
    currentLocation: {
      latitude: 28.7041,
      longitude: 77.1025,
      address: 'Connaught Place, Delhi 110001',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh_' + Date.now() + '_3',
    vehicleNumber: 'KA-03-EF-9012',
    type: 'van',
    capacity: 1000,
    status: 'available',
    currentLocation: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Koramangala, Bangalore, Karnataka 560034',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh_' + Date.now() + '_4',
    vehicleNumber: 'TS-09-GH-3456',
    type: 'truck',
    capacity: 2000,
    status: 'in-use', // This won't show in driver dashboard
    currentLocation: {
      latitude: 17.3850,
      longitude: 78.4867,
      address: 'Gachibowli, Hyderabad, Telangana 500032',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'veh_' + Date.now() + '_5',
    vehicleNumber: 'MH-14-IJ-7890',
    type: 'bike',
    capacity: 30,
    status: 'maintenance', // This won't show in driver dashboard
    currentLocation: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Hinjewadi, Pune, Maharashtra 411057',
    },
    createdAt: new Date().toISOString(),
  },
];

// Save to localStorage
localStorage.setItem('adminVehicles', JSON.stringify(testVehicles));

console.log('✅ Test vehicles added successfully!');
console.log('Total vehicles:', testVehicles.length);
console.log('Available vehicles:', testVehicles.filter(v => v.status === 'available').length);
console.log('In-use vehicles:', testVehicles.filter(v => v.status === 'in-use').length);
console.log('Maintenance vehicles:', testVehicles.filter(v => v.status === 'maintenance').length);
console.log('\nVehicles:', testVehicles);
console.log('\n📌 Refresh the driver dashboard to see available vehicles!');
console.log('📌 Only vehicles with status "available" will be shown.');

// To clear vehicles
// localStorage.removeItem('adminVehicles');
// console.log('✅ Vehicles cleared!');
