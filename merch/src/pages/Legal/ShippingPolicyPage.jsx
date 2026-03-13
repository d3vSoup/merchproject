import React from "react";
import { Link } from "react-router-dom";
import FadeInSection from "../../components/ui/FadeInSection";
import "./LegalPages.css";

export default function ShippingPolicyPage() {
  return (
    <div className="legal-page">
      <FadeInSection className="legal-hero">
        <h1>Shipping Policy</h1>
        <p className="legal-intro">
          Information about how we deliver your ALMA orders.
        </p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Delivery Timeline</h2>
        <p>We will try to send your order by the date indicated in the Delivery confirmation or, if no delivery date is specified, within the estimated time frame. Orders are typically delivered within a maximum period of 30 days from the date of Order confirmation.</p>
        <p>There may be delays for reasons such as unforeseen circumstances or the delivery zone. We rely on delivery partners like BlueDart, Delhivery, DTDC, etc. for fulfilment.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>On-Campus Pickup</h2>
        <p>For event merchandise, we often offer on-campus pickup during designated collection windows. When available, you will receive details in your order confirmation. Show your order confirmation at the pickup point to collect your items.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Delivery Confirmation</h2>
        <p>For the purpose of our terms, &quot;delivery&quot; is understood to have taken place when you or a third party indicated by you acquires physical possession of the goods, evidenced by the signing of the receipt at the delivery address.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <p className="legal-link">
          <Link to="/use-of-our-website">View full Terms &amp; Conditions (Use of Our Website)</Link>
        </p>
      </FadeInSection>
    </div>
  );
}
