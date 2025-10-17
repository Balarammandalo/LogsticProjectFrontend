import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/profile');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, ...userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      const { token: newToken, ...newUserData } = res.data;

      // If driver registration, add to approvedDrivers FIRST (before setting token)
      if (userData.role === 'driver') {
        const approvedDrivers = JSON.parse(localStorage.getItem('approvedDrivers') || '[]');
        const newDriver = {
          id: newUserData._id || `driver_${Date.now()}`,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          vehicleNumber: userData.vehicleNumber || 'Not Assigned',
          status: 'approved',
          approvedAt: new Date().toISOString(),
        };
        
        // Check if driver already exists
        const existingIndex = approvedDrivers.findIndex(d => d.email === userData.email);
        if (existingIndex === -1) {
          approvedDrivers.push(newDriver);
          localStorage.setItem('approvedDrivers', JSON.stringify(approvedDrivers));
          console.log('✅ Driver saved to approvedDrivers:', newDriver);
          console.log('📋 Total approved drivers:', approvedDrivers.length);
        } else {
          console.log('⚠️ Driver already exists in approvedDrivers');
        }
      }

      // Now set token and user
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUserData);

      return { success: true, user: newUserData };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isCustomer: user?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
