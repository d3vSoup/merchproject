import React, { useState, useEffect } from 'react';

const quotes = [
  "ALMA isn't just clothing; it's a badge of honor. We craft garments that reflect the excellence of our institution and the ambition of its students.",
  "Rooted in tradition, inspired by the future. Every stitch in an ALMA garment is a commitment to quality and academic legacy.",
  "We believe that what you wear should be a testament to your hard work. Our collections are designed for the leaders of tomorrow."
];

export default function PhilosophyCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0); // To force re-render/animation

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000); // Auto-rotate every 5 seconds
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
    setFadeKey((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
    setFadeKey((prev) => prev + 1);
  };

  const setIndex = (index) => {
    setCurrentIndex(index);
    setFadeKey((prev) => prev + 1);
  };

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 md:px-12 lg:px-24" data-purpose="brand-philosophy-container" id="about">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="philosophy-title text-[#e67e22] text-xs md:text-sm font-bold uppercase tracking-[0.25em]">
          Our Philosophy
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center" data-purpose="quote-carousel">
        {/* Previous Button */}
        <button 
          aria-label="Previous Quote" 
          className="absolute left-0 z-10 p-2 text-gray-400 hover:text-black transition-colors focus:outline-none hidden md:block" 
          onClick={handlePrev}
        >
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Quote Content */}
        <div key={fadeKey} className="text-center px-4 md:px-16 animate-[fadeIn_0.5s_ease-in-out_forwards]" data-purpose="active-quote-text">
          <blockquote className="font-['Playfair_Display',serif] leading-[1.2] text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight">
            "{quotes[currentIndex]}"
          </blockquote>
        </div>

        {/* Next Button */}
        <button 
          aria-label="Next Quote" 
          className="absolute right-0 z-10 p-2 text-gray-400 hover:text-black transition-colors focus:outline-none hidden md:block" 
          onClick={handleNext}
        >
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex space-x-2 mt-12" data-purpose="carousel-pagination">
        {quotes.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${idx === currentIndex ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'}`}
            onClick={() => setIndex(idx)}
          />
        ))}
      </div>

      {/* Removed Sustainable Sourcing Link per request */}
    </section>
  );
}
