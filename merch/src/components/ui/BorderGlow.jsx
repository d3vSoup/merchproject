import React, { useRef, useState } from 'react';
import './BorderGlow.css';

export default function BorderGlow({
  children,
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "transparent",
  borderRadius = 16,
  glowRadius = 150,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    // Check if near edge
    const dx = Math.min(e.clientX - rect.left, rect.width - (e.clientX - rect.left));
    const dy = Math.min(e.clientY - rect.top, rect.height - (e.clientY - rect.top));
    
    if (dx < edgeSensitivity || dy < edgeSensitivity) {
      setOpacity(glowIntensity);
    } else {
      setOpacity(glowIntensity * 0.6);
    }
  };

  const handleMouseEnter = () => setOpacity(glowIntensity);
  const handleMouseLeave = () => setOpacity(0);

  // If colors array provided, use main colors
  const colorStops = colors?.length > 0 
    ? `${colors[0]}, ${colors.length > 1 ? colors[1] : 'transparent'}`
    : `rgb(${glowColor}), transparent`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`border-glow-container ${className} ${animated ? 'border-glow-animated' : ''}`}
      style={{
        '--bg': backgroundColor,
        '--br': borderRadius + 'px',
        ...style
      }}
    >
      <div
        className="border-glow-spotlight"
        style={{
          opacity,
          background: `radial-gradient(${glowRadius}px circle at ${position.x}px ${position.y}px, ${colorStops}, transparent)`,
        }}
      />
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
}
