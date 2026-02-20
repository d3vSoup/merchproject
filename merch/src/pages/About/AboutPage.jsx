import React from "react";
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
    title: "Resell Marketplace",
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
      <section className="about-hero">
        <h1>
          BMSCE <span>Merch</span>
        </h1>
        <p className="about-hero-tagline">
          The official merchandise platform for BMS College of Engineering.
          Exclusive, limited-edition drops for every major college event — designed by students, for students.
        </p>
      </section>

      <section className="about-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="about-feature-card">
            <div className="about-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="about-how">
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
      </section>

      <section className="about-events">
        <h2>Events We Cover</h2>
        <div className="about-event-tags">
          {EVENTS.map((e) => (
            <span key={e.cls} className={`about-event-tag about-event-tag--${e.cls}`}>
              {e.label}
            </span>
          ))}
        </div>
      </section>

      <section className="about-support">
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
      </section>

      <div className="about-dev-card">
        <div className="about-dev-avatar">S</div>
        <div className="about-dev-info">
          <h3>Souparno</h3>
          <p>Developer & maintainer of BMSCE Merch</p>
          <div className="about-dev-links">
            <a href="tel:+919831219028">9831219028</a>
            <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a>
          </div>
        </div>
      </div>

      <p className="about-footer">Built with care at BMSCE</p>
    </div>
  );
}
