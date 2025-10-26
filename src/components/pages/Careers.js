import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import './Pages.css';

const Careers = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    experience: '',
    coverLetter: '',
    resume: null
  });
  const [submitted, setSubmitted] = useState(false);

  const handleApplyClick = (position) => {
    setSelectedJob(position);
    setIsModalOpen(true);
    setSubmitted(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
    setApplicationData({
      fullName: '',
      email: '',
      phone: '',
      linkedin: '',
      portfolio: '',
      experience: '',
      coverLetter: '',
      resume: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setApplicationData(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    // Here you would send data to backend
    console.log('Application submitted:', applicationData, selectedJob);
    setSubmitted(true);
    setTimeout(() => {
      handleCloseModal();
    }, 2000);
  };

  const openPositions = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Remote / New York',
      type: 'Full-time',
      description: 'Build scalable features for our logistics platform using React, Node.js, and cloud technologies.'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'San Francisco',
      type: 'Full-time',
      description: 'Lead product strategy and roadmap for our fleet management solutions.'
    },
    {
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create intuitive and beautiful user experiences for logistics professionals.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Chicago',
      type: 'Full-time',
      description: 'Help our customers achieve success with TrackMate platform.'
    }
  ];

  const benefits = [
    { icon: '💰', title: 'Competitive Salary', description: 'Industry-leading compensation packages' },
    { icon: '🏥', title: 'Health Benefits', description: 'Comprehensive medical, dental, and vision' },
    { icon: '🏠', title: 'Remote Work', description: 'Flexible work-from-home options' },
    { icon: '📚', title: 'Learning Budget', description: '$2000 annual learning allowance' },
    { icon: '🌴', title: 'Unlimited PTO', description: 'Take time off when you need it' },
    { icon: '🚀', title: 'Career Growth', description: 'Clear paths for advancement' }
  ];

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">Join Our Team</h1>
          <p className="page-description">
            Help us shape the future of logistics technology
          </p>
        </div>

        <div className="careers-intro">
          <h2>Why Work With Us?</h2>
          <p>
            At TrackMate, we're building the future of logistics. Join a team of passionate 
            innovators who are transforming how businesses manage their fleets and deliveries.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="positions-section">
          <h2 className="section-heading">Open Positions</h2>
          <div className="positions-list">
            {openPositions.map((position, index) => (
              <div key={index} className="position-card">
                <div className="position-header">
                  <h3>{position.title}</h3>
                  <span className="position-type">{position.type}</span>
                </div>
                <div className="position-meta">
                  <span className="position-dept">📁 {position.department}</span>
                  <span className="position-location">📍 {position.location}</span>
                </div>
                <p className="position-description">{position.description}</p>
                <button className="apply-btn" onClick={() => handleApplyClick(position)}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-box">
          <h2>Don't See Your Role?</h2>
          <p>We're always looking for talented individuals. Send us your resume!</p>
          <button className="cta-button" onClick={() => navigate('/contact')}>
            Get In Touch
          </button>
        </div>

        {/* Application Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
              <h2 className="modal-title">Apply for {selectedJob?.title}</h2>
              <p className="modal-subtitle">{selectedJob?.department} • {selectedJob?.location}</p>
              
              {submitted ? (
                <div className="application-success">
                  <div className="success-icon">✓</div>
                  <h3>Application Submitted Successfully!</h3>
                  <p>Thank you for applying. We'll review your application and get back to you soon.</p>
                </div>
              ) : (
                <form className="application-form" onSubmit={handleSubmitApplication}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={applicationData.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={applicationData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={applicationData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="linkedin">LinkedIn Profile</label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={applicationData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="portfolio">Portfolio/Website</label>
                      <input
                        type="url"
                        id="portfolio"
                        name="portfolio"
                        value={applicationData.portfolio}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="experience">Years of Experience *</label>
                      <select
                        id="experience"
                        name="experience"
                        value={applicationData.experience}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="resume">Resume/CV * (PDF, DOC, DOCX)</label>
                    <input
                      type="file"
                      id="resume"
                      name="resume"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      required
                      className="file-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="coverLetter">Cover Letter *</label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows="6"
                      value={applicationData.coverLetter}
                      onChange={handleInputChange}
                      placeholder="Tell us why you're a great fit for this role..."
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-application-btn">
                    Submit Application
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Careers;
