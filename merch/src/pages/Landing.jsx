// src/pages/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import previewUtsav from "../assets/preview-utsav.svg";
import previewPhaseshift from "../assets/preview-phaseshift.svg";
import previewFarouche from "../assets/preview-farouche.svg";
import previewClub from "../assets/preview-club.svg";

const EVENTS = [
  {
    key: "utsav",
    label: "Utsav",
    preview: previewUtsav,
    path: "/event/utsav",
    color: "orange",
  },
  {
    key: "phaseshift",
    label: "Phaseshift",
    preview: previewPhaseshift,
    path: "/event/phaseshift",
    color: "blue",
  },
  {
    key: "farouche",
    label: "Farouche",
    preview: previewFarouche,
    path: "/event/farouche",
    color: "violet",
  },
  {
    key: "club",
    label: "Club & Dept Merch",
    preview: previewClub,
    path: "/event/club",
    color: "green",
  },
];

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="landing-watermark">BMS MERCH</div>
      <div className="landing-content">
        <h1 className="landing-title">BMSCE Merchandise</h1>
        <p className="landing-description">
          Exclusive merchandise for Utsav, Phaseshift, Farouche, and Club events.
          Premium quality, limited edition designs.
        </p>
        <div className="events-scroll-container">
          <div className="events-scroll-track">
            {EVENTS.map((event) => (
              <Link
                key={event.key}
                to={event.path}
                className={`event-card theme-${event.color}`}
              >
                <div className="event-card-image">
                  <img src={event.preview} alt={event.label} />
                </div>
                <div className="event-card-label">{event.label}</div>
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {EVENTS.map((event) => (
              <Link
                key={`${event.key}-dup`}
                to={event.path}
                className={`event-card theme-${event.color}`}
              >
                <div className="event-card-image">
                  <img src={event.preview} alt={event.label} />
                </div>
                <div className="event-card-label">{event.label}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="landing-actions">
          <Link to="/resell" className="btn">
            Browse Resell
          </Link>
          <Link to="/about" className="btn btn--ghost">
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
}

