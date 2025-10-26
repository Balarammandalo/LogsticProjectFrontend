import React, { useState } from 'react';
import Navbar from '../common/Navbar';
import './Pages.css';

const ApiReference = () => {
  const [activeTab, setActiveTab] = useState('rest');

  const restEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/v1/vehicles',
      description: 'Get all vehicles in your fleet',
      params: 'page, limit, status'
    },
    {
      method: 'POST',
      endpoint: '/api/v1/vehicles',
      description: 'Add a new vehicle to your fleet',
      params: 'vehicleNumber, type, capacity'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/vehicles/:id',
      description: 'Get details of a specific vehicle',
      params: 'id (required)'
    },
    {
      method: 'PUT',
      endpoint: '/api/v1/vehicles/:id',
      description: 'Update vehicle information',
      params: 'id (required), fields to update'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/deliveries',
      description: 'Get all deliveries',
      params: 'status, date, driverId'
    },
    {
      method: 'POST',
      endpoint: '/api/v1/deliveries',
      description: 'Create a new delivery',
      params: 'pickup, dropoff, vehicleId'
    },
    {
      method: 'GET',
      endpoint: '/api/v1/routes/:id',
      description: 'Get optimized route for delivery',
      params: 'id (required)'
    },
    {
      method: 'POST',
      endpoint: '/api/v1/routes/optimize',
      description: 'Optimize route for multiple stops',
      params: 'stops[], preferences'
    }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">API Reference</h1>
          <p className="page-description">
            Complete API documentation for developers
          </p>
        </div>

        <div className="api-intro-enhanced">
          <h2>Getting Started with TrackMate API</h2>
          <p>
            The TrackMate API allows you to integrate our fleet management features 
            into your applications. All API requests require authentication using API keys.
          </p>
        </div>

        <div className="api-tabs-enhanced">
          <button 
            className={`api-tab-enhanced ${activeTab === 'rest' ? 'active' : ''}`}
            onClick={() => setActiveTab('rest')}
          >
            <span className="tab-icon">🔌</span>
            <span>REST API</span>
          </button>
          <button 
            className={`api-tab-enhanced ${activeTab === 'websocket' ? 'active' : ''}`}
            onClick={() => setActiveTab('websocket')}
          >
            <span className="tab-icon">⚡</span>
            <span>WebSocket API</span>
          </button>
          <button 
            className={`api-tab-enhanced ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            <span className="tab-icon">🔐</span>
            <span>Authentication</span>
          </button>
        </div>

        {activeTab === 'rest' && (
          <div className="api-content-enhanced">
            <h3>REST API Endpoints</h3>
            <p className="api-note">
              Base URL: <code>https://api.trackmate.com</code>
            </p>
            <div className="endpoints-list-enhanced">
              {restEndpoints.map((endpoint, index) => (
                <div key={index} className="endpoint-card-enhanced">
                  <div className="endpoint-header">
                    <span className={`method method-${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <code className="endpoint-path">{endpoint.endpoint}</code>
                  </div>
                  <p className="endpoint-description">{endpoint.description}</p>
                  <div className="endpoint-params">
                    <strong>Parameters:</strong> {endpoint.params}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'websocket' && (
          <div className="api-content-enhanced">
            <h3>WebSocket API</h3>
            <p>Connect to real-time updates for live tracking and notifications.</p>
            <div className="code-example">
              <pre>
{`// Connect to WebSocket
const ws = new WebSocket('wss://api.trackmate.com/ws');

// Subscribe to vehicle updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'vehicles',
  vehicleId: '12345'
}));

// Listen for updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Vehicle update:', data);
};`}
              </pre>
            </div>
            <div className="websocket-events-enhanced">
              <h4>Available Events:</h4>
              <ul>
                <li><code>vehicle.location</code> - Real-time location updates</li>
                <li><code>delivery.status</code> - Delivery status changes</li>
                <li><code>route.update</code> - Route modifications</li>
                <li><code>alert.created</code> - New alerts and notifications</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="api-content-enhanced">
            <h3>Authentication</h3>
            <p>Secure your API requests with OAuth 2.0 and API keys.</p>
            
            <div className="auth-section">
              <h4>API Key Authentication</h4>
              <p>Include your API key in the request header:</p>
              <div className="code-example">
                <pre>
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                </pre>
              </div>
            </div>

            <div className="auth-section">
              <h4>Getting Your API Key</h4>
              <ol className="auth-steps">
                <li>Log in to your TrackMate dashboard</li>
                <li>Navigate to Settings → API Keys</li>
                <li>Click "Generate New Key"</li>
                <li>Copy and securely store your API key</li>
              </ol>
            </div>

            <div className="auth-section">
              <h4>Rate Limits</h4>
              <ul>
                <li>Free Plan: 1,000 requests/hour</li>
                <li>Pro Plan: 10,000 requests/hour</li>
                <li>Enterprise: Unlimited requests</li>
              </ul>
            </div>
          </div>
        )}

        <div className="api-resources">
          <h2 className="section-heading">Developer Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <h3>📚 SDK Libraries</h3>
              <p>Official SDKs for JavaScript, Python, PHP, and Ruby</p>
              <a href="#" className="resource-link">Download SDKs →</a>
            </div>
            <div className="resource-card">
              <h3>🧪 API Playground</h3>
              <p>Test API endpoints in an interactive environment</p>
              <a href="#" className="resource-link">Try It Out →</a>
            </div>
            <div className="resource-card">
              <h3>📖 Code Examples</h3>
              <p>Sample code and integration examples</p>
              <a href="#" className="resource-link">View Examples →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiReference;
