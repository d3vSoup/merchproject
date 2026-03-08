// src/pages/Landing.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_CATALOG } from "../data/products";
import { prefersReducedMotion } from "../lib/motion";
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

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

function getFeaturedProducts() {
  const featured = [];
  for (const tabKey of ["utsav", "phaseshift", "farouche"]) {
    const products = PRODUCT_CATALOG[tabKey] || [];
    products.slice(0, 3).forEach((p) => featured.push({ ...p, tabKey }));
  }
  return featured;
}

function RollingStrip() {
  const stripRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = stripRef.current;
    if (!el) return;

    let rafId;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        el.style.transform = `translateX(${-scrollY * 0.15}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const words = "BMSCE · UTSAV · PHASESHIFT · FAROUCHE · MERCH · ";
  const repeated = words.repeat(8);

  return (
    <div
      className="hero-rolling-strip"
      ref={stripRef}
      aria-hidden="true"
      data-rolling-strip
    >
      <span>{repeated}</span>
    </div>
  );
}

function HeroCarousel() {
  const products = getFeaturedProducts();
  const carouselRef = useRef(null);

  const handleKeyDown = (e) => {
    const container = carouselRef.current;
    if (!container) return;
    if (e.key === "ArrowRight") {
      container.scrollBy({ left: 180, behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      container.scrollBy({ left: -180, behavior: "smooth" });
    }
  };

  if (!products.length) return null;

  return (
    <div
      className="hero-carousel"
      ref={carouselRef}
      role="region"
      aria-label="Featured products"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {products.map((p) => (
        <Link
          key={`${p.tabKey}-${p.id}`}
          to={`/event/${p.tabKey}`}
          className="hero-carousel-item"
          tabIndex={-1}
        >
          <div
            className="hero-carousel__img"
            style={{
              background: p.imageUrl
                ? `url(${p.imageUrl}) center/cover`
                : `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`,
            }}
          >
            {!p.imageUrl && <span>{p.previewLabel || p.name}</span>}
          </div>
          <div className="hero-carousel__info">
            <span className="hero-carousel__name">{p.name}</span>
            <span className="hero-carousel__price">{formatPrice(p.price)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing-page page-enter">
      <div className="landing-watermark" aria-hidden="true" />
      <div className="landing-content">
        <h1 className="landing-title">BMSCE Merchandise</h1>
        <p className="landing-description">
          Exclusive merchandise for Utsav, Phaseshift, Farouche, and Club events.
          Premium quality, limited edition designs.
        </p>

        <HeroCarousel />

        <div className="events-scroll-container" style={{ position: "relative" }}>
          <RollingStrip />
          <div className="events-scroll-track">
            {EVENTS.map((event) => (
              <Link
                key={event.key}
                to={event.path}
                className={`event-card theme-${event.color}`}
              >
                <div className="event-card-image">
                  <img src={event.preview} alt={event.label} loading="lazy" />
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
                  <img src={event.preview} alt={event.label} loading="lazy" />
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
