import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './services/AuthContext';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import './styles/theme.css';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminDashboardNew from './components/admin/AdminDashboardNew';
import DriverDashboard from './components/driver/DriverDashboard';
import DriverDashboardNew from './components/driver/DriverDashboardNew';
import UserDashboard from './components/user/UserDashboard';

// Admin Components
import AddVehicle from './components/admin/AddVehicle';
import AssignDriver from './components/admin/AssignDriver';
import PlanRoutes from './components/admin/PlanRoutes';
import BookingManagement from './components/admin/BookingManagement';

// Driver Components
import AssignedDeliveries from './components/driver/AssignedDeliveries';
import MarkCompleted from './components/driver/MarkCompleted';
import LiveTrackingMap from './components/driver/LiveTrackingMap';
import AllDeliveries from './components/driver/AllDeliveries';

// User Components
import TrackDelivery from './components/user/TrackDelivery';
import LogisticsBooking from './components/user/LogisticsBooking';
import OrderDetails from './components/user/OrderDetails';

// Map Components
import LiveMap from './components/map/LiveMap';
import RouteMap from './components/map/RouteMap';

// Home Dashboard
import HomeDashboard from './components/home/HomeDashboard';

// Public Pages
import AboutUs from './components/pages/AboutUs';
import Services from './components/pages/Services';
import Contact from './components/pages/Contact';
import Careers from './components/pages/Careers';
import Documentation from './components/pages/Documentation';
import ApiReference from './components/pages/ApiReference';
import Blog from './components/pages/Blog';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <CustomThemeProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomeDashboard />} />
                <Route path="/home" element={<HomeDashboard />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/api-reference" element={<ApiReference />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} /> }>
                <Route index element={<AdminDashboardNew />} />
                <Route path="old" element={<AdminDashboard />} />
                <Route path="bookings" element={<BookingManagement />} />
                <Route path="vehicles/add" element={<AddVehicle />} />
                <Route path="drivers/assign" element={<AssignDriver />} />
                <Route path="routes/plan" element={<PlanRoutes />} />
                <Route path="map/live" element={<LiveMap />} />
              </Route>

              <Route path="/driver" element={<PrivateRoute allowedRoles={['driver']} /> }>
                <Route index element={<DriverDashboardNew />} />
                <Route path="dashboard" element={<DriverDashboardNew />} />
                <Route path="old" element={<DriverDashboard />} />
                <Route path="deliveries" element={<AllDeliveries />} />
                <Route path="assigned" element={<AssignedDeliveries />} />
                <Route path="completed" element={<MarkCompleted />} />
                <Route path="tracking" element={<LiveTrackingMap />} />
              </Route>

              <Route path="/user" element={<PrivateRoute allowedRoles={['customer']} /> }>
                <Route index element={<UserDashboard />} />
                <Route path="book-logistics" element={<LogisticsBooking />} />
                <Route path="orders/:orderId" element={<OrderDetails />} />
                <Route path="deliveries/:id/track" element={<TrackDelivery />} />
                <Route path="map/route" element={<RouteMap />} />
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </CustomThemeProvider>
  );
}

export default App;
