// src/pages/About/AboutPage.jsx
import React from "react";

export default function AboutPage() {
  return (
    <section className="about-section">
      <div className="section-heading">About BMSCE Merchandise</div>
      <div className="about-content">
        <p>
          Welcome to BMSCE Merchandise, your one-stop destination for exclusive college event merchandise.
          We offer premium quality apparel and accessories for Utsav, Phaseshift, Farouche, and Club events.
        </p>
        <h3>Our Mission</h3>
        <p>
          To provide high-quality, limited edition merchandise that celebrates our college events and creates
          lasting memories for students.
        </p>
        <h3>Quality Assurance</h3>
        <p>
          All our products are made with premium materials and feature unique designs created specifically
          for BMSCE events. We ensure the highest standards of quality and comfort.
        </p>
        <h3>Resell Platform</h3>
        <p>
          Our resell platform allows students to buy and sell merchandise in a safe, moderated environment.
          All transactions are monitored to ensure a fair and secure experience.
        </p>
        <h3>Support the Maker</h3>
        <p>
          Love the drops and the work that goes into maintaining this platform?{" "}
          <a
            href="https://www.buymeacoffee.com/souparno"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600 }}
          >
            Buy me a coffee
          </a>{" "}
          to keep the merch rolling!
        </p>
        <div style={{ marginTop: 24, padding: 16, background: "rgba(0,0,0,0.04)", borderRadius: 8 }}>
          <h4 style={{ marginTop: 0 }}>Developer Contact</h4>
          <p style={{ margin: "4px 0" }}>
            Phone: <a href="tel:+919831219028">9831219028</a>
          </p>
          <p style={{ margin: "4px 0" }}>
            Email: <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a>
          </p>
        </div>
      </div>
    </section>
  );
}

