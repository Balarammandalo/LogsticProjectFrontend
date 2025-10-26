import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import Navbar from '../common/Navbar';
import './HomeDashboard.css';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isCustomer, isDriver } = useAuth();

  const features = [
    {
      icon: '📍',
      title: 'Real-Time Tracking',
      description: 'Monitor your fleet vehicles in real-time with GPS precision and live updates.'
    },
    {
      icon: '🗺️',
      title: 'Smart Routing',
      description: 'AI-powered route optimization to reduce fuel costs and delivery time.'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights and reports to make data-driven decisions.'
    },
    {
      icon: '🔔',
      title: 'Instant Alerts',
      description: 'Get notified about deliveries, delays, and important fleet events.'
    },
    {
      icon: '🚚',
      title: 'Fleet Management',
      description: 'Manage vehicles, drivers, and deliveries from a single platform.'
    },
    {
      icon: '🔒',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee.'
    }
  ];

  const stats = [
    { number: '15K+', label: 'Active Vehicles' },
    { number: '800K+', label: 'Deliveries' },
    { number: '98%', label: 'Satisfaction' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="home-dashboard">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="brand-highlight">TrackMate</span>
          </h1>
          <p className="hero-subtitle">
            Your Complete Fleet Management & Logistics Tracking Solution
          </p>
          <p className="hero-description">
            Empower your business with intelligent tracking, predictive routing, 
            and real-time insights. Transform the way you manage deliveries.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                {isCustomer && (
                  <button className="btn-primary" onClick={() => navigate('/user/book-logistics')}>
                    Get Started Free to Book for Logistic
                  </button>
                )}
                {isDriver && (
                  <button className="btn-primary" onClick={() => navigate('/driver/dashboard')}>
                    Get Your Earnings
                  </button>
                )}
                {!isCustomer && !isDriver && (
                  <button className="btn-primary" onClick={() => navigate('/admin')}>
                    Go to Dashboard
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Get Started Free
                </button>
                <button className="btn-secondary" onClick={() => navigate('/login')}>
                  Login
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={() => navigate('/services')}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-image">
          <div className="floating-card card-1">
            <span className="card-icon">🚚</span>
            <span className="card-text">Live Tracking</span>
          </div>
          <div className="floating-card card-2">
            <span className="card-icon">📊</span>
            <span className="card-text">Analytics</span>
          </div>
          <div className="floating-card card-3">
            <span className="card-icon">🗺️</span>
            <span className="card-text">Route Planning</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features for Modern Logistics</h2>
          <p className="section-subtitle">
            Everything you need to manage your fleet efficiently
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Fleet Management?</h2>
          <p className="cta-description">
            Join thousands of businesses already using TrackMate to optimize their logistics
          </p>
          <button className="btn-cta" onClick={() => navigate('/register')}>
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-brand">TrackMate</h3>
            <p className="footer-text">
              Revolutionizing fleet management with cutting-edge technology.
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/careers">Careers</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><a href="/documentation">Documentation</a></li>
              <li><a href="/api-reference">API Reference</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Contact</h4>
            <p className="footer-text">support@trackmate.com</p>
            <p className="footer-text">+1 (555) 123-4567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 TrackMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeDashboard;
