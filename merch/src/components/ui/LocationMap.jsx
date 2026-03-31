import React, { useState, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion';

export default function LocationMap({
  location = 'BMS College of Engineering',
  coordinates = '12.9411° N, 77.5659° E',
  mapsUrl,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-50, 50], [8, -8]);
  const rotateY = useTransform(mouseX, [-50, 50], [-8, 8]);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleClick = () => {
    if (isExpanded && mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={`location-map-container ${className}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <motion.div
        className="location-map-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          width: isExpanded ? '100%' : '100%',
          maxWidth: isExpanded ? 360 : 240,
          height: isExpanded ? 280 : 140,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 35,
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)',
          }}
        />

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.03)',
                }}
              />

              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                preserveAspectRatio="none"
              >
                {/* Main roads */}
                <motion.line
                  x1="0%" y1="35%" x2="100%" y2="35%"
                  stroke="rgba(255,255,255,0.15)" strokeWidth="4"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
                <motion.line
                  x1="0%" y1="65%" x2="100%" y2="65%"
                  stroke="rgba(255,255,255,0.15)" strokeWidth="4"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
                <motion.line
                  x1="30%" y1="0%" x2="30%" y2="100%"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
                <motion.line
                  x1="70%" y1="0%" x2="70%" y2="100%"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />

                {/* Secondary streets */}
                {[20, 50, 80].map((y, i) => (
                  <motion.line
                    key={`h-${i}`}
                    x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                  />
                ))}
                {[15, 45, 55, 85].map((x, i) => (
                  <motion.line
                    key={`v-${i}`}
                    x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                  />
                ))}
              </svg>

              {/* Buildings */}
              {[
                { top: '40%', left: '10%', w: '15%', h: '20%', delay: 0.5 },
                { top: '15%', left: '35%', w: '12%', h: '15%', delay: 0.6 },
                { top: '70%', left: '75%', w: '18%', h: '18%', delay: 0.7 },
                { top: '20%', right: '10%', w: '10%', h: '25%', delay: 0.55 },
                { top: '55%', left: '5%', w: '8%', h: '12%', delay: 0.65 },
                { top: '8%', left: '75%', w: '14%', h: '10%', delay: 0.75 },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: b.top,
                    left: b.left,
                    right: b.right,
                    width: b.w,
                    height: b.h,
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: b.delay }}
                />
              ))}

              {/* Map pin */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: 0.3,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255, 102, 0, 0.5))' }}
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="#ff6600"
                  />
                  <circle cx="12" cy="9" r="2.5" fill="#0a0a0a" />
                </svg>
              </motion.div>

              {/* Bottom gradient fade */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 40%)',
                  opacity: 0.6,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid pattern (collapsed) */}
        <motion.div
          style={{ position: 'absolute', inset: 0, opacity: 0.04 }}
          animate={{ opacity: isExpanded ? 0 : 0.04 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
          >
            <defs>
              <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
          </svg>
        </motion.div>

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
          }}
        >
          {/* Top */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <motion.div
              animate={{ opacity: isExpanded ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6600"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
            </motion.div>

            {/* Status */}
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ff6600',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Live
              </span>
            </motion.div>
          </div>

          {/* Bottom */}
          <div>
            <motion.h3
              style={{
                color: '#fff',
                fontWeight: 500,
                fontSize: '14px',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {location}
            </motion.h3>

            <AnimatePresence>
              {isExpanded && (
                <motion.p
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '12px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    margin: '4px 0 0',
                  }}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {coordinates}
                </motion.p>
              )}
            </AnimatePresence>

            {isExpanded && mapsUrl && (
              <motion.p
                style={{
                  color: '#ff6600',
                  fontSize: '11px',
                  fontWeight: 600,
                  margin: '6px 0 0',
                  letterSpacing: '0.03em',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                Click again to open in Maps →
              </motion.p>
            )}

            {/* Underline */}
            <motion.div
              style={{
                height: '1px',
                marginTop: '8px',
                background:
                  'linear-gradient(to right, rgba(255,102,0,0.5), rgba(255,102,0,0.3), transparent)',
                transformOrigin: 'left',
              }}
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: isHovered || isExpanded ? 1 : 0.3,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Click hint */}
      <motion.p
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered && !isExpanded ? 1 : 0,
          y: isHovered ? 0 : 4,
        }}
        transition={{ duration: 0.2 }}
      >
        Click to expand
      </motion.p>
    </motion.div>
  );
}
