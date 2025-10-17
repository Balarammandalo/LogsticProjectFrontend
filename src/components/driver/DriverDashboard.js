import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { deliveryAPI } from '../../services/api';
import socketService from '../../services/socket';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Fade,
  Grow,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import LocalShipping from '@mui/icons-material/LocalShipping';
import CheckCircle from '@mui/icons-material/CheckCircle';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import PendingActions from '@mui/icons-material/PendingActions';
import Logout from '@mui/icons-material/Logout';
import MyLocation from '@mui/icons-material/MyLocation';
import LocationOff from '@mui/icons-material/LocationOff';
import LocationOn from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import Assignment from '@mui/icons-material/Assignment';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AccountBalance from '@mui/icons-material/AccountBalance';
import QrCode2 from '@mui/icons-material/QrCode2';
import ContentCopy from '@mui/icons-material/ContentCopy';
import History from '@mui/icons-material/History';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Edit from '@mui/icons-material/Edit';
import Navigation from '@mui/icons-material/Navigation';
import Timer from '@mui/icons-material/Timer';
import { Link } from 'react-router-dom';
import { formatDate, formatStatus, getStatusColor } from '../../utils/auth';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  
  // Helper function to get user-specific localStorage key
  const getUserKey = (baseKey) => {
    const userId = user?.id || user?.email || 'default';
    return `${baseKey}_${userId}`;
  };
  const [deliveries, setDeliveries] = useState(() => {
    const userId = user?.id || user?.email || 'default';
    const saved = localStorage.getItem(`driverDeliveries_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [stats, setStats] = useState(() => {
    const userId = user?.id || user?.email || 'default';
    const saved = localStorage.getItem(`driverStats_${userId}`);
    return saved ? JSON.parse(saved) : {
      totalDeliveries: 0,
      completedDeliveries: 0,
      activeDeliveries: 0,
      pendingDeliveries: 0,
    };
  });
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [walletBalance, setWalletBalance] = useState(() => {
    const userId = user?.id || user?.email || 'default';
    const saved = localStorage.getItem(`driverWalletBalance_${userId}`);
    return saved ? parseFloat(saved) : 0;
  });
  const [totalEarnings, setTotalEarnings] = useState(() => {
    const userId = user?.id || user?.email || 'default';
    const saved = localStorage.getItem(`driverTotalEarnings_${userId}`);
    return saved ? parseFloat(saved) : 0;
  });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'active', 'pending'
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank'); // 'bank' or 'upi'
  const [editedBankDetails, setEditedBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    upiId: '',
  });
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [driverDetails, setDriverDetails] = useState(() => {
    const saved = localStorage.getItem('driverProfileDetails');
    return saved ? JSON.parse(saved) : {
      name: user.name || 'Driver Name',
      phone: user.phone || '+91 9876543210',
      vehicleNumber: 'MH 12 AB 1234',
      vehicleType: 'Bike',
      rating: 4.5,
      totalDeliveries: 156,
    };
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({...driverDetails});
  const [vehicleSelectionDialogOpen, setVehicleSelectionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingInDialog, setEditingInDialog] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    loadDeliveries();
    loadPendingAssignments();
    connectSocket();
    getCurrentLocation();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const loadAvailableVehicles = () => {
    // Load vehicles from admin - shared across all drivers
    const adminVehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
    // Filter only available vehicles
    const available = adminVehicles.filter(v => v.status === 'available');
    setAvailableVehicles(available);
    console.log('Loaded vehicles for driver:', available.length, 'available vehicles');
  };

  // Reload vehicles when window gains focus (to catch updates from admin)
  useEffect(() => {
    const handleFocus = () => {
      loadAvailableVehicles();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Also check for storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'adminVehicles') {
        loadAvailableVehicles();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadPendingAssignments = () => {
    // Load pending assignments from admin
    const adminAssignments = JSON.parse(localStorage.getItem('driverPendingAssignments') || '[]');
    
    // Get list of accepted/delivered deliveries to filter out
    const userId = user?.id || user?.email || 'default';
    const driverDeliveries = JSON.parse(localStorage.getItem(`driverDeliveries_${userId}`) || '[]');
    const acceptedIds = new Set(driverDeliveries.map(d => d._id));
    
    // Also check customer orders for delivered status
    const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const deliveredIds = new Set(customerOrders.filter(o => o.status === 'delivered').map(o => o._id));
    
    // Filter out already accepted or delivered assignments
    const filteredAdminAssignments = adminAssignments.filter(a => 
      !acceptedIds.has(a._id) && !deliveredIds.has(a._id)
    );
    
    // Only show dummy assignments if no real assignments exist
    const dummyPendingAssignments = filteredAdminAssignments.length === 0 ? [
      {
        _id: 'assign001',
        customer: { name: 'Tech Store Mumbai' },
        pickupLocation: { address: 'Powai, Mumbai, Maharashtra 400076' },
        dropLocation: { address: 'Thane, Mumbai, Maharashtra 400601' },
        packageDetails: 'Electronics - Laptop (2.5kg)',
        payment: 320,
        distance: 15.2,
        estimatedTime: 35,
        assignedAt: new Date().toISOString(),
      },
    ].filter(a => !acceptedIds.has(a._id) && !deliveredIds.has(a._id)) : [];
    
    // Merge filtered assignments
    const savedAssignments = localStorage.getItem('pendingAssignments');
    const localAssignments = savedAssignments ? JSON.parse(savedAssignments) : [];
    const filteredLocalAssignments = localAssignments.filter(a => 
      !acceptedIds.has(a._id) && !deliveredIds.has(a._id)
    );
    
    const allAssignments = [...filteredAdminAssignments, ...filteredLocalAssignments, ...dummyPendingAssignments];
    
    // Remove duplicates by _id
    const uniqueAssignments = Array.from(new Map(allAssignments.map(item => [item._id, item])).values());
    
    setPendingAssignments(uniqueAssignments);
    
    // Only show notification if there are REAL assignments (not dummy data)
    const realAssignments = [...filteredAdminAssignments, ...filteredLocalAssignments];
    if (realAssignments.length > 0) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      // Check if deliveries already exist in localStorage
      const savedDeliveries = localStorage.getItem('driverDeliveries');
      
      if (savedDeliveries) {
        // Use saved deliveries
        const parsedDeliveries = JSON.parse(savedDeliveries);
        setDeliveries(parsedDeliveries);
        
        // Recalculate stats from saved deliveries
        const completed = parsedDeliveries.filter(d => d.status === 'delivered').length;
        const active = parsedDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length;
        const pending = parsedDeliveries.filter(d => d.status === 'assigned').length;
        
        const newStats = {
          totalDeliveries: parsedDeliveries.length,
          completedDeliveries: completed,
          activeDeliveries: active,
          pendingDeliveries: pending,
        };
        setStats(newStats);
        localStorage.setItem(getUserKey('driverStats'), JSON.stringify(newStats));
      } else {
        // Load dummy data only if no saved data exists
        const dummyDeliveries = [
          {
            _id: 'del001',
            status: 'delivered',
            customer: { name: 'Tech Solutions Mumbai' },
            pickupLocation: { address: 'Andheri, Mumbai, Maharashtra 400053' },
            dropLocation: { address: 'Bandra, Mumbai, Maharashtra 400050' },
            packageDetails: 'Electronics - Laptop (2kg)',
            payment: 250,
            deliveredAt: '2025-01-15',
            createdAt: new Date('2025-01-15T10:30:00'),
          },
          {
            _id: 'del002',
            status: 'on-route',
            customer: { name: 'Retail Store Hyderabad' },
            pickupLocation: { address: 'Madhapur, Hyderabad, Telangana 500081' },
            dropLocation: { address: 'Banjara Hills, Hyderabad, Telangana 500034' },
            packageDetails: 'Documents - Important Files (0.5kg)',
            payment: 150,
            createdAt: new Date('2025-01-16T09:30:00'),
          },
          {
            _id: 'del003',
            status: 'delivered',
            customer: { name: 'Fashion Hub Bangalore' },
            pickupLocation: { address: 'Koramangala, Bangalore, Karnataka 560034' },
            dropLocation: { address: 'Indiranagar, Bangalore, Karnataka 560038' },
            packageDetails: 'Clothing - Fashion Items (3kg)',
            payment: 200,
            deliveredAt: '2025-01-14',
            createdAt: new Date('2025-01-14T14:20:00'),
          },
          {
            _id: 'del004',
            status: 'picked-up',
            customer: { name: 'Food Mart Delhi' },
            pickupLocation: { address: 'Connaught Place, Delhi 110001' },
            dropLocation: { address: 'Karol Bagh, Delhi 110005' },
            packageDetails: 'Food Items - Groceries (5kg)',
            payment: 180,
            createdAt: new Date('2025-01-16T07:15:00'),
          },
          {
            _id: 'del005',
            status: 'delivered',
            customer: { name: 'Book Store Chennai' },
            pickupLocation: { address: 'T Nagar, Chennai, Tamil Nadu 600017' },
            dropLocation: { address: 'Anna Nagar, Chennai, Tamil Nadu 600040' },
            packageDetails: 'Books - Educational Material (4kg)',
            payment: 220,
            deliveredAt: '2025-01-13',
            createdAt: new Date('2025-01-13T16:45:00'),
          },
          {
            _id: 'del006',
            status: 'assigned',
            customer: { name: 'Electronics Store Pune' },
            pickupLocation: { address: 'Hinjewadi, Pune, Maharashtra 411057' },
            dropLocation: { address: 'Viman Nagar, Pune, Maharashtra 411014' },
            packageDetails: 'Home Appliances - Small Items (6kg)',
            payment: 280,
            createdAt: new Date('2025-01-16T06:30:00'),
          },
          {
            _id: 'del007',
            status: 'delivered',
            customer: { name: 'Mobile Shop Kolkata' },
            pickupLocation: { address: 'Salt Lake, Kolkata, West Bengal 700091' },
            dropLocation: { address: 'Park Street, Kolkata, West Bengal 700016' },
            packageDetails: 'Mobile Phone - New Device (1kg)',
            payment: 170,
            deliveredAt: '2025-01-12',
            createdAt: new Date('2025-01-12T11:20:00'),
          },
          {
            _id: 'del008',
            status: 'delivered',
            customer: { name: 'Office Supplies Ahmedabad' },
            pickupLocation: { address: 'Satellite, Ahmedabad, Gujarat 380015' },
            dropLocation: { address: 'Vastrapur, Ahmedabad, Gujarat 380015' },
            packageDetails: 'Office Supplies - Stationery (2kg)',
            payment: 140,
            deliveredAt: '2025-01-11',
            createdAt: new Date('2025-01-11T05:00:00'),
          },
        ];

        setDeliveries(dummyDeliveries);
        localStorage.setItem(getUserKey('driverDeliveries'), JSON.stringify(dummyDeliveries));

        const completed = dummyDeliveries.filter(d => d.status === 'delivered').length;
        const active = dummyDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length;
        const pending = dummyDeliveries.filter(d => d.status === 'assigned').length;

        const newStats = {
          totalDeliveries: dummyDeliveries.length,
          completedDeliveries: completed,
          activeDeliveries: active,
          pendingDeliveries: pending,
        };
        setStats(newStats);
        localStorage.setItem(getUserKey('driverStats'), JSON.stringify(newStats));

        // Calculate earnings from completed deliveries
        const completedDeliveries = dummyDeliveries.filter(d => d.status === 'delivered');
        const earnings = completedDeliveries.reduce((sum, delivery) => sum + delivery.payment, 0);
        
        // Only set initial values if not already in localStorage
        const savedBalance = localStorage.getItem('driverWalletBalance');
        const savedEarnings = localStorage.getItem('driverTotalEarnings');
        
        if (!savedBalance) {
          setWalletBalance(earnings);
          localStorage.setItem(getUserKey('driverWalletBalance'), earnings.toString());
        }
        if (!savedEarnings) {
          setTotalEarnings(earnings);
          localStorage.setItem(getUserKey('driverTotalEarnings'), earnings.toString());
        }
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketService.connect(user);

    // Listen for delivery status updates
    socketService.onDeliveryStatusUpdate((data) => {
      if (data.deliveryId) {
        loadDeliveries(); // Refresh deliveries
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const startTracking = () => {
    if (currentLocation && navigator.geolocation) {
      setTrackingActive(true);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setCurrentLocation(newLocation);

          // Send location update to server
          socketService.updateLocation(
            user._id,
            null, // vehicleId - would need to be set from assigned delivery
            null, // deliveryId - would need to be set from active delivery
            newLocation,
            0, // speed
            0, // heading
            'active' // status
          );
        },
        (error) => {
          console.error('Error tracking location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      // Store watchId for cleanup
      return () => navigator.geolocation.clearWatch(watchId);
    }
  };

  const stopTracking = () => {
    setTrackingActive(false);
    // Note: In a real app, you'd clear the geolocation watch here
  };

  const getFilteredDeliveries = () => {
    if (filterStatus === 'all') return deliveries;
    if (filterStatus === 'completed') return deliveries.filter(d => d.status === 'delivered');
    if (filterStatus === 'active') return deliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up');
    if (filterStatus === 'pending') return deliveries.filter(d => d.status === 'assigned');
    return deliveries;
  };

  const handleStatCardClick = (filter) => {
    if (filter === 'assigned') {
      handleViewPendingDeliveries();
    } else {
      setFilterStatus(filterStatus === filter ? 'all' : filter);
    }
  };

  // Bank and UPI details (stored in state)
  const [bankDetails, setBankDetails] = useState(() => {
    const saved = localStorage.getItem('driverBankDetails');
    return saved ? JSON.parse(saved) : {
      accountName: user.name || 'Driver Name',
      accountNumber: '1234567890123456',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branch: 'Hyderabad Main Branch',
      upiId: 'driver@paytm',
    };
  });

  // Transaction history state
  const [transactionHistory, setTransactionHistory] = useState(() => {
    const userId = user?.id || user?.email || 'default';
    const saved = localStorage.getItem(`driverTransactionHistory_${userId}`);
    return saved ? JSON.parse(saved) : [
      {
        id: 'TXN001',
        type: 'credit',
        amount: 250,
        description: 'Payment for Delivery #001',
        date: '2025-01-15',
        status: 'completed',
      },
      {
        id: 'TXN002',
        type: 'debit',
        amount: 500,
        description: 'Withdrawal to Bank Account',
        date: '2025-01-14',
        status: 'completed',
      },
      {
        id: 'TXN003',
        type: 'credit',
        amount: 200,
        description: 'Payment for Delivery #003',
        date: '2025-01-14',
        status: 'completed',
      },
      {
        id: 'TXN004',
        type: 'credit',
        amount: 220,
        description: 'Payment for Delivery #005',
        date: '2025-01-13',
        status: 'completed',
      },
      {
        id: 'TXN005',
        type: 'credit',
        amount: 170,
        description: 'Payment for Delivery #007',
        date: '2025-01-12',
        status: 'completed',
      },
      {
        id: 'TXN006',
        type: 'debit',
        amount: 300,
        description: 'Withdrawal via UPI',
        date: '2025-01-11',
        status: 'completed',
      },
      {
        id: 'TXN007',
        type: 'credit',
        amount: 140,
        description: 'Payment for Delivery #008',
        date: '2025-01-11',
        status: 'completed',
      },
    ];
  });

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleEditBankDetails = () => {
    setEditedBankDetails(bankDetails);
    setEditMode(true);
  };

  const handleSaveBankDetails = () => {
    setBankDetails(editedBankDetails);
    localStorage.setItem(getUserKey('driverBankDetails'), JSON.stringify(editedBankDetails));
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedBankDetails(bankDetails);
    setEditMode(false);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (amount > walletBalance) {
      alert('Insufficient balance');
      return;
    }

    // Update wallet balance
    const newBalance = walletBalance - amount;
    setWalletBalance(newBalance);
    localStorage.setItem(getUserKey('driverWalletBalance'), newBalance.toString());

    // Create new withdrawal transaction with method
    const withdrawalDestination = withdrawalMethod === 'bank' 
      ? `${bankDetails.bankName} (${bankDetails.accountNumber.slice(-4)})`
      : `UPI (${bankDetails.upiId})`;
    
    const newTransaction = {
      id: `TXN${String(transactionHistory.length + 1).padStart(3, '0')}`,
      type: 'debit',
      amount: amount,
      description: `Withdrawal to ${withdrawalDestination}`,
      method: withdrawalMethod === 'bank' ? 'Bank Transfer' : 'UPI',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    };

    // Add to transaction history (at the beginning for latest first)
    const updatedHistory = [newTransaction, ...transactionHistory];
    setTransactionHistory(updatedHistory);
    localStorage.setItem(getUserKey('driverTransactionHistory'), JSON.stringify(updatedHistory));

    // Show success message
    const methodText = withdrawalMethod === 'bank' ? 'Bank Account' : 'UPI ID';
    alert(`✅ Withdrawal of ₹${amount.toLocaleString('en-IN')} to ${methodText} initiated successfully!`);
    
    // Reset and close
    setWithdrawAmount('');
    setWithdrawalMethod('bank');
    setWithdrawDialogOpen(false);
  };

  const handleAcceptAssignment = (assignment) => {
    // Load available vehicles first
    loadAvailableVehicles();
    
    // Open vehicle selection dialog
    setSelectedAssignment(assignment);
    setSelectedVehicle(null);
    setVehicleSelectionDialogOpen(true);
  };

  const confirmAcceptWithVehicle = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle first!');
      return;
    }

    const assignment = selectedAssignment;

    // Remove from pending assignments
    const updatedAssignments = pendingAssignments.filter(a => a._id !== assignment._id);
    setPendingAssignments(updatedAssignments);
    localStorage.setItem('pendingAssignments', JSON.stringify(updatedAssignments));
    
    // Remove from shared driver assignments
    const driverAssignments = JSON.parse(localStorage.getItem('driverPendingAssignments') || '[]');
    const updatedDriverAssignments = driverAssignments.filter(a => a._id !== assignment._id);
    localStorage.setItem('driverPendingAssignments', JSON.stringify(updatedDriverAssignments));
    
    // Update customer order status to 'on-route'
    const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedCustomerOrders = customerOrders.map(order => 
      order._id === assignment._id 
        ? { ...order, status: 'on-route', acceptedByDriver: new Date().toISOString(), vehicle: selectedVehicle }
        : order
    );
    localStorage.setItem('customerOrders', JSON.stringify(updatedCustomerOrders));

    // Mark vehicle as in-use in admin vehicles
    const adminVehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
    const updatedAdminVehicles = adminVehicles.map(v =>
      (v.id === selectedVehicle.id || v._id === selectedVehicle.id)
        ? { ...v, status: 'in-use', assignedTo: user?.email || user?.name, assignedDelivery: assignment._id }
        : v
    );
    localStorage.setItem('adminVehicles', JSON.stringify(updatedAdminVehicles));

    // Add to deliveries with 'assigned' status and vehicle info
    const newDelivery = {
      _id: assignment._id,
      status: 'assigned',
      customer: assignment.customer,
      pickupLocation: assignment.pickupLocation,
      dropLocation: assignment.dropLocation,
      packageDetails: assignment.packageDetails,
      payment: assignment.payment,
      distance: assignment.distance,
      estimatedTime: assignment.estimatedTime,
      vehicle: selectedVehicle,
      acceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Add to deliveries list
    const updatedDeliveries = [newDelivery, ...deliveries];
    setDeliveries(updatedDeliveries);
    localStorage.setItem(getUserKey('driverDeliveries'), JSON.stringify(updatedDeliveries));

    // Update stats
    const newStats = {
      totalDeliveries: updatedDeliveries.length,
      completedDeliveries: updatedDeliveries.filter(d => d.status === 'delivered').length,
      activeDeliveries: updatedDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length,
      pendingDeliveries: updatedDeliveries.filter(d => d.status === 'assigned').length,
    };
    setStats(newStats);
    localStorage.setItem(getUserKey('driverStats'), JSON.stringify(newStats));

    // Close dialog
    setVehicleSelectionDialogOpen(false);
    setSelectedAssignment(null);
    setSelectedVehicle(null);

    alert(`✅ Delivery accepted with vehicle ${selectedVehicle.vehicleNumber}! You will earn ₹${assignment.payment} for this delivery.`);
    
    if (updatedAssignments.length === 0) {
      setShowNotification(false);
    }

    // Reload available vehicles
    loadAvailableVehicles();
  };

  const handleRejectAssignment = (assignment) => {
    if (window.confirm('Are you sure you want to reject this delivery assignment?')) {
      // Remove from pending assignments
      const updatedAssignments = pendingAssignments.filter(a => a._id !== assignment._id);
      setPendingAssignments(updatedAssignments);
      localStorage.setItem('pendingAssignments', JSON.stringify(updatedAssignments));

      alert('❌ Delivery assignment rejected.');
      
      if (updatedAssignments.length === 0) {
        setShowNotification(false);
      }
    }
  };

  const handleEditProfile = () => {
    setEditedProfile({...driverDetails});
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    setDriverDetails(editedProfile);
    localStorage.setItem(getUserKey('driverProfileDetails'), JSON.stringify(editedProfile));
    setEditingProfile(false);
    alert('✅ Profile updated successfully!');
  };

  const handleCancelEditProfile = () => {
    setEditedProfile({...driverDetails});
    setEditingProfile(false);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleViewProfile = () => {
    setEditedProfile({...driverDetails});
    setProfileDialogOpen(true);
    setEditingInDialog(false);
    handleProfileMenuClose();
  };

  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
    setEditingInDialog(false);
    setEditedProfile({...driverDetails});
  };

  const handleEditInDialog = () => {
    setEditingInDialog(true);
  };

  const handleSaveInDialog = () => {
    setDriverDetails(editedProfile);
    localStorage.setItem(getUserKey('driverProfileDetails'), JSON.stringify(editedProfile));
    setEditingInDialog(false);
    alert('✅ Profile updated successfully!');
  };

  const handleCancelEditInDialog = () => {
    setEditedProfile({...driverDetails});
    setEditingInDialog(false);
  };

  const handleViewPendingDeliveries = () => {
    setPendingDialogOpen(true);
  };

  const handleClosePendingDialog = () => {
    setPendingDialogOpen(false);
    setSelectedDelivery(null);
  };

  const handleMarkAsDelivered = (delivery) => {
    // Update delivery status to delivered
    const deliveredAt = new Date().toISOString();
    const updatedDeliveries = deliveries.map(d => 
      d._id === delivery._id ? { ...d, status: 'delivered', deliveredAt } : d
    );
    setDeliveries(updatedDeliveries);
    localStorage.setItem(getUserKey('driverDeliveries'), JSON.stringify(updatedDeliveries));

    // Update customer order status to 'delivered'
    const customerOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    const updatedCustomerOrders = customerOrders.map(order =>
      order._id === delivery._id
        ? { 
            ...order, 
            status: 'delivered', 
            deliveredAt,
            deliveredBy: user?.name || 'Driver',
            completedAt: deliveredAt
          }
        : order
    );
    localStorage.setItem('customerOrders', JSON.stringify(updatedCustomerOrders));
    console.log('✅ Customer order updated to delivered:', delivery._id);

    // Update stats
    const newStats = {
      totalDeliveries: updatedDeliveries.length,
      completedDeliveries: updatedDeliveries.filter(d => d.status === 'delivered').length,
      activeDeliveries: updatedDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length,
      pendingDeliveries: updatedDeliveries.filter(d => d.status === 'assigned').length,
    };
    setStats(newStats);
    localStorage.setItem(getUserKey('driverStats'), JSON.stringify(newStats));

    // Fixed payment per delivery: ₹57
    const FIXED_PAYMENT_PER_ORDER = 57;

    // Update wallet balance
    const newBalance = walletBalance + FIXED_PAYMENT_PER_ORDER;
    setWalletBalance(newBalance);
    localStorage.setItem(getUserKey('driverWalletBalance'), newBalance.toString());

    // Update total earnings
    const newTotalEarnings = totalEarnings + FIXED_PAYMENT_PER_ORDER;
    setTotalEarnings(newTotalEarnings);
    localStorage.setItem(getUserKey('driverTotalEarnings'), newTotalEarnings.toString());

    // Add to transaction history
    const newTransaction = {
      id: `TXN${String(transactionHistory.length + 1).padStart(3, '0')}`,
      type: 'credit',
      amount: FIXED_PAYMENT_PER_ORDER,
      description: `Delivery completed - ${delivery.customer.name}`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    const updatedHistory = [newTransaction, ...transactionHistory];
    setTransactionHistory(updatedHistory);
    localStorage.setItem(getUserKey('driverTransactionHistory'), JSON.stringify(updatedHistory));

    // Mark vehicle as available again
    if (delivery.vehicle) {
      const adminVehicles = JSON.parse(localStorage.getItem('adminVehicles') || '[]');
      const updatedAdminVehicles = adminVehicles.map(v =>
        (v.id === delivery.vehicle.id || v._id === delivery.vehicle.id)
          ? { ...v, status: 'available', assignedTo: null, assignedDelivery: null }
          : v
      );
      localStorage.setItem('adminVehicles', JSON.stringify(updatedAdminVehicles));
      console.log(`✅ Vehicle ${delivery.vehicle.vehicleNumber} marked as available`);
    }

    // Reload pending assignments to remove completed delivery
    loadPendingAssignments();
    
    alert(`✅ Delivery marked as completed! ₹57 added to your wallet.`);
    handleClosePendingDialog();
  };

  const handleCancelDelivery = (delivery) => {
    if (window.confirm('Are you sure you want to cancel this delivery?')) {
      // Update delivery status to cancelled
      const updatedDeliveries = deliveries.map(d => 
        d._id === delivery._id ? { ...d, status: 'cancelled', cancelledAt: new Date().toISOString() } : d
      );
      setDeliveries(updatedDeliveries);
      localStorage.setItem(getUserKey('driverDeliveries'), JSON.stringify(updatedDeliveries));

      // Update stats
      const newStats = {
        totalDeliveries: updatedDeliveries.length,
        completedDeliveries: updatedDeliveries.filter(d => d.status === 'delivered').length,
        activeDeliveries: updatedDeliveries.filter(d => d.status === 'on-route' || d.status === 'picked-up').length,
        pendingDeliveries: updatedDeliveries.filter(d => d.status === 'assigned').length,
      };
      setStats(newStats);
      localStorage.setItem(getUserKey('driverStats'), JSON.stringify(newStats));

      alert('❌ Delivery cancelled.');
      handleClosePendingDialog();
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', animation: 'pulse 2s ease-in-out infinite' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  const statCards = [
    { title: 'Total Deliveries', value: stats.totalDeliveries, icon: LocalShipping, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)', filter: 'all' },
    { title: 'Completed', value: stats.completedDeliveries, icon: CheckCircle, color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.1)', filter: 'completed' },
    { title: 'Active', value: stats.activeDeliveries, icon: DirectionsCar, color: '#f093fb', bgColor: 'rgba(240, 147, 251, 0.1)', filter: 'active' },
    { title: 'Pending', value: stats.pendingDeliveries, icon: PendingActions, color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.1)', filter: 'pending' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ p: 0 }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.5)',
                    },
                  }}
                >
                  {user.name?.charAt(0)}
                </Avatar>
              </IconButton>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Driver Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Welcome back, {user.name}!
                </Typography>
              </Box>
            </Box>

            {/* Profile Menu */}
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <MenuItem onClick={handleViewProfile}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                  <Typography>View Profile</Typography>
                </Box>
              </MenuItem>
            </Menu>
            <IconButton
              onClick={logout}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Logout />
            </IconButton>
          </Paper>
        </Fade>

        {/* Pending Assignment Notifications */}
        {pendingAssignments.length > 0 && showNotification && (
          <Fade in={true} timeout={600}>
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              }}
            >
              {/* Background Pattern */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              />
              
              <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    >
                      <LocalShipping sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                        🔔 New Delivery Assignment{pendingAssignments.length > 1 ? 's' : ''}!
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {pendingAssignments.length} pending assignment{pendingAssignments.length > 1 ? 's' : ''} waiting for your response
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setShowNotification(false)}
                    sx={{
                      color: 'white',
                      background: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <Logout sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                </Box>

                {pendingAssignments.map((assignment, index) => (
                  <Paper
                    key={assignment._id}
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: index < pendingAssignments.length - 1 ? 2 : 0,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    <Grid container spacing={3}>
                      {/* Left Side - Delivery Details */}
                      <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <LocalShipping sx={{ color: 'white', fontSize: 24 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                              {assignment.customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Order ID: {assignment._id.slice(-8).toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(76, 175, 80, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.5,
                              }}
                            >
                              <MyLocation sx={{ fontSize: 14, color: '#4caf50' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Pickup Location
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {assignment.pickupLocation.address}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(244, 67, 54, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.5,
                              }}
                            >
                              <LocationOn sx={{ fontSize: 14, color: '#f44336' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Drop Location
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {assignment.dropLocation.address}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: 'rgba(102, 126, 234, 0.05)',
                            border: '1px dashed rgba(102, 126, 234, 0.3)',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Package Details
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            📦 {assignment.packageDetails}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Right Side - Payment & Actions */}
                      <Grid item xs={12} md={5}>
                        <Box
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          {/* Payment Card */}
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                              color: 'white',
                              textAlign: 'center',
                            }}
                          >
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              You will earn
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5 }}>
                              ₹{assignment.payment}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Navigation sx={{ fontSize: 16 }} />
                                <Typography variant="caption">{assignment.distance} km</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Timer sx={{ fontSize: 16 }} />
                                <Typography variant="caption">~{assignment.estimatedTime} min</Typography>
                              </Box>
                            </Box>
                          </Paper>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="large"
                              onClick={() => handleAcceptAssignment(assignment)}
                              startIcon={<CheckCircle />}
                              sx={{
                                py: 1.5,
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.5)',
                                },
                              }}
                            >
                              Accept Delivery
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="large"
                              onClick={() => handleRejectAssignment(assignment)}
                              sx={{
                                py: 1.5,
                                borderColor: '#f44336',
                                color: '#f44336',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                borderWidth: 2,
                                '&:hover': {
                                  borderWidth: 2,
                                  borderColor: '#d32f2f',
                                  background: 'rgba(244, 67, 54, 0.05)',
                                },
                              }}
                            >
                              Decline
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Location Tracking & Quick Actions */}
        <Fade in={true} timeout={700}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: trackingActive
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: trackingActive ? '2px solid #4caf50' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: trackingActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(102, 126, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: trackingActive ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              >
                {trackingActive ? (
                  <MyLocation sx={{ color: '#4caf50', fontSize: 28 }} />
                ) : (
                  <LocationOff sx={{ color: '#667eea', fontSize: 28 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {trackingActive ? '📍 Live Tracking Active' : '📍 Location Tracking & Navigation'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentLocation
                    ? `Current: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                    : 'Location not available'}
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant={trackingActive ? 'outlined' : 'contained'}
                  onClick={trackingActive ? stopTracking : startTracking}
                  startIcon={trackingActive ? <LocationOff /> : <MyLocation />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: trackingActive
                      ? 'transparent'
                      : 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    borderColor: trackingActive ? '#4caf50' : 'transparent',
                    color: trackingActive ? '#4caf50' : 'white',
                    boxShadow: trackingActive ? 'none' : '0 4px 12px rgba(76, 175, 80, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: trackingActive ? 'none' : '0 6px 16px rgba(76, 175, 80, 0.6)',
                    },
                  }}
                >
                  {trackingActive ? 'Stop Tracking' : 'Start Tracking'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/driver/map/live"
                  startIcon={<MapIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.6)',
                    },
                  }}
                >
                  Live Map
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/driver/deliveries"
                  startIcon={<Assignment />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(240, 147, 251, 0.6)',
                    },
                  }}
                >
                  All Deliveries
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Grow in={true} timeout={800 + index * 100}>
                <Card
                  onClick={() => handleStatCardClick(stat.filter)}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: filterStatus === stat.filter ? `3px solid ${stat.color}` : 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 24px ${stat.color}40`,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          background: stat.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {React.createElement(stat.icon, { sx: { fontSize: 28, color: stat.color } })}
                      </Box>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Wallet Section */}
        <Fade in={true} timeout={900}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Main Wallet Card */}
            <Grid item xs={12} md={7}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                }}
              >
                {/* Background Decorations */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                />

                {/* Content */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AccountBalanceWallet sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                        Available Balance
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                        From {stats.completedDeliveries} completed deliveries
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em', fontSize: '3rem' }}>
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setWithdrawDialogOpen(true)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        color: '#4caf50',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        '&:hover': {
                          background: 'white',
                        },
                      }}
                    >
                      Withdraw
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setTransactionDialogOpen(true)}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          borderColor: 'white',
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Transaction History
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Earnings Stats Cards */}
            <Grid item xs={12} md={5}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                {/* Total Earnings Card */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          background: 'rgba(76, 175, 80, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        Total Earnings
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', ml: 6.5, fontSize: '2rem' }}>
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 6.5, fontSize: '0.7rem' }}>
                      All time earnings
                    </Typography>
                  </Paper>
                </Grid>

                {/* Pending Earnings Card */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          background: 'rgba(255, 152, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PendingActions sx={{ color: '#ff9800', fontSize: 18 }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        Pending
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', ml: 6.5, fontSize: '2rem' }}>
                      ₹{(deliveries.filter(d => d.status !== 'delivered').reduce((sum, d) => sum + d.payment, 0)).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 6.5, fontSize: '0.7rem' }}>
                      {stats.activeDeliveries + stats.pendingDeliveries} deliveries in progress
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Fade>

        {/* Available Vehicles */}
        {availableVehicles.length > 0 && (
          <Fade in={true} timeout={1000}>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    🚗 Available Vehicles
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {availableVehicles.length} vehicle{availableVehicles.length !== 1 ? 's' : ''} ready for delivery
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadAvailableVehicles}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      borderColor: '#45a049',
                      background: 'rgba(76, 175, 80, 0.05)',
                    },
                  }}
                >
                  🔄 Refresh
                </Button>
              </Box>
              <Grid container spacing={2}>
                {availableVehicles.map((vehicle) => (
                  <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: '2px solid rgba(76, 175, 80, 0.3)',
                        background: 'rgba(76, 175, 80, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(76, 175, 80, 0.2)',
                          borderColor: '#4caf50',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <DirectionsCar sx={{ color: 'white', fontSize: 24 }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              {vehicle.vehicleNumber}
                            </Typography>
                            <Chip
                              label={vehicle.type.toUpperCase()}
                              size="small"
                              sx={{
                                background: 'rgba(102, 126, 234, 0.1)',
                                color: '#667eea',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Capacity:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {vehicle.capacity} kg
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Status:
                            </Typography>
                            <Chip
                              label="Available"
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          {vehicle.currentLocation?.address && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Location:
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                📍 {vehicle.currentLocation.address.split(',').slice(0, 2).join(',')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        )}

        {/* Recent Deliveries */}
        <Fade in={true} timeout={1200}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Your Deliveries {filterStatus !== 'all' && `(${filterStatus === 'completed' ? 'Completed' : filterStatus === 'active' ? 'Active' : 'Pending'})`}
              </Typography>
              {filterStatus !== 'all' && (
                <Chip
                  label="Clear Filter"
                  onClick={() => setFilterStatus('all')}
                  onDelete={() => setFilterStatus('all')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Route</strong></TableCell>
                <TableCell><strong>Payment</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredDeliveries().map((delivery) => (
                <TableRow 
                  key={delivery._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                      #{delivery._id.slice(-3)}
                    </Typography>
                  </TableCell>
                  <TableCell>{delivery.customer?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>From:</strong> {delivery.pickupLocation?.address?.split(',')[0]}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <strong>To:</strong> {delivery.dropLocation?.address?.split(',')[0]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: delivery.status === 'delivered' ? '#4caf50' : '#667eea' }}>
                        ₹57
                      </Typography>
                      {delivery.status === 'delivered' && (
                        <Chip label="Paid" size="small" color="success" sx={{ height: 20 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(delivery.status)}
                      size="small"
                      color={
                        delivery.status === 'delivered' ? 'success' :
                        delivery.status === 'on-route' || delivery.status === 'picked-up' ? 'info' :
                        'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {delivery.status === 'assigned' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setPendingDialogOpen(true);
                        }}
                        sx={{
                          textTransform: 'none',
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': {
                            borderColor: '#764ba2',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)',
                          },
                        }}
                      >
                        Update Status
                      </Button>
                    ) : (
                      <Chip
                        label={delivery.status === 'delivered' ? 'Completed' : delivery.status === 'cancelled' ? 'Cancelled' : 'In Progress'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </TableContainer>
            {getFilteredDeliveries().length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  {filterStatus === 'all' ? 'No deliveries assigned' :
                   filterStatus === 'completed' ? 'No completed deliveries' :
                   filterStatus === 'active' ? 'No active deliveries' :
                   'No pending deliveries'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filterStatus === 'all' ? 'Deliveries will appear here once assigned' : 'Try selecting a different filter'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>

        {/* Withdraw Dialog */}
        <Dialog 
          open={withdrawDialogOpen} 
          onClose={() => {
            setWithdrawDialogOpen(false);
            setEditMode(false);
            setWithdrawAmount('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>💰 Withdraw Funds</span>
            {!editMode && (
              <IconButton 
                size="small" 
                onClick={handleEditBankDetails}
                sx={{ color: 'white' }}
              >
                <Edit />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#4caf50', mb: 3 }}>
              Available Balance: ₹{walletBalance.toLocaleString('en-IN')}
            </Typography>

            {/* Withdrawal Amount Input */}
            {!editMode && (
              <>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Withdrawal Amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                    }}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Maximum: ₹{walletBalance.toLocaleString('en-IN')}
                  </Typography>
                </Box>

                {/* Withdrawal Method Selection */}
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 600, color: '#667eea', mb: 1 }}>
                    Withdrawal Method
                  </FormLabel>
                  <RadioGroup
                    value={withdrawalMethod}
                    onChange={(e) => setWithdrawalMethod(e.target.value)}
                    row
                  >
                    <FormControlLabel 
                      value="bank" 
                      control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalance sx={{ fontSize: 20 }} />
                          <Typography>Bank Account</Typography>
                        </Box>
                      }
                      sx={{
                        border: withdrawalMethod === 'bank' ? '2px solid #667eea' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        mr: 2,
                        background: withdrawalMethod === 'bank' ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                      }}
                    />
                    <FormControlLabel 
                      value="upi" 
                      control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <QrCode2 sx={{ fontSize: 20 }} />
                          <Typography>UPI ID</Typography>
                        </Box>
                      }
                      sx={{
                        border: withdrawalMethod === 'upi' ? '2px solid #667eea' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        background: withdrawalMethod === 'upi' ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                      }}
                    />
                  </RadioGroup>
                </FormControl>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Bank Account Details */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Bank Account Details
                  </Typography>
                </Box>
              </Box>
              
              <Paper sx={{ p: 2, background: 'rgba(102, 126, 234, 0.05)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Account Name"
                        value={editedBankDetails.accountName}
                        onChange={(e) => setEditedBankDetails({...editedBankDetails, accountName: e.target.value})}
                      />
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Account Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{bankDetails.accountName}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Account Number"
                        value={editedBankDetails.accountNumber}
                        onChange={(e) => setEditedBankDetails({...editedBankDetails, accountNumber: e.target.value})}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Account Number</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{bankDetails.accountNumber}</Typography>
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopy(bankDetails.accountNumber, 'account')}
                          sx={{ color: copiedText === 'account' ? '#4caf50' : '#667eea' }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={editedBankDetails.ifscCode}
                        onChange={(e) => setEditedBankDetails({...editedBankDetails, ifscCode: e.target.value})}
                      />
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary">IFSC Code</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{bankDetails.ifscCode}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc')}
                            sx={{ color: copiedText === 'ifsc' ? '#4caf50' : '#667eea' }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={editedBankDetails.bankName}
                        onChange={(e) => setEditedBankDetails({...editedBankDetails, bankName: e.target.value})}
                      />
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{bankDetails.bankName}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    {editMode ? (
                      <TextField
                        fullWidth
                        label="Branch"
                        value={editedBankDetails.branch}
                        onChange={(e) => setEditedBankDetails({...editedBankDetails, branch: e.target.value})}
                      />
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Branch</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{bankDetails.branch}</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* UPI Details */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QrCode2 sx={{ color: '#4caf50' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  UPI Details
                </Typography>
              </Box>
              
              <Paper sx={{ p: 2, background: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="UPI ID"
                    value={editedBankDetails.upiId}
                    onChange={(e) => setEditedBankDetails({...editedBankDetails, upiId: e.target.value})}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">UPI ID</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {bankDetails.upiId}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopy(bankDetails.upiId, 'upi')}
                      sx={{ color: copiedText === 'upi' ? '#4caf50' : '#667eea' }}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Box>

            {copiedText && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Copied to clipboard!
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            {editMode ? (
              <>
                <Button 
                  onClick={handleCancelEdit}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBankDetails}
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                  }}
                >
                  Save Details
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => {
                    setWithdrawDialogOpen(false);
                    setWithdrawAmount('');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Close
                </Button>
                <Button
                  onClick={handleWithdraw}
                  variant="contained"
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  sx={{
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                    },
                  }}
                >
                  Withdraw ₹{withdrawAmount || '0'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Transaction History Dialog */}
        <Dialog 
          open={transactionDialogOpen} 
          onClose={() => setTransactionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History />
              Transaction History
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Transaction ID</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionHistory.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(transaction.date).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                          {transaction.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{transaction.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownward sx={{ color: '#4caf50', fontSize: 18 }} />
                          ) : (
                            <ArrowUpward sx={{ color: '#f44336', fontSize: 18 }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: transaction.type === 'credit' ? '#4caf50' : '#f44336' 
                            }}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.status} 
                          size="small" 
                          color="success"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setTransactionDialogOpen(false)}
              variant="contained"
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pending Deliveries Dialog */}
        <Dialog
          open={pendingDialogOpen}
          onClose={handleClosePendingDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PendingActions sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Pending Deliveries
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {deliveries.filter(d => d.status === 'assigned').length} deliveries waiting
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {deliveries.filter(d => d.status === 'assigned').length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PendingActions sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No pending deliveries
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All deliveries are up to date!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {(selectedDelivery ? [selectedDelivery] : deliveries.filter(d => d.status === 'assigned')).map((delivery) => (
                  <Grid item xs={12} key={delivery._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '2px solid rgba(255, 152, 0, 0.3)',
                        background: 'rgba(255, 152, 0, 0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
                        },
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#f57c00' }}>
                            {delivery.customer.name}
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Pickup Location
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              📍 {delivery.pickupLocation.address}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Drop Location
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              🎯 {delivery.dropLocation.address}
                            </Typography>
                          </Box>
                          {delivery.packageDetails && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Package
                              </Typography>
                              <Typography variant="body2">
                                📦 {delivery.packageDetails}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', justifyContent: 'center' }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                color: 'white',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Earnings
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                ₹57
                              </Typography>
                            </Paper>
                            <Button
                              fullWidth
                              variant="contained"
                              size="large"
                              onClick={() => handleMarkAsDelivered(delivery)}
                              startIcon={<CheckCircle />}
                              sx={{
                                py: 1.5,
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                                },
                              }}
                            >
                              Mark as Delivered
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="large"
                              onClick={() => handleCancelDelivery(delivery)}
                              sx={{
                                py: 1.5,
                                borderColor: '#f44336',
                                color: '#f44336',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                borderWidth: 2,
                                '&:hover': {
                                  borderWidth: 2,
                                  borderColor: '#d32f2f',
                                  background: 'rgba(244, 67, 54, 0.05)',
                                },
                              }}
                            >
                              Cancel Delivery
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleClosePendingDialog}
              variant="contained"
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Profile View Dialog */}
        <Dialog
          open={profileDialogOpen}
          onClose={handleCloseProfileDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {driverDetails.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Driver Profile
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View and edit your profile information
                  </Typography>
                </Box>
              </Box>
              {!editingInDialog && (
                <IconButton onClick={handleEditInDialog} sx={{ color: '#667eea' }}>
                  <Edit />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Full Name
                  </Typography>
                  {editingInDialog ? (
                    <TextField
                      fullWidth
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {driverDetails.name}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Phone Number
                  </Typography>
                  {editingInDialog ? (
                    <TextField
                      fullWidth
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {driverDetails.phone}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Vehicle Type
                  </Typography>
                  {editingInDialog ? (
                    <TextField
                      fullWidth
                      value={editedProfile.vehicleType}
                      onChange={(e) => setEditedProfile({...editedProfile, vehicleType: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {driverDetails.vehicleType}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(102, 126, 234, 0.05)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Vehicle Number
                  </Typography>
                  {editingInDialog ? (
                    <TextField
                      fullWidth
                      value={editedProfile.vehicleNumber}
                      onChange={(e) => setEditedProfile({...editedProfile, vehicleNumber: e.target.value})}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {driverDetails.vehicleNumber}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Rating
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ⭐ {driverDetails.rating}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {driverDetails.totalDeliveries}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            {editingInDialog ? (
              <>
                <Button
                  onClick={handleCancelEditInDialog}
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveInDialog}
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                    },
                  }}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCloseProfileDialog}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Close
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Vehicle Selection Dialog */}
        <Dialog open={vehicleSelectionDialogOpen} onClose={() => setVehicleSelectionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Select Vehicle for Delivery</Typography>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {selectedAssignment && (
              <Paper sx={{ p: 2, mb: 3, background: 'rgba(102, 126, 234, 0.05)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <Typography variant="caption" color="text.secondary">Delivery Details</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedAssignment.packageDetails}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Payment: ₹{selectedAssignment.payment}
                </Typography>
              </Paper>
            )}

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              🚗 Available Vehicles ({availableVehicles.length})
            </Typography>

            {availableVehicles.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(255, 152, 0, 0.05)', border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                <Typography variant="body1" color="text.secondary">
                  ⚠️ No vehicles available at the moment. Please contact admin.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {availableVehicles.map((vehicle) => (
                  <Paper
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedVehicle?.id === vehicle.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                      background: selectedVehicle?.id === vehicle.id ? 'rgba(102, 126, 234, 0.05)' : 'white',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#667eea',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <DirectionsCar sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {vehicle.vehicleNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={vehicle.type.toUpperCase()} size="small" color="primary" />
                          <Chip label={`${vehicle.capacity} kg`} size="small" variant="outlined" />
                          <Chip label="Available" size="small" color="success" />
                        </Box>
                      </Box>
                      {selectedVehicle?.id === vehicle.id && (
                        <CheckCircle sx={{ color: '#667eea', fontSize: 32 }} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => {
                setVehicleSelectionDialogOpen(false);
                setSelectedAssignment(null);
                setSelectedVehicle(null);
              }}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAcceptWithVehicle}
              disabled={!selectedVehicle}
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049 0%, #4caf50 100%)',
                },
                '&:disabled': {
                  background: '#ccc',
                },
              }}
            >
              Confirm & Accept Delivery
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default DriverDashboard;
