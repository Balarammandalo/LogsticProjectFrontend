import React from 'react';
import Navbar from '../common/Navbar';
import './Pages.css';

const AboutUs = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">About TrackMate</h1>
          <p className="page-description">
            Leading the revolution in fleet management and logistics tracking
          </p>
        </div>

        <div className="content-grid">
          <div className="content-section">
            <div className="section-icon">🚀</div>
            <h2>Our Mission</h2>
            <p>
              To empower businesses worldwide with intelligent tracking, predictive routing, 
              and real-time insights that transform fleet management operations. We believe 
              in making logistics simple, efficient, and accessible to everyone.
            </p>
          </div>

          <div className="content-section">
            <div className="section-icon">🎯</div>
            <h2>Our Vision</h2>
            <p>
              To become the world's most trusted and innovative logistics technology 
              platform, enabling seamless supply chain operations globally. We envision 
              a future where every delivery is tracked, optimized, and delivered with precision.
            </p>
          </div>

          <div className="content-section">
            <div className="section-icon">💡</div>
            <h2>Our Values</h2>
            <ul className="values-list">
              <li><strong>Innovation:</strong> Constantly pushing boundaries with cutting-edge technology</li>
              <li><strong>Reliability:</strong> 99.9% uptime guarantee for mission-critical operations</li>
              <li><strong>Transparency:</strong> Real-time visibility into every aspect of your fleet</li>
              <li><strong>Customer Success:</strong> Your success is our success</li>
            </ul>
          </div>
        </div>

        <div className="stats-showcase">
          <h2 className="section-heading">Our Impact</h2>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value">15,000+</div>
              <div className="stat-label">Fleet Vehicles Monitored</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">800,000+</div>
              <div className="stat-label">Successful Deliveries</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">98%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">50+</div>
              <div className="stat-label">Countries Served</div>
            </div>
          </div>
        </div>

        <div className="team-section">
          <h2 className="section-heading">Our Story</h2>
          <p className="story-text">
            Founded in 2020, TrackMate was born from a simple observation: logistics companies 
            were struggling with outdated tracking systems and inefficient route planning. Our 
            founders, experienced logistics professionals and tech innovators, came together to 
            create a solution that would revolutionize the industry.
          </p>
          <p className="story-text">
            Today, TrackMate serves thousands of businesses worldwide, from small local delivery 
            services to large international logistics corporations. Our platform has processed 
            millions of deliveries, saved countless hours of planning time, and helped reduce 
            carbon emissions through optimized routing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
