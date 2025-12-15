// src/components/Layout.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleSignIn from "./GoogleSignIn";
import ProfileModal from "./ProfileModal";
import ProfileCompletionPopup from "./ProfileCompletionPopup";
import previewUtsav from "../assets/preview-utsav.svg";
import previewPhaseshift from "../assets/preview-phaseshift.svg";
import previewFarouche from "../assets/preview-farouche.svg";
import previewClub from "../assets/preview-club.svg";
import { getUserIdByEmail, getCart } from "../supabase/client";
import { PRODUCT_CATALOG } from "../data/products";
import api from "../api";
import toast from "react-hot-toast";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const TABS = [
  {
    key: "utsav",
    label: "Utsav",
    preview: { src: previewUtsav, caption: "For the Annual Utsav Merch" },
    path: "/event/utsav",
  },
  {
    key: "phaseshift",
    label: "Phaseshift",
    preview: { src: previewPhaseshift, caption: "Tech fest limited drops" },
    path: "/event/phaseshift",
  },
  {
    key: "farouche",
    label: "Farouche",
    preview: { src: previewFarouche, caption: "Hostelites Unite" },
    path: "/event/farouche",
  },
  {
    key: "club",
    label: "Club & Dept Merch",
    preview: { src: previewClub, caption: "Society merchandise & kits" },
    path: "/event/club",
  },
  { 
    key: "resell", 
    label: "Resell", 
    preview: null,
    path: "/resell",
  },
];

