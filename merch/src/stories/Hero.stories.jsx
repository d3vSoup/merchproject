// Storybook story for Hero / Landing elements
import React from "react";

function HeroDemo() {
  return (
    <div className="landing-page" style={{ minHeight: 400 }}>
      <div className="landing-watermark" aria-hidden="true" />
      <div className="landing-content">
        <h1 className="landing-title">BMSCE Merchandise</h1>
        <p className="landing-description">
          Exclusive merch for Utsav, Phaseshift, Farouche, and Club events.
        </p>
        <div className="landing-actions">
          <button className="btn">Browse Resell</button>
          <button className="btn btn--ghost">About Us</button>
        </div>
      </div>
    </div>
  );
}

export default { title: "Pages/Hero", component: HeroDemo };
export const Default = () => <HeroDemo />;
