import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import './Pages.css';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: '📍',
      title: 'Real-Time GPS Tracking',
      description: 'Monitor your entire fleet with precision GPS tracking and live location updates. Get instant visibility into vehicle positions, routes, and ETAs.',
      features: ['Live location tracking', 'Route history', 'Geofencing alerts', 'Speed monitoring']
    },
    {
      icon: '🗺️',
      title: 'Route Optimization',
      description: 'AI-powered algorithms analyze traffic, weather, and delivery priorities to find the most efficient routes and reduce fuel costs by up to 30%.',
      features: ['Smart route planning', 'Multi-stop optimization', 'Traffic avoidance', 'Fuel cost reduction']
    },
    {
      icon: '📊',
      title: 'Fleet Analytics',
      description: 'Comprehensive dashboards and reports provide actionable insights for data-driven decision making and continuous improvement.',
      features: ['Performance metrics', 'Custom reports', 'Predictive analytics', 'Cost analysis']
    },
    {
      icon: '👥',
      title: 'Driver Management',
      description: 'Efficiently assign, monitor, and communicate with drivers in real-time. Track performance, manage schedules, and ensure compliance.',
      features: ['Driver assignment', 'Performance tracking', 'In-app messaging', 'Schedule management']
    },
    {
      icon: '📦',
      title: 'Delivery Management',
      description: 'End-to-end delivery tracking with automated notifications, proof of delivery, and customer communication throughout the journey.',
      features: ['Order tracking', 'Auto notifications', 'Digital signatures', 'Customer updates']
    },
    {
      icon: '🔔',
      title: 'Smart Alerts & Notifications',
      description: 'Stay informed with intelligent alerts for delays, route deviations, maintenance needs, and critical events.',
      features: ['Real-time alerts', 'Custom triggers', 'Multi-channel notifications', 'Escalation rules']
    },
    {
      icon: '🔒',
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with role-based access control, data encryption, and compliance with industry standards.',
      features: ['Data encryption', 'Access control', 'Audit logs', 'Compliance reporting']
    },
    {
      icon: '🎧',
      title: '24/7 Support',
      description: 'Round-the-clock customer support to ensure smooth operations. Our expert team is always ready to help you succeed.',
      features: ['24/7 availability', 'Phone & chat support', 'Dedicated account manager', 'Training resources']
    }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">Our Services</h1>
          <p className="page-description">
            Comprehensive fleet management solutions tailored to your business needs
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card-detailed">
              <div className="service-icon-large">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-features">
                <h4>Key Features:</h4>
                <ul>
                  {service.features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="cta-box">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of businesses optimizing their logistics with TrackMate</p>
          <button className="cta-button" onClick={() => navigate('/register')}>
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