export default function Layout({ children, cartCount = 0 }) {
  const { user, signout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isAdmin = user?.email === "souparno.cs24@bmsce.ac.in";
  const profilePercent = user?.profilePercent || 0;
  const avatarUrl = user?.pfpUrl || (user?.email ? `https://unavatar.io/${encodeURIComponent(user.email)}` : null);

  // Fetch wishlist count
  useEffect(() => {
    async function fetchWishlistCount() {
      if (!user) {
        setWishlistCount(0);
        return;
      }
      try {
        const res = await api.get('/api/wishlist');
        const items = res.data?.items || res.data || [];
        setWishlistCount(Array.isArray(items) ? items.length : 0);
      } catch (err) {
        // Wishlist table might not exist yet - silently ignore
        console.warn('Failed to fetch wishlist:', err.message);
        setWishlistCount(0);
      }
    }
    fetchWishlistCount();
  }, [user, location.pathname]); // Refresh when navigating

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleGoogleSuccess = async (userData) => {
    setAccountOpen(false);
    // Profile modal will be handled by AuthContext
  };

  function searchProducts(query) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const results = [];
    const eventLabels = { utsav: "Utsav", phaseshift: "Phaseshift", farouche: "Farouche", club: "Club & Dept Merch" };

    // Search through all products
    Object.entries(PRODUCT_CATALOG).forEach(([tabKey, products]) => {
      products.forEach(product => {
        const nameMatch = product.name.toLowerCase().includes(q);
        const descMatch = product.description?.toLowerCase().includes(q);
        const eventMatch = eventLabels[tabKey]?.toLowerCase().includes(q);
        const typeMatch = product.previewLabel?.toLowerCase().includes(q) || 
                         product.id.toLowerCase().includes(q);
        
        if (nameMatch || descMatch || eventMatch || typeMatch) {
          results.push({
            ...product,
            tabKey,
            eventLabel: eventLabels[tabKey],
            matchType: nameMatch ? 'name' : descMatch ? 'description' : eventMatch ? 'event' : 'type'
          });
        }
      });
    });

    setSearchResults(results);
  }

  useEffect(() => {
    if (searchOpen && searchQuery) {
      searchProducts(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchOpen]);

  function handleSearchResultClick(result) {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/event/${result.tabKey}`);
  }

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/event/")) {
      return path.split("/event/")[1];
    }
    if (path === "/resell") return "resell";
    if (path === "/admin") return "admin";
    if (path === "/cart") return "cart";
    if (path === "/wishlist") return "wishlist";
    return null;
  };

  const activeTab = getActiveTab();

  return (
    <div className={`app-root theme-${activeTab || "default"}`}>
      <header className="topbar">
        {/* Mobile Hamburger Menu Button - Only visible on phones */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Mobile Menu Dropdown - Only visible on phones when open */}
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown" ref={mobileMenuRef}>
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                to={tab.path}
                className={`mobile-menu-item ${activeTab === tab.key ? "mobile-menu-item--active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop Tabs - Hidden on phones */}
        <nav className="tabs-row desktop-tabs">
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className="tab-wrapper"
              onMouseEnter={() => setHoveredTab(tab.key)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <Link
                to={tab.path}
                className={`tab ${activeTab === tab.key ? "tab--active" : ""}`}
              >
                {tab.label}
              </Link>
              {tab.preview && hoveredTab === tab.key && (
                <div className="tab-preview">
                  <div className="preview-img">
                    <img src={tab.preview.src} alt={tab.preview.caption} />
                  </div>
                  <p className="preview-caption">{tab.preview.caption}</p>
                </div>
              )}
            </div>
          ))}
        </nav>

        <Link to="/" className="brand">
          BMSCE Merchandise
        </Link>

        <div className="top-actions">
            <button
              className="icon-btn"
              title="Search"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              🔍
            </button>

            <Link
              to="/wishlist"
              className="icon-btn wishlist-header-btn"
              title="Wishlist"
              aria-label="Wishlist"
            >
              ♥
              {wishlistCount > 0 && (
                <span className="wishlist-badge" aria-label={`${wishlistCount} items in wishlist`}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="icon-btn cart-btn"
              title="Cart"
              aria-label="Cart"
            >
              🛒
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="account" ref={accountRef}>
              <button
                className="account-avatar"
                aria-haspopup="true"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
                title="Account"
                style={avatarUrl ? {
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              />
              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  {!user ? (
                    <div className="signin-section">
                      <div className="signin-header">
                        <h3>Welcome</h3>
                        <p>Sign in to access your cart and orders</p>
                      </div>
                      <GoogleSignIn onSuccess={handleGoogleSuccess} />
                      <div className="signin-note">
                        <span>Use your BMSCE Google account:</span>
                        <ul>
                          <li>@bmsce.ac.in</li>
                          <li>@bmsca.org</li>
                          <li>@bmscl.ac.in</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-section">
                      <div className="profile-header">
                        <img
                          src={avatarUrl}
                          alt="avatar"
                          className="profile-avatar"
                        />
                        <div className="profile-info">
                          <div className="profile-name">{user.name || user.email.split('@')[0]}</div>
                          <div className="profile-email">{user.email}</div>
                          <div className="profile-completion">
                            <div className="completion-bar">
                              <div 
                                className="completion-fill" 
                                style={{ width: `${profilePercent}%` }}
                              />
                            </div>
                            <span className="completion-text">Profile {profilePercent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="profile-actions">
                        <button className="btn btn--primary" onClick={() => { 
                          setAccountOpen(false);
                          setMobileMenuOpen(false); // Also close mobile menu if open
                          setProfileOpen(true); 
                        }}>
                          Edit Profile
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={() => {
                            signout();
                            setAccountOpen(false);
                          }}
                        >
                          Sign Out
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="admin-panel-section">
                          <div className="admin-panel-label">Admin Panel</div>
                          <div className="admin-panel-buttons">
                            <Link
                              to="/admin/orders"
                              className="btn btn--ghost btn--admin"
                              onClick={() => setAccountOpen(false)}
                            >
                              📦 Manage Orders
                            </Link>
                            <Link
                              to="/admin/items"
                              className="btn btn--ghost btn--admin"
                              onClick={() => setAccountOpen(false)}
                            >
                              🛍️ Manage Items
                            </Link>
                          </div>
                        </div>
                      )}

                      <div className="profile-status">
                        {profilePercent >= 100 ? (
                          <span className="status-enabled">✓ Resell enabled</span>
                        ) : (
                          <span className="status-info">
                            Complete your profile (USN, Name, Semester) to use Resell.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      {searchOpen && (
        <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-header">
              <input
                type="text"
                placeholder="Search products, events, clubs, departments..."
                autoFocus
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>✕</button>
            </div>
            <div className="search-body">
              {searchQuery && (
                <>
                  <div className="search-results-header">
                    {searchResults.length > 0 ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}` : 'No results found'}
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="search-results-list">
                      {searchResults.map((result, idx) => (
                        <div
                          key={`${result.tabKey}-${result.id}-${idx}`}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(result)}
                        >
                          <div
                            className="search-result-preview"
                            style={{
                              background: result.imageUrl
                                ? `url(${result.imageUrl}) center/cover`
                                : `linear-gradient(135deg, ${result.swatch[0]}, ${result.swatch[1]})`
                            }}
                          >
                            {!result.imageUrl && <span>{result.previewLabel || result.name}</span>}
                          </div>
                          <div className="search-result-info">
                            <div className="search-result-name">{result.name}</div>
                            <div className="search-result-meta">{result.eventLabel} • {formatPrice(result.price)}</div>
                            <div className="search-result-desc">{result.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-no-results">
                      <p>Try searching for product names, events (Utsav, Phaseshift, Farouche), or clubs</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <ProfileCompletionPopup onOpenProfile={() => setProfileOpen(true)} />
    </div>
  );
}
