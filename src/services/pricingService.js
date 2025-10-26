// Pricing Service for Dynamic Payment Calculation

// Base rates per km for different vehicle types
const VEHICLE_RATES = {
  bike: {
    baseRate: 10,
    perKm: 8,
    driverShare: 0.7, // 70% to driver
    vehicleCharge: 0.3, // 30% vehicle cost
    minCharge: 50,
  },
  van: {
    baseRate: 50,
    perKm: 15,
    driverShare: 0.65,
    vehicleCharge: 0.35,
    minCharge: 100,
  },
  'mini-truck': {
    baseRate: 100,
    perKm: 20,
    driverShare: 0.6,
    vehicleCharge: 0.4,
    minCharge: 200,
  },
  truck: {
    baseRate: 150,
    perKm: 25,
    driverShare: 0.6,
    vehicleCharge: 0.4,
    minCharge: 300,
  },
  lorry: {
    baseRate: 200,
    perKm: 30,
    driverShare: 0.55,
    vehicleCharge: 0.45,
    minCharge: 400,
  },
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

// Calculate total delivery cost
export const calculateDeliveryCost = (vehicleType, distance, hasOwnVehicle = false) => {
  const rates = VEHICLE_RATES[vehicleType] || VEHICLE_RATES.bike;
  
  // Base calculation
  let totalCost = rates.baseRate + (distance * rates.perKm);
  
  // Apply minimum charge
  if (totalCost < rates.minCharge) {
    totalCost = rates.minCharge;
  }
  
  // Calculate breakdown
  let driverPayment, vehicleCharge;
  
  if (hasOwnVehicle) {
    // If driver has own vehicle, they get full amount
    driverPayment = totalCost;
    vehicleCharge = 0;
  } else {
    // Split between driver and vehicle cost
    driverPayment = Math.round(totalCost * rates.driverShare);
    vehicleCharge = Math.round(totalCost * rates.vehicleCharge);
  }
  
  return {
    totalCost: Math.round(totalCost),
    driverPayment,
    vehicleCharge,
    distance,
    vehicleType,
    breakdown: {
      baseRate: rates.baseRate,
      distanceCharge: Math.round(distance * rates.perKm),
      perKmRate: rates.perKm,
    },
  };
};

// Get vehicle rate info
export const getVehicleRates = (vehicleType) => {
  return VEHICLE_RATES[vehicleType] || VEHICLE_RATES.bike;
};

// Calculate estimated fuel cost
export const calculateFuelCost = (distance, vehicleType, fuelPrice = 100) => {
  const fuelEfficiency = {
    bike: 40, // km per liter
    van: 12,
    'mini-truck': 10,
    truck: 8,
    lorry: 6,
  };
  
  const efficiency = fuelEfficiency[vehicleType] || 15;
  const fuelNeeded = distance / efficiency;
  const fuelCost = fuelNeeded * fuelPrice;
  
  return {
    fuelNeeded: Math.round(fuelNeeded * 100) / 100,
    fuelCost: Math.round(fuelCost),
    efficiency,
  };
};

// Calculate net earnings for driver
export const calculateNetEarnings = (driverPayment, distance, vehicleType) => {
  const fuelData = calculateFuelCost(distance, vehicleType);
  const netEarnings = driverPayment - fuelData.fuelCost;
  
  return {
    grossEarnings: driverPayment,
    fuelCost: fuelData.fuelCost,
    netEarnings: Math.round(netEarnings),
    fuelNeeded: fuelData.fuelNeeded,
  };
};

export default {
  calculateDistance,
  calculateDeliveryCost,
  getVehicleRates,
  calculateFuelCost,
  calculateNetEarnings,
  VEHICLE_RATES,
};
