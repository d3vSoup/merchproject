// src/components/CartFly.jsx — Fly-to-cart animation using position:fixed + transform
import React, { useCallback } from 'react';
import { prefersReducedMotion } from '../lib/motion';

let flyCounter = 0;

/**
 * Trigger a fly-to-cart animation from a source element to the cart icon.
 * Call this imperatively after add-to-cart succeeds.
 *
 * @param {HTMLElement|DOMRect} sourceEl - The product card/image element (or its rect)
 * @param {string} [bgStyle] - CSS background value for the flying clone
 */
export function triggerCartFly(sourceEl, bgStyle) {
  if (prefersReducedMotion()) {
    bumpCartBadge();
    return;
  }

  const sourceRect = sourceEl instanceof DOMRect ? sourceEl : sourceEl?.getBoundingClientRect?.();
  if (!sourceRect) { bumpCartBadge(); return; }

  const cartBtn = document.querySelector('.cart-btn');
  if (!cartBtn) { bumpCartBadge(); return; }
  const targetRect = cartBtn.getBoundingClientRect();

  const flyId = `cart-fly-${++flyCounter}`;
  const el = document.createElement('div');
  el.id = flyId;
  el.className = 'cart-fly-image';
  el.setAttribute('aria-hidden', 'true');

  const size = Math.min(sourceRect.width, sourceRect.height, 80);
  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${sourceRect.left + sourceRect.width / 2 - size / 2}px`,
    top: `${sourceRect.top + sourceRect.height / 2 - size / 2}px`,
    background: bgStyle || 'var(--c-primary, #ff6600)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  });

  document.body.appendChild(el);

  const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  const anim = el.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.3 - 40}px) scale(0.6)`, opacity: 0.9, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0 },
  ], {
    duration: 550,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    fill: 'forwards',
  });

  anim.onfinish = () => {
    el.remove();
    bumpCartBadge();
  };

  anim.oncancel = () => el.remove();
}

function bumpCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}

/**
 * React hook returning a triggerFly callback.
 * Usage: const fly = useCartFly(); ... fly(previewRef.current, bgStyle)
 */
export function useCartFly() {
  return useCallback((sourceEl, bgStyle) => {
    triggerCartFly(sourceEl, bgStyle);
  }, []);
}

export default function CartFly() {
  return null;
}
