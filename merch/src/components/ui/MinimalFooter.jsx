import React from 'react';
import { Link } from 'react-router-dom';
import {
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  MailIcon,
} from 'lucide-react';

export default function MinimalFooter() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { title: 'About Us', href: '/about' },
    { title: 'Size Guide', href: '/size-chart' },
    { title: 'Shipping Policy', href: '/shipping-policy' },
    { title: 'Returns & Exchanges', href: '/returns-exchanges' },
    { title: 'Terms & Conditions', href: '/use-of-our-website' },
  ];

  const resources = [
    { title: 'Contact Us', href: '/contact' },
    { title: 'Cart', href: '/cart' },
    { title: 'Wishlist', href: '/wishlist' },
    { title: 'My Orders', href: '/orders' },
    { title: 'Revault – Resell', href: '/resell' },
  ];

  const socialLinks = [
    {
      icon: <InstagramIcon size={16} />,
      link: 'https://www.instagram.com',
      label: 'Instagram',
    },
    {
      icon: <LinkedinIcon size={16} />,
      link: 'https://www.linkedin.com/in/souparno-chakraborty-ab932b351',
      label: 'LinkedIn',
    },
    {
      icon: <TwitterIcon size={16} />,
      link: 'https://twitter.com',
      label: 'Twitter',
    },
    {
      icon: <MailIcon size={16} />,
      link: '/contact',
      label: 'Contact',
      isInternal: true,
    },
  ];

  return (
    <footer className="alma-footer">
      <div className="alma-footer__divider" />
      <div className="alma-footer__inner">
        <div className="alma-footer__grid">
          {/* Brand Column */}
          <div className="alma-footer__brand-col">
            <Link to="/" className="alma-footer__logo">
              <img
                src="/assets/star-logo.jpeg"
                alt="ALMA"
                className="alma-footer__logo-img"
              />
              <span className="alma-footer__logo-text">
                ALMA<span className="alma-footer__logo-accent"> STORE</span>
              </span>
            </Link>
            <p className="alma-footer__tagline">
              The official campus store for BMS College of Engineering. Curated
              apparel for the modern engineer.
            </p>
            <div className="alma-footer__socials">
              {socialLinks.map((item, i) =>
                item.isInternal ? (
                  <Link
                    key={i}
                    to={item.link}
                    className="alma-footer__social-btn"
                    aria-label={item.label}
                  >
                    {item.icon}
                  </Link>
                ) : (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alma-footer__social-btn"
                    aria-label={item.label}
                  >
                    {item.icon}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="alma-footer__links-col">
            <span className="alma-footer__links-heading">Quick Links</span>
            <div className="alma-footer__links-list">
              {quickLinks.map(({ href, title }, i) => (
                <Link key={i} to={href} className="alma-footer__link">
                  {title}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="alma-footer__links-col">
            <span className="alma-footer__links-heading">Resources</span>
            <div className="alma-footer__links-list">
              {resources.map(({ href, title }, i) => (
                <Link key={i} to={href} className="alma-footer__link">
                  {title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="alma-footer__bottom">
          <p className="alma-footer__copyright">
            © ALMA {year}. All rights reserved.
          </p>
          <p className="alma-footer__credit">
            Handcrafted by{' '}
            <a
              href="https://www.linkedin.com/in/souparno-chakraborty-ab932b351"
              target="_blank"
              rel="noopener noreferrer"
            >
              Souparno Chakraborty
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
