import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./Landing.css";

const APPAREL_SLIDES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjkZN_je4uu1T_yhTASUwwVZV649r8wrvyIyMCSsumUlC0OIrvXmsEzRGZlit8dh2aLKlKzHRZMfprzVwgxZVi7bkTF1DJfFmkjVTHJaBHARg2v8HvRQyr0ZxwXqS-dgVIiF-8fMdIrULfoJQB4mnHdr00Ajw8a6Yw3_ECj69_PHP5rBVuiFUQX7cJUruK2cjmvuhHtvM9Z2Fut8r1CPJ8wqdGZFZPhXul--80I-oJYvr6I4yi1yvaI9d_UZFKNo6s9cZIOEpHBLQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCrHUJdYGUVl0g3AW7PxOPK3fh6EnbRYA9rZ4dZ419DpFNaTxtX_MLvBk61G2uhQG5VBX4LIwNL_fBa6zu2GoNpc3Y1Hk861pxvw_jLDAKumQ7HUGX6QKVCgqQHV4rjtFBi3ADY4jzi2Q1WGj345xMkabC1kCbpr7XWIp7JWut2-ukF9JS3MGSvUTUdzUB-tn1Ez0xA6T5z_0Gx89JUyb5plIjrkHNEp5sGM33hz8NuCPtiDxOyXrLJGE-z17x_hWgOgj8KQ7UMyy8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDSmi3kt37Dn0ZNlBDVjUxxse2O1wB0DPtrB-fA0qCuW_L8SMDCmCcTng9ISsR8voIwkLVLb51HuK6ycd1HximGMnEiuD0ZYghuKw7e8azJSBjs_C0qRibFf6aM-6X1X4aOGOm17t9B462HGptZKpBnpWqnC-gNPklY4MjefbxYpSkwgVxyvZsKU8oRpva-cgcY7E4cviYClClLqeBgB7sV5_ASLjd74nmxICw3VlBlXqSBo7vzBXy1DLIgCxl6orQCc-OjdxTUZ5A",
];

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef(null);
  const [heroSlides, setHeroSlides] = useState(APPAREL_SLIDES);

  // Fetch dynamic hero images from Admin Overrides
  useEffect(() => {
    let mounted = true;
    const fetchHeroImages = async () => {
      try {
        const res = await api.get('/api/catalog/overrides');
        const overrides = res.data?.overrides || [];
        const heroConfig = overrides.find(o => o.tab_key === 'system' && o.product_id === 'hero_carousel');
        if (mounted && heroConfig && heroConfig.images && heroConfig.images.length > 0) {
          setHeroSlides(heroConfig.images);
        }
      } catch (e) {
        console.error("Failed to fetch custom hero images:", e);
      }
    };
    fetchHeroImages();
    return () => { mounted = false; };
  }, []);

  // Hero carousel slow fade logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides]);

  // Map vertical wheel scroll to horizontal scrolling for the Events container
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // If the scroll is strictly vertical, translate it to horizontal
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
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
    <div className="bg-[#F9FAFB] text-[#111827] font-sans antialiased w-full h-full min-h-screen">
      <main>
        {/* BEGIN: HeroSection */}
        <section className="relative min-h-screen flex flex-col md:flex-row items-center overflow-hidden" data-purpose="hero-split-layout">
          {/* Left Side: Shaped Image Container with Slow Fade */}
          <div className="w-full md:w-7/12 h-[50vh] md:h-screen relative hero-shape bg-gray-200" id="hero-carousel">
            {/* Slides */}
            {heroSlides.map((slide, idx) => (
              <div key={idx} className={`fade-layer ${idx === currentSlide ? 'active' : ''}`}>
                <img alt="BMSCE Apparel" className="w-full h-full object-cover" src={slide} />
              </div>
            ))}
            {/* Overlay for contrast if needed */}
            <div className="absolute inset-0 bg-black/5"></div>
          </div>
          
          {/* Right Side: Clean Typography */}
          <div className="w-full md:w-5/12 px-8 md:px-16 py-12 md:py-0 flex flex-col justify-center">
            <span className="text-[#FF6B00] font-bold tracking-[0.2em] uppercase text-xs mb-4">Official Merchandise</span>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
              BMSCE <br/> MERCH
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-md mb-10 leading-relaxed">
              Curated apparel for the modern engineer. Quality that speaks volumes, designs that define your campus journey.
            </p>
            <div>
              <a className="inline-block bg-[#111827] text-white px-10 py-4 font-semibold hover:bg-[#FF6B00] transition-all duration-300" href="#events">
                Shop Collection
              </a>
            </div>
          </div>
        </section>

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
            
            {/* Event Card: UTSAV */}
            <Link to="/event/utsav" className="min-w-[300px] md:min-w-[450px] group cursor-pointer block" data-purpose="event-card">
              <div className="relative h-[500px] overflow-hidden rounded-2xl">
                <img alt="UTSAV Fest" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAbHf2uBARGIwI4XQ5-uax3Hn3OPf2GKnmgCp2c7sLFyXy5h5L2W1I69oMrneuBIfJXh2jOgSbUAsFb9vB1CtvoyvavaaML46uYVqRLOtUFuLrVifB9v19tDHafF4_LdUJIa6rB-EDTZDr9NV1EWnKF6Jrni7ibSwP28MMDBj2ACvosUMyLz1leKy_NgGou3Ge6xS6FXu75hwfXtLdjlOxZWXvC039LJMOkdOvG0sPvpPZxK2sOE3Y__4ViuDDVF3a8SJ61lMzz2E"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-4xl font-black italic tracking-tighter mb-2">UTSAV</h3>
                  <span className="bg-white text-[#111827] px-4 py-1 text-xs font-bold uppercase tracking-widest">Available Now</span>
                </div>
              </div>
            </Link>

            {/* Event Card: PHASESHIFT */}
            <Link to="/event/phaseshift" className="min-w-[300px] md:min-w-[450px] group cursor-pointer block" data-purpose="event-card">
              <div className="relative h-[500px] overflow-hidden rounded-2xl">
                <img alt="PHASESHIFT Tech Fest" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7rnhqigfkCw3UmfvS4OKGxj4CXqhEpzUq_Y3Pe25B8FZJyEK3RvGOuLIS3i9OdgDj1SyW5ApWtor4QUkoElcjkYWqw5H7ErPUAyMOPSbzyxiixH0vTrZTgIIEfnidmoOQ-UBfqh_YpdbIDsA2Nyni6iQzFHwdgylDzrbGq14AkM9n65qVRWU7GqvPkb3rTUtGyuFbqoAq6VhdDxKjxeKgRWOapyX2vnaqQpeuGX6EIv6QbyiLIQGUfjZFpo4J_e82IzpyFWGiXew"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-4xl font-black italic tracking-tighter mb-2">PHASESHIFT</h3>
                  <span className="bg-white text-[#111827] px-4 py-1 text-xs font-bold uppercase tracking-widest">Coming Soon</span>
                </div>
              </div>
            </Link>

            {/* Event Card: FAROUCHE */}
            <Link to="/event/farouche" className="min-w-[300px] md:min-w-[450px] group cursor-pointer block" data-purpose="event-card">
              <div className="relative h-[500px] overflow-hidden rounded-2xl">
                <img alt="FAROUCHE Fashion" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0v1pAdAlddIsSbD-o0AIoR1d_BN2hJQMhdDtkU4slZsXaTjC4JunqL4kFSnu_OTqeExw1oEUZTWl-H6-VWNUG2j0ZdkSxDZNuEk7m6hRk3gdNCdUgcADg3Uinww5jz-XmTzz5YBQD3CLThnMTPnDLYyRbNjtjgdkL9IyC9UZqVq0vzz0XBGaHa51TfWv6JUKVRXKKTrXJwvCU6_Ta_Gq33puBbuDzZDJ-f1kCNQ7ZrUOOOsMiGDWPl0qx4tZjrvr5VoWuE8dcbCg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-4xl font-black italic tracking-tighter mb-2">FAROUCHE</h3>
                  <span className="bg-white text-[#111827] px-4 py-1 text-xs font-bold uppercase tracking-widest">Archive</span>
                </div>
              </div>
            </Link>

            {/* Event Card: CLUBS */}
            <Link to="/event/club" className="min-w-[300px] md:min-w-[450px] group cursor-pointer block" data-purpose="event-card">
              <div className="relative h-[500px] overflow-hidden rounded-2xl">
                <img alt="Clubs & Depts" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-4xl font-black italic tracking-tighter mb-2">CLUBS</h3>
                  <span className="bg-white text-[#111827] px-4 py-1 text-xs font-bold uppercase tracking-widest">Ongoing</span>
                </div>
              </div>
            </Link>
            
          </div>
        </section>

        {/* BEGIN: AboutPreview */}
        <section className="py-24 bg-[#F9FAFB]" id="about">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#FF6B00] mb-6">Our Philosophy</h2>
            <p className="text-3xl md:text-4xl font-medium leading-tight">
              &quot;BMSCE Merch isn&apos;t just clothing; it&apos;s a badge of honor. We craft garments that reflect the excellence of our institution and the ambition of its students.&quot;
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
            <span className="text-2xl font-bold tracking-tighter">BMSCE<span className="text-[#FF6B00]">MERCH</span></span>
            <p className="mt-6 text-gray-400 max-w-sm">The official store for BMS College of Engineering. Delivering premium quality apparel since 2023.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-white/80">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="#">Shipping Policy</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="#">Returns &amp; Exchanges</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="#">Size Guide</Link></li>
              <li><Link className="text-white hover:text-[#FF6B00] transition-colors" to="#">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-white/80">Connect</h4>
            <ul className="space-y-4 text-sm">
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="#">Instagram</a></li>
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="#">LinkedIn</a></li>
              <li><a className="text-white hover:text-[#FF6B00] transition-colors" href="#">Twitter</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
          <p>© 2023 BMSCE Merch. All rights reserved.</p>
          <p>Handcrafted by Design Students</p>
        </div>
      </footer>
    </div>
  );
}
