import React, { useState, useEffect } from 'react';
import './FlipClock.css';

export default function FlipClock({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const CountdownUnit = ({ value, label }) => {
    const displayValue = String(value).padStart(2, '0');
    
    return (
      <div className="countdown-unit">
        <div className="countdown-value">{displayValue}</div>
        <div className="countdown-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="countdown-clock">
      <CountdownUnit value={timeLeft.days} label="DAYS" />
      <div className="countdown-separator">:</div>
      <CountdownUnit value={timeLeft.hours} label="HOURS" />
      <div className="countdown-separator">:</div>
      <CountdownUnit value={timeLeft.minutes} label="MINUTES" />
      <div className="countdown-separator">:</div>
      <CountdownUnit value={timeLeft.seconds} label="SECONDS" />
    </div>
  );
}
