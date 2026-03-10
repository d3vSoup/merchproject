import React from "react";
import { Link } from "react-router-dom";
import FadeInSection from "../../components/ui/FadeInSection";
import "./LegalPages.css";

export default function ReturnsExchangesPage() {
  return (
    <div className="legal-page">
      <FadeInSection className="legal-hero">
        <h1>Returns &amp; Exchanges</h1>
        <p className="legal-intro">
          Our return and refund policy for BMSCE Merch orders.
        </p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Return Period</h2>
        <p>Customers can return their order within 15 days from the date of delivery. This applies to orders placed outside sale duration.</p>
        <p>Products purchased during Sale or clearance sale are non-returnable and non-refundable.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Eligibility</h2>
        <ul>
          <li>The product must be in its original condition, unwashed, and with all tags attached.</li>
          <li>We reserve the right not to accept returns of products which we believe are being returned after use, washed or soiled, or are damaged (except where the return is due to damaged goods having been delivered to you).</li>
          <li>Keeping strict hygiene standards, we do not accept returns on caps, hats, masks, boxers, shorts, bodysuits, crop tops, tank tops, rugs, socks, baby tees, and stationery products like stickers.</li>
        </ul>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>How to Return</h2>
        <p>We will not be able to arrange reverse pickup unless confirmed by our Customer Experience Team. If you have received a defective product, send us images at <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a> and we will get back to you.</p>
        <p>Once confirmed by our customer experience team, we will arrange the reverse pickup of products within 48 hours of receiving the request.</p>
        <p>Please ensure the packaging is intact the way it was delivered when returning the product.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Refunds</h2>
        <p>In case you return the goods within the contractual term, you will only be reimbursed with the amount paid for said products. Delivery charges will not be reimbursed. The amount will be credited back to your original payment method.</p>
        <p>If you have received a damaged, defective, missing or wrong product, please reach out to us within 24 hours at <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a></p>
        <p>An order can be returned a maximum of two (2) consecutive times.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <p className="legal-link">
          <Link to="/use-of-our-website">View full Terms &amp; Conditions (Use of Our Website)</Link>
        </p>
      </FadeInSection>
    </div>
  );
}
