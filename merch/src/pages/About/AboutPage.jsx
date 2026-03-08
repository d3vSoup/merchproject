import React from "react";
import FadeInSection from "../../components/ui/FadeInSection";
import "./AboutPage.css";

const FEATURES = [
  {
    icon: "🎨",
    title: "Exclusive Designs",
    desc: "Every drop features original artwork created specifically for BMSCE events — limited edition, never repeated.",
  },
  {
    icon: "🧵",
    title: "Premium Quality",
    desc: "Heavyweight cotton, vibrant DTG prints, and reinforced stitching so your merch outlasts your college years.",
  },
  {
    icon: "🔄",
    title: "Revault Marketplace",
    desc: "Missed a drop? Browse verified student listings to grab past-event merch in a safe, moderated marketplace.",
  },
  {
    icon: "📦",
    title: "On-Campus Pickup",
    desc: "No shipping headaches — collect your order right on campus during designated pickup windows.",
  },
  {
    icon: "🔒",
    title: "Secure Payments",
    desc: "Industry-standard payment processing with full order tracking from checkout to collection.",
  },
  {
    icon: "⚡",
    title: "Real-Time Updates",
    desc: "Live countdown timers, stock status, and instant notifications keep you ahead of every drop.",
  },
];

const STEPS = [
  { num: 1, title: "Browse Drops", desc: "Explore merch collections for Utsav, Phaseshift, Farouche & club events." },
  { num: 2, title: "Pick Your Fit", desc: "Choose size, variant, and quantity — add to cart or wishlist for later." },
  { num: 3, title: "Checkout", desc: "Place your order securely and get a confirmation with your order number." },
  { num: 4, title: "Collect", desc: "Pick up your merch on campus — show your order confirmation and you're set." },
];

const EVENTS = [
  { label: "Utsav", cls: "utsav" },
  { label: "Phaseshift", cls: "phaseshift" },
  { label: "Farouche", cls: "farouche" },
  { label: "Club & Dept", cls: "clubs" },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <FadeInSection className="about-hero">
        <h1>
          BMSCE <span>Merch</span>
        </h1>
        <p className="about-hero-tagline">
          The official merchandise platform for BMS College of Engineering.
          Exclusive, limited-edition drops for every major college event — designed by students, for students.
        </p>
      </FadeInSection>

      <FadeInSection className="about-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="about-feature-card">
            <div className="about-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </FadeInSection>

      <FadeInSection className="about-how">
        <h2>How It Works</h2>
        <div className="about-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="about-step">
              <div className="about-step-number">{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </FadeInSection>

      <FadeInSection className="about-events">
        <h2>Events We Cover</h2>
        <div className="about-event-tags">
          {EVENTS.map((e) => (
            <span key={e.cls} className={`about-event-tag about-event-tag--${e.cls}`}>
              {e.label}
            </span>
          ))}
        </div>
      </FadeInSection>

      <FadeInSection className="about-support">
        <h2>Support the Maker</h2>
        <p>
          Love the drops and the work behind this platform?
          Help keep the merch rolling — every bit of support counts.
        </p>
        <a
          href="https://www.buymeacoffee.com/souparno"
          target="_blank"
          rel="noreferrer"
          className="about-coffee-btn"
        >
          ☕ Buy Me a Coffee
        </a>
      </FadeInSection>

      <FadeInSection className="about-chat">
        <h2>Chat With Us</h2>
        <p>Got questions about an order, sizing, or upcoming drops? Reach out directly on WhatsApp — we usually reply within a few hours.</p>
        <a
          href="https://wa.me/919831219028?text=Hi%2C%20I%20have%20a%20question%20about%20BMSCE%20Merch"
          target="_blank"
          rel="noreferrer"
          className="about-whatsapp-btn"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Chat on WhatsApp
        </a>
      </FadeInSection>

      <FadeInSection as="div" className="about-dev-card-wrapper">
        <div className="about-dev-card">
          <div className="about-dev-avatar">S</div>
          <div className="about-dev-info">
            <h3>Souparno</h3>
            <p>Developer & maintainer of BMSCE Merch</p>
            <div className="about-dev-links">
              <a href="https://wa.me/919831219028" target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="tel:+919831219028">9831219028</a>
              <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a>
            </div>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection as="p" className="about-footer">Built with care at BMSCE</FadeInSection>
    </div>
  );
}
