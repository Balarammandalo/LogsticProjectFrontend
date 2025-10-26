import React, { useState } from 'react';
import Navbar from '../common/Navbar';
import './Pages.css';

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const docSections = [
    {
      title: 'Getting Started',
      icon: '🚀',
      topics: [
        'Quick Start Guide',
        'Installation & Setup',
        'First Vehicle Setup',
        'Dashboard Overview'
      ]
    },
    {
      title: 'User Guides',
      icon: '📖',
      topics: [
        'Managing Vehicles',
        'Driver Assignment',
        'Route Planning',
        'Delivery Tracking',
        'Reports & Analytics'
      ]
    },
    {
      title: 'Admin Features',
      icon: '⚙️',
      topics: [
        'User Management',
        'Role Permissions',
        'System Settings',
        'Billing & Subscriptions'
      ]
    },
    {
      title: 'Integration Guides',
      icon: '🔌',
      topics: [
        'API Integration',
        'Webhook Setup',
        'Third-party Tools',
        'Data Export/Import'
      ]
    },
    {
      title: 'Mobile App',
      icon: '📱',
      topics: [
        'iOS App Guide',
        'Android App Guide',
        'Driver App Features',
        'Offline Mode'
      ]
    },
    {
      title: 'Troubleshooting',
      icon: '🔧',
      topics: [
        'Common Issues',
        'Error Messages',
        'Performance Tips',
        'FAQ'
      ]
    }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">Documentation</h1>
          <p className="page-description">
            Comprehensive guides and documentation for TrackMate platform
          </p>
        </div>

        <div className="doc-search-container">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search documentation..." 
              className="search-input-enhanced"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="search-hint">Try searching for "tracking", "routes", or "API"</p>
        </div>

        <div className="doc-grid-enhanced">
          {docSections.map((section, index) => (
            <div key={index} className="doc-section-card-enhanced">
              <div className="doc-header">
                <div className="doc-icon-large">{section.icon}</div>
                <h3>{section.title}</h3>
              </div>
              <ul className="doc-topics-enhanced">
                {section.topics.map((topic, idx) => (
                  <li key={idx}>
                    <a href="#" className="doc-link-enhanced">
                      <span className="link-arrow">→</span>
                      <span>{topic}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="doc-card-footer">
                <span className="topic-count">{section.topics.length} articles</span>
              </div>
            </div>
          ))}
        </div>

        <div className="doc-resources-enhanced">
          <h2 className="section-heading">Additional Resources</h2>
          <div className="resources-grid-enhanced">
            <div className="resource-card-enhanced">
              <h3>📹 Video Tutorials</h3>
              <p>Watch step-by-step video guides for all major features</p>
              <a href="#" className="resource-link">Watch Videos →</a>
            </div>
            <div className="resource-card-enhanced">
              <h3>💬 Community Forum</h3>
              <p>Connect with other TrackMate users and share tips</p>
              <a href="#" className="resource-link">Join Forum →</a>
            </div>
            <div className="resource-card-enhanced">
              <h3>📧 Email Support</h3>
              <p>Get help from our support team via email</p>
              <a href="#" className="resource-link">Contact Support →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
