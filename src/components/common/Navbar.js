import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../services/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const exploreRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setIsExploreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsExploreOpen(false);
  }, [navigate]);

  const handleLogoClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    // Navigate based on user role
    const roleRoutes = {
      admin: '/admin',
      driver: '/driver',
      customer: '/user',
    };
    navigate(roleRoutes[user?.role] || '/user');
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleExplore = () => {
    setIsExploreOpen(!isExploreOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Side - Logo */}
        <div className="navbar-logo" onClick={handleLogoClick}>
          <span className="logo-text">TrackMate</span>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}></span>
        </button>

        {/* Center - Navigation Links */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/services" className="nav-link">Services</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          
          {/* Explore Dropdown */}
          <div className="nav-dropdown" ref={exploreRef}>
            <button 
              className="nav-link dropdown-toggle" 
              onClick={toggleExplore}
              aria-expanded={isExploreOpen}
            >
              Explore
              <span className={`arrow ${isExploreOpen ? 'up' : 'down'}`}>▼</span>
            </button>
            
            {isExploreOpen && (
              <div className="dropdown-menu">
                <Link to="/careers" className="dropdown-item">Careers</Link>
                <Link to="/documentation" className="dropdown-item">Documentation</Link>
                <Link to="/api-reference" className="dropdown-item">API Reference</Link>
                <Link to="/blog" className="dropdown-item">Blog</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Theme Toggle & Auth Buttons */}
        <div className="navbar-actions">
          {/* Theme Toggle Switch */}
          <div className="theme-toggle-wrapper">
            <label className="theme-toggle" htmlFor="theme-switch">
              <input
                type="checkbox"
                id="theme-switch"
                checked={isDark}
                onChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
              <span className="slider">
                <span className="slider-icon sun">☀️</span>
                <span className="slider-icon moon">🌙</span>
              </span>
            </label>
          </div>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            {user ? (
              // Show Profile and Logout when logged in
              <>
                <button onClick={handleProfileClick} className="btn btn-profile">
                  Profile
                </button>
                <button onClick={handleLogout} className="btn btn-logout">
                  Logout
                </button>
              </>
            ) : (
              // Show Login and Signup when not logged in
              <>
                <Link to="/login" className="btn btn-login">Login</Link>
                <Link to="/register" className="btn btn-signup">Signup</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
