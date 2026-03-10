import React from "react";
import FadeInSection from "../../components/ui/FadeInSection";
import "./LegalPages.css";

export default function UseOfOurWebsitePage() {
  return (
    <div className="legal-page">
      <FadeInSection className="legal-hero">
        <h1>Use of Our Website</h1>
        <p className="legal-intro">
          When you use this website and place orders through it, you agree to the following terms and conditions.
        </p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Your Obligations</h2>
        <p>When you use this website and place orders through it, you agree to:</p>
        <ul>
          <li>Use this website to make enquiries and legally valid orders only.</li>
          <li>Not to make any false or fraudulent orders. If an order of this type may reasonably be considered to have been placed, we shall be authorised to cancel it and inform the competent authorities.</li>
          <li>Provide us with your email address, postal address and/or other contact details truthfully and exactly. You also agree that we may use this information to contact you in the context of your order if necessary.</li>
          <li>If you do not provide us with all the information we need, you cannot place your order.</li>
        </ul>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Contract</h2>
        <p>After you place an order you will receive:</p>
        <ul>
          <li>Confirmation mail/Message (Order Confirmation)</li>
          <li>Shipping Confirmation</li>
        </ul>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Availability of Products</h2>
        <p>All orders are subject to availability of products. Along this line, if there are difficulties regarding the supply of products or there are no more items left in stock, we reserve the right to provide you with information on substitute products of the same. If you do not wish to order the substitute products, we will reimburse any amount that you may have paid.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Refusal to Process an Order</h2>
        <p>We will always do everything possible to process all orders. There may be exceptional circumstances that force us to refuse to process an order after having sent the Order Confirmation. We reserve the right to do so at any time. We reserve the right to remove any product from this website at any time and to remove or modify any material or content from the same.</p>
        <p>We shall not be liable to you or any third party for removing any product or modifying any product or material or content from our website or not processing an order once we have sent the Order Confirmation.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Delivery</h2>
        <p>In continuation to the clause above regarding the availability of product and extraordinary circumstances, we will try to make sure to send the order consisting of product(s) by the date indicated in the Delivery confirmation or, if no delivery date is specified, in the estimated time frame within a maximum period of 30 days from the date of Order confirmation.</p>
        <p>Nonetheless, there may be delays for reasons such as the occurrence of unforeseen circumstances or the delivery zone.</p>
        <p>For the purpose of these Conditions, the &quot;delivery&quot; shall be understood to have taken place or the order &quot;delivered&quot; as soon as you or a third party indicated by you acquires physical possession of the goods, which will be evidenced by the signing of the receipt of the order at the delivery address indicated by you.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Price and Payment</h2>
        <p>We make every effort to ensure that the prices featured on the website are correct; errors may occur. If we discover an error in the price of any of the products that you have ordered, we will inform you as soon as possible and give you the option of confirming your order at the correct price or cancelling it. If we are unable to contact you, the order will be considered cancelled and all amounts paid will be refunded to you in full.</p>
        <p>We are not obliged to provide you with any product at the incorrect lower price (even when we have sent the Shipping Confirmation) if the error in the price is obvious and unmistakable and could have reasonably been recognized by you as an incorrect price.</p>
        <p>The prices on the website exclude delivery charges. Prices may change at any time.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Return – Terms and Conditions</h2>
        <p>Customers can return the order within 15 days from the date of delivery. (For orders placed outside sale duration)</p>
        <p>Keeping the strict hygiene standards of our products, we do not accept returns on several product categories like caps, hats, masks, boxers, shorts, bodysuits, crop tops, tank tops, rugs, socks and baby tees. Stationery products like stickers are also part of no-return products.</p>
        <ul>
          <li>The product must be in its original condition, unwashed, and with all tags attached.</li>
          <li>We reserve the right not to accept the return of products which we believe are being returned after use, washed or soiled, or are damaged (except where the return is on account of damaged goods having been delivered to you).</li>
          <li>We will not be able to arrange reverse pickup of products unless confirmed by our Customer Experience Team. If you have received a defective product, send us images at <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a> and we will get back to you. Once confirmed by the Customer Experience Team.</li>
          <li>Once confirmed by our customer experience team, we will arrange the reverse pickup of products within 48 hours of receiving the request.</li>
          <li>Please ensure while returning the product the packaging is intact the way it was delivered.</li>
          <li>As we do not have our own delivery service we rely on delivery partners like BlueDart, Delhivery, DTDC, etc.</li>
          <li>Products purchased during Sale or clearance sale are non-returnable and non-refundable.</li>
        </ul>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Return / Refund Policy</h2>
        <p>We grant you a period of 15 days from the day the order was delivered by the delivery executive. (For orders placed outside sale duration)</p>
        <p>In case you return the goods within the contractual term of the right of withdrawal, you will only be reimbursed with the amount paid for said products. Delivery charges will not be reimbursed after the goods are returned. The amount will be credited back to your original payment method.</p>
        <p>In case you have received a damaged, defective, missing or wrong product on delivery, please reach out to us within 24 hours at <a href="mailto:souparno.cs24@bmsce.ac.in">souparno.cs24@bmsce.ac.in</a></p>
        <p>An order can be returned a maximum of two (2) consecutive times.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Governing Law and Jurisdiction</h2>
        <p>These Terms of Service and any separate agreement whereby we provide you services shall be governed by and construed in accordance with the laws of India and jurisdiction of Bengaluru, Karnataka.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Invoice</h2>
        <p>Invoice will be provided to you along with the products when delivered.</p>
      </FadeInSection>

      <FadeInSection className="legal-section">
        <h2>Taxes</h2>
        <p>Pursuant to the prevailing rules and regulations in force, all purchases done through the website are subject to applicable taxes.</p>
      </FadeInSection>
    </div>
  );
}
