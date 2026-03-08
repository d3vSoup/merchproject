// src/pages/Contact/ContactPage.jsx
import React from "react";

export default function ContactPage() {
  return (
    <section className="contact-section">
      <div className="section-heading">Contact Us</div>
      <div className="contact-content">
        <div className="contact-info">
          <h3>Get in Touch</h3>
          <p>For any queries, issues, or support, please contact us:</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <strong>Email:</strong>
              <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a>
            </div>
            <div className="contact-item">
              <strong>Phone:</strong>
              <a href="tel:+919831219028">+91 9831219028</a>
            </div>
          </div>

          <div className="contact-note">
            <h4>Revault Ban Issues</h4>
            <p>
              If you believe your Revault account was banned incorrectly, or if you have concerns about
              a transaction, please contact us using the information above. We'll review your case and
              respond as soon as possible.
            </p>
          </div>

          <div className="contact-faq">
            <h4>Frequently Asked Questions</h4>
            <details>
              <summary>How do I unlock the Revault feature?</summary>
              <p>
                Complete your profile (upload PFP, fill in all details) to unlock the Revault feature.
                You'll need to fill out the resell onboarding form with your name, branch, and semester.
              </p>
            </details>
            <details>
              <summary>What happens if I get banned from Revault?</summary>
              <p>
                If you receive 3 strikes for unacceptable behavior, your Revault account will be banned.
                Contact us if you believe this was done in error.
              </p>
            </details>
            <details>
              <summary>How do I report an issue?</summary>
              <p>
                Use the contact information above to reach out to us. For resell-related issues, you can
                also create a ticket through the chat system.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

