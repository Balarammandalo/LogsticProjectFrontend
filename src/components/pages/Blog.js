import React, { useState } from 'react';
import Navbar from '../common/Navbar';
import './Pages.css';

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const posts = [
    {
      title: '5 Ways to Optimize Your Fleet Operations in 2025',
      date: 'January 15, 2025',
      category: 'Best Practices',
      author: 'Sarah Johnson',
      excerpt: 'Discover proven strategies to improve efficiency, reduce costs, and maximize your fleet performance with modern technology and smart planning.',
      readTime: '5 min read',
      image: '📊'
    },
    {
      title: 'The Future of Logistics: AI and Machine Learning',
      date: 'January 10, 2025',
      category: 'Technology',
      author: 'Michael Chen',
      excerpt: 'Explore how artificial intelligence and machine learning are revolutionizing the logistics industry and what it means for your business.',
      readTime: '7 min read',
      image: '🤖'
    },
    {
      title: 'Best Practices for Route Planning and Optimization',
      date: 'January 5, 2025',
      category: 'Operations',
      author: 'Emily Rodriguez',
      excerpt: 'Learn how to create optimal delivery routes that save time, reduce fuel costs, and improve customer satisfaction.',
      readTime: '6 min read',
      image: '🗺️'
    },
    {
      title: 'How Real-Time Tracking Improves Customer Experience',
      date: 'December 28, 2024',
      category: 'Customer Success',
      author: 'David Park',
      excerpt: 'Understand the impact of real-time tracking on customer satisfaction and how it can differentiate your business.',
      readTime: '4 min read',
      image: '📍'
    },
    {
      title: 'Reducing Carbon Footprint in Fleet Management',
      date: 'December 20, 2024',
      category: 'Sustainability',
      author: 'Lisa Anderson',
      excerpt: 'Practical tips for making your fleet operations more environmentally friendly while maintaining efficiency.',
      readTime: '5 min read',
      image: '🌱'
    },
    {
      title: 'Driver Safety: Technology and Training Best Practices',
      date: 'December 15, 2024',
      category: 'Safety',
      author: 'James Wilson',
      excerpt: 'Comprehensive guide to improving driver safety through technology, training, and proactive management.',
      readTime: '8 min read',
      image: '🚗'
    }
  ];

  const categories = ['All', 'Technology', 'Best Practices', 'Operations', 'Customer Success', 'Sustainability', 'Safety'];

  // Filter posts based on active category
  const filteredPosts = activeCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-hero">
          <h1 className="page-title">TrackMate Blog</h1>
          <p className="page-description">
            Insights, tips, and updates from the TrackMate team
          </p>
        </div>

        <div className="blog-categories-enhanced">
          {categories.map((category, index) => (
            <button 
              key={index} 
              className={`category-btn-enhanced ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="blog-stats">
          <p className="results-count">
            Showing <strong>{filteredPosts.length}</strong> {filteredPosts.length === 1 ? 'article' : 'articles'}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
          </p>
        </div>

        <div className="blog-grid-enhanced">
          {filteredPosts.length > 0 ? filteredPosts.map((post, index) => (
            <article key={index} className="blog-card">
              <div className="blog-image">{post.image}</div>
              <div className="blog-content">
                <div className="blog-meta">
                  <span className="blog-category">{post.category}</span>
                  <span className="blog-read-time">{post.readTime}</span>
                </div>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-footer">
                  <div className="blog-author">
                    <span className="author-avatar">👤</span>
                    <div className="author-info">
                      <span className="author-name">{post.author}</span>
                      <span className="blog-date">{post.date}</span>
                    </div>
                  </div>
                  <a href="#" className="read-more">Read More →</a>
                </div>
              </div>
            </article>
          )) : (
            <div className="no-results">
              <div className="no-results-icon">📝</div>
              <h3>No articles found</h3>
              <p>No articles in this category yet. Check back soon!</p>
            </div>
          )}
        </div>

        <div className="newsletter-section">
          <h2>📧 Subscribe to Our Newsletter</h2>
          <p>Get the latest logistics insights and TrackMate updates delivered to your inbox</p>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="newsletter-input"
            />
            <button className="newsletter-btn">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
