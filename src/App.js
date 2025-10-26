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
import DriverDashboard from './components/driver/DriverDashboard';
import UserDashboard from './components/user/UserDashboard';

// Admin Components
import AddVehicle from './components/admin/AddVehicle';
import AssignDriver from './components/admin/AssignDriver';
import PlanRoutes from './components/admin/PlanRoutes';

// Driver Components
import AssignedDeliveries from './components/driver/AssignedDeliveries';
import MarkCompleted from './components/driver/MarkCompleted';
import LiveTrackingMap from './components/driver/LiveTrackingMap';
import AllDeliveries from './components/driver/AllDeliveries';

// User Components
import TrackDelivery from './components/user/TrackDelivery';

// Map Components
import LiveMap from './components/map/LiveMap';
import RouteMap from './components/map/RouteMap';

// Home Dashboard
import HomeDashboard from './components/home/HomeDashboard';

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
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} /> }>
                <Route index element={<AdminDashboard />} />
                <Route path="vehicles/add" element={<AddVehicle />} />
                <Route path="drivers/assign" element={<AssignDriver />} />
                <Route path="routes/plan" element={<PlanRoutes />} />
                <Route path="map/live" element={<LiveMap />} />
              </Route>

              <Route path="/driver" element={<PrivateRoute allowedRoles={['driver']} /> }>
                <Route index element={<DriverDashboard />} />
                <Route path="dashboard" element={<DriverDashboard />} />
                <Route path="deliveries" element={<AllDeliveries />} />
                <Route path="deliveries/:id/complete" element={<MarkCompleted />} />
                <Route path="map/live" element={<LiveTrackingMap />} />
              </Route>

              <Route path="/user" element={<PrivateRoute allowedRoles={['customer']} /> }>
                <Route index element={<UserDashboard />} />
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
