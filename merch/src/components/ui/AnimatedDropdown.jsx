// src/components/ui/AnimatedDropdown.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import "./AnimatedDropdown.css";

/**
 * Animated custom dropdown — replaces native <select>.
 * 
 * Props:
 *   options  — [{ value, label }]
 *   value    — currently selected value
 *   onChange — (value) => void
 *   label    — optional label text shown before trigger
 *   id       — optional id for accessibility
 */
export default function AnimatedDropdown({ options = [], value, onChange, label, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180); // match exit animation duration
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      setIsOpen(true);
    }
  }, [isOpen, close]);

  const select = useCallback(
    (optionValue) => {
      onChange(optionValue);
      close();
    },
    [onChange, close]
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  return (
    <div className="animated-dropdown" ref={containerRef}>
      {label && (
        <span className="animated-dropdown__label">{label}</span>
      )}
      <button
        type="button"
        className={`animated-dropdown__trigger ${isOpen ? "is-open" : ""}`}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        <span>{selectedOption?.label || "Select…"}</span>
        <span className="animated-dropdown__chevron">▾</span>
      </button>

      {isOpen && (
        <div
          className={`animated-dropdown__menu ${isClosing ? "is-closing" : ""}`}
          role="listbox"
          aria-activedescendant={value}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`animated-dropdown__option ${opt.value === value ? "is-selected" : ""}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => select(opt.value)}
            >
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
