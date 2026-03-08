// src/pages/Landing.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion } from "../lib/motion";
import "./Landing.css"; // Ensure you import the styles

const APPAREL_SLIDES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAA4lGLbTToxkch_opLjxCXCVQ-pQKAF-rYoHyvASchNBr9Xks4pG1yFGVW416CyzfgWY-KUaPreeEz8GcryjzHnPg6q8Uw5tg9zOHRWWVaUJtfck1QHPU5AAOCbl2JMBsWvWsAOBpuxmNW4CerV3KJZO2axbiAvXnd00hMRkObGmUrOD-IkIMe35WY8U5X0mjk3DAfiOIyMSSrCVSnbTMsJ3GZJvcb7VV45ZA2BrFfBR0gfH1sNDegzibrhVyIpmI8JqrrazXVrGU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBh4I9NyQ38IL93N_VKPhG2esazhgY6-4IjEl6XvvQkdnLta3h6ZPXelACGQauGD05grwCSEQqFroSDaVYvITdMncbwjgDPQ1_FyQbXIXT98ZELjMjbhwrKzrD0WorT0beKHjRUaU1f9C67Ancd39jDtK8lba5xqZabfi5YdzoSSAaNS8TVRtFTUOvBAfDm7JUymie-bgIv5F3CURAcLakcc5iarDuv6mUHSdITEadFOtyhggiHp7FuKTje6wBnqnAauaHVFc56syc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBBMSa1mWzsKVjzYgjuYCVNu3zn7kzURmZKYT7veY3hgTINXl3WjqVhkZn81qt77eEPj95FJwMkxRa-USGVV-je8UkukFbqW4kouQsgpipQElOuTW2eeEAM3YJlpSU5OM-AmruL_DhSE-duwp2VjWB1B2m4lpMueYSRBcXuvhW5mtkISpqpQx8ocfL4l589oaWFCBRCacQvWUC6c8HC49yHl9IXZvm20ZVGX1oxsV7n_veQXkR3-O2F_UnASRfMNUmNPBfC_-LoTZQ"
];

const EVENTS_DATA = [
  {
    key: "utsav",
    label: "Utsav",
    desc: "The Annual Cultural Fest",
    bgClass: "event-card--utsav",
    bgUrl: "https://images.unsplash.com/photo-1514525253344-f814d873ee41?auto=format&fit=crop&q=80&w=800",
    path: "/event/utsav",
  },
  {
    key: "phaseshift",
    label: "Phaseshift",
    desc: "Technical Symposium",
    bgClass: "event-card--phaseshift",
    bgUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    path: "/event/phaseshift",
  },
  {
    key: "farouche",
    label: "Farouche",
    desc: "Management Fest",
    bgClass: "event-card--farouche",
    bgUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
    path: "/event/farouche",
  },
  {
    key: "club",
    label: "Club & Dept Merch",
    desc: "Exclusive Collections",
    bgClass: "event-card--default",
    bgUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    path: "/event/club",
  }
];

export default function Landing() {
  const [activeSlide, setActiveSlide] = useState(0);

  // Apparel Auto-cycling logic
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % APPAREL_SLIDES.length);
    }, 5000); // 5 sec per slide
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll('.fade-in-section').forEach(section => {
        section.classList.add('is-visible');
      });
      return;
    }

    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in-section');
    elements.forEach(section => observer.observe(section));

    return () => {
      elements.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="landing-page">
      {/* 1. Hero Section */}
      <header className="landing-hero fade-in-section">
        <div id="hero-canvas-container">
          <div className="iridescent-blob blob-1"></div>
          <div className="iridescent-blob blob-2"></div>
          <div className="iridescent-blob blob-3"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            BMSCE <span className="hero-title-gradient">Merch</span>
          </h1>
          <p className="hero-subtitle">
            The official merchandise platform for BMS College of Engineering. 
            Exclusive, limited-edition drops for every major college event — designed by students, for students.
          </p>
          <div className="hero-actions">
            <a href="#events" className="hero-btn">Explore Drops</a>
            <Link to="/resell" className="hero-btn" style={{ background: '#f97316', color: '#fff', borderColor: '#f97316' }}>Browse Revault</Link>
          </div>
        </div>
      </header>

      {/* 2. Quote Section */}
      <section className="landing-quote-section fade-in-section">
        <h2 className="landing-quote">
          "When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a soup made out of a poisonous mushroom? No! A man dies when he is forgotten!"
        </h2>
        <p className="landing-quote-author">— Make your mark. Stay remembered.</p>
      </section>

      {/* 3. Apparel Showcase */}
      <section className="apparel-showcase fade-in-section" id="showcase">
        <div className="apparel-slider">
          {APPAREL_SLIDES.map((url, idx) => (
            <div
              key={idx}
              className={`apparel-slide ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url('${url}')` }}
            ></div>
          ))}
          <div className="apparel-gradient"></div>
        </div>
        <div className="apparel-content">
          <h3 className="apparel-title">Premium Quality</h3>
          <p className="apparel-desc">Heavyweight cotton, vibrant prints, reinforced stitching.</p>
        </div>
      </section>

      {/* 4. Events Scroller */}
      <section className="events-section fade-in-section" id="events">
        <div className="events-header">
          <h2 className="events-title">Explore Events</h2>
          <p className="events-subtitle">Gear up for the biggest fests on campus.</p>
        </div>
        
        <div className="events-scroller">
          {EVENTS_DATA.map((event) => (
            <Link
              key={event.key}
              to={event.path}
              className={`event-scroller-card ${event.bgClass}`}
            >
              <div
                className="event-card-bg"
                style={{ backgroundImage: `url('${event.bgUrl}')` }}
              ></div>
              <div className="event-card-content">
                <span className="event-card-tag">{event.desc}</span>
                <h3 className="event-card-name">{event.label.toUpperCase()}</h3>
              </div>
            </Link>
          ))}
          {/* Duplicate for seamless effect or extended scroll width */}
          {EVENTS_DATA.map((event) => (
            <Link
              key={`${event.key}-dup`}
              to={event.path}
              className={`event-scroller-card ${event.bgClass}`}
              aria-hidden="true" // Hide from screen readers if just duplicate visual
            >
              <div
                className="event-card-bg"
                style={{ backgroundImage: `url('${event.bgUrl}')` }}
              ></div>
              <div className="event-card-content">
                <span className="event-card-tag">{event.desc}</span>
                <h3 className="event-card-name">{event.label.toUpperCase()}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Support Section */}
      <section className="support-section fade-in-section" id="about">
        <div className="support-content">
          <h2 className="support-title">Support the Maker</h2>
          <p className="support-desc">
            Love the drops and the work behind this platform? Help keep the merch rolling — every bit of support counts.
          </p>
          <a href="https://www.buymeacoffee.com/souparno" target="_blank" rel="noreferrer" className="support-btn">
            <span>☕</span> Buy Me a Coffee
          </a>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="landing-footer">
        <div className="footer-avatar">S</div>
        <h4 className="footer-name">Souparno</h4>
        <p className="footer-role">Developer & Maintainer of BMSCE Merch</p>
        <div className="footer-links">
          <a href="https://wa.me/919831219028" className="footer-link">WhatsApp</a>
          <a href="mailto:souparno.cs24@bmsce.ac.in" className="footer-link">Email</a>
        </div>
        <p className="footer-tagline">Built with care at BMSCE</p>
      </footer>
    </div>
  );
}
