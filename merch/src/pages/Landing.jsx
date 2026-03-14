import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { EVENT_CARDS } from "../data/eventCards";
import { PRODUCT_CATALOG } from "../data/products";
import "./Landing.css";

const APPAREL_SLIDES = [];

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef(null);
  const [heroSlides, setHeroSlides] = useState(APPAREL_SLIDES);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const [eventImages, setEventImages] = useState({});

  // Fetch dynamic hero images and event images from Admin Overrides
  useEffect(() => {
    let mounted = true;
    const fetchOverrides = async () => {
      try {
        const res = await api.get('/api/catalog/overrides');
        const overrides = res.data?.overrides || [];
        const heroConfig = overrides.find(o => o.tab_key === 'system' && o.product_id === 'hero_carousel');
        if (mounted && heroConfig && heroConfig.images && heroConfig.images.length > 0) {
          setHeroSlides(heroConfig.images);
          setHeroLoaded(true);
        }
        const map = {};
        overrides.forEach((o) => {
          if (o.tab_key === 'system' && o.product_id?.startsWith('event_images_') && Array.isArray(o.images)) {
            map[o.product_id] = o.images;
          }
        });
        if (mounted) setEventImages(map);
      } catch (e) {
        console.error("Failed to fetch overrides:", e);
      }
    };
    fetchOverrides();
    return () => { mounted = false; };
  }, []);

  // Hero carousel — faster transition (3s interval)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroSlides]);

  // Smooth wheel→horizontal scroll with RAF (no jitter)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let animating = false;
    let targetScroll = el.scrollLeft;

    const smoothScroll = () => {
      const diff = targetScroll - el.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        el.scrollLeft = targetScroll;
        animating = false;
        return;
      }
      el.scrollLeft += diff * 0.12;
      requestAnimationFrame(smoothScroll);
    };

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        targetScroll = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, targetScroll + e.deltaY));
        if (!animating) {
          animating = true;
          requestAnimationFrame(smoothScroll);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  return (
    <div className="font-['Montserrat',sans-serif] text-[#111827] antialiased w-full min-h-screen" style={{ margin: 0, padding: 0 }}>
      <main>
        {/* BEGIN: HeroSection */}
        <section className="relative flex flex-col w-screen min-h-screen overflow-hidden hero-curved-bottom" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }} data-purpose="hero-fullscreen-layout">
          {/* Background Hero Image */}
          <div className="absolute inset-0 w-full h-full bg-gray-900" id="hero-carousel">
            {/* Slides */}
            {heroSlides.length > 0 ? heroSlides.map((slide, idx) => (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <img alt="ALMA Apparel" className="w-full h-full object-cover" src={slide} />
              </div>
            )) : (
              <div className="w-full h-full flex items-center justify-center bg-[#111827]">
                <span className="text-4xl font-black text-white/20">ALMA</span>
              </div>
            )}
            {/* Overlay for contrast ensuring text is readable */}
            <div className="absolute inset-0 bg-black/40 z-20"></div>
          </div>
          
          {/* Center Overlay Typography */}
          <div className="relative z-30 flex flex-col items-center justify-center w-full min-h-screen text-center px-6">
            <span className="bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full font-bold tracking-[0.2em] uppercase text-sm mb-6 shadow-xl inline-block border border-white/30">
              Official Merchandise
            </span>
            <h1 className="text-7xl md:text-[10rem] font-black leading-[0.9] tracking-tighter mb-6 text-white drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
              ALMA<br/><span className="text-[#FF6B00]">STORE</span>
            </h1>
            <p className="text-gray-100 text-lg md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed font-semibold drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
              Curated apparel for the modern engineer. Quality that speaks volumes, designs that define your campus journey.
            </p>
            <div>
              <a className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 text-base font-semibold hover:bg-white/30 transition-all duration-300 rounded-full no-underline" href="#events" style={{ textDecoration: 'none' }}>
                Shop Collection
              </a>
            </div>
          </div>
        </section>

        {/* BEGIN: Product Marquee Rows */}
        {(() => {
          const eventKeys = ['utsav', 'phaseshift', 'farouche'];
          const rows = eventKeys.map(key => {
            const products = PRODUCT_CATALOG[key] || [];
            const imgs = products.filter(p => p.imageUrl).map(p => ({ url: p.imageUrl, name: p.name }));
            // Shuffle
            const shuffled = [...imgs].sort(() => Math.random() - 0.5);
            // Double for seamless loop
            return [...shuffled, ...shuffled];
          });
          const directions = ['right', 'left', 'right'];

          return rows.some(r => r.length > 0) ? (
            <section className="marquee-section">
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className={`marquee-track marquee-track--${directions[rowIdx]}`}>
                  <div className="marquee-inner">
                    {row.map((item, i) => (
                      <div key={i} className="marquee-item">
                        <img src={item.url} alt={item.name} loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null;
        })()}

        {/* BEGIN: EventsSection */}
        <section className="py-24 bg-white overflow-hidden" id="events">
          <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold">Event Exclusives</h2>
              <p className="text-gray-500 mt-2">Limited edition gear for our biggest campus fests.</p>
            </div>
            <div className="flex space-x-2">
              <button 
                className="p-3 border border-gray-200 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center cursor-pointer" 
                onClick={scrollPrev}
                id="prevBtn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </button>
              <button 
                className="p-3 border border-gray-200 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center cursor-pointer" 
                onClick={scrollNext}
                id="nextBtn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </button>
            </div>
          </div>
          
          {/* Horizontal Scrolling Container */}
          <div className="flex overflow-x-auto no-scrollbar gap-8 px-6 md:px-[calc((100vw-1280px)/2+24px)] pb-8" id="eventScroll" ref={scrollContainerRef}>
            {EVENT_CARDS.map((ev) => {
              const images = eventImages[`event_images_${ev.key}`] || [];
              const src = images[0] || ev.fallbackUrl;
              return (
                <Link key={ev.key} to={ev.path} className="min-w-[300px] md:min-w-[450px] group cursor-pointer block" data-purpose="event-card">
                  <div className="relative h-[500px] overflow-hidden rounded-2xl">
                    <img alt={ev.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={src} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8">
                      <h3 className="text-white text-4xl font-black italic tracking-tighter mb-2">{ev.label}</h3>
                      <span className="bg-white text-[#111827] px-4 py-1 text-xs font-bold uppercase tracking-widest">{ev.status}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* BEGIN: AboutPreview */}
        <section className="py-24 bg-[#F9FAFB]" id="about">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#FF6B00] mb-6">Our Philosophy</h2>
            <p className="text-3xl md:text-4xl font-medium leading-tight">
              &quot;ALMA isn&apos;t just clothing; it&apos;s a badge of honor. We craft garments that reflect the excellence of our institution and the ambition of its students.&quot;
            </p>
            <div className="mt-12">
              <Link className="font-bold border-b-2 border-[#FF6B00] pb-1 hover:text-[#FF6B00] transition-colors" to="/about">Learn more about our sustainable sourcing</Link>
            </div>
          </div>
        </section>

      </main>
      
      {/* BEGIN: Footer */}
      <footer className="bg-[#111827] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-bold tracking-tighter">ALMA<span className="text-[#FF6B00]"> STORE</span></span>
            <p className="mt-6 text-gray-400 max-w-sm">The official campus store for BMS College of Engineering. Delivering premium quality apparel since 2026.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-white/80">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="/about">About Us</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="/shipping-policy">Shipping Policy</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="/returns-exchanges">Returns &amp; Exchanges</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="/size-chart">Size Guide</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-white/80">Connect</h4>
            <ul className="space-y-4 text-sm">
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="https://www.linkedin.com/in/souparno-chakraborty-ab932b351?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
          <p>ALMA 2026</p>
          <p>Handcrafted by Souparno Chakraborty</p>
        </div>
      </footer>
    </div>
  );
}
