// src/components/Layout.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleSignIn from "./GoogleSignIn";
import GradientText from "./ui/GradientText";
import ProfileModal from "./ProfileModal";
import ProfileCompletionPopup from "./ProfileCompletionPopup";
import GlassToggle from "./GlassToggle";
import VariableProximity from "./ui/VariableProximity";
import DottedSurface from "./ui/DottedSurface";
import MinimalFooter from "./ui/MinimalFooter";
import { getUserIdByEmail, getCart } from "../supabase/client";
import { PRODUCT_CATALOG, BASE_PRODUCT_IDS } from "../data/products";
import api from "../api";
import toast from "react-hot-toast";

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

const TABS = [
  { key: "utsav", label: "Utsav", catalogKey: "utsav", path: "/event/utsav" },
  { key: "phaseshift", label: "Phaseshift", catalogKey: "phaseshift", path: "/event/phaseshift" },
  { key: "farouche", label: "Farouche", catalogKey: "farouche", path: "/event/farouche" },
  { key: "club", label: "Club & Dept Merch", catalogKey: "club", path: "/event/club" },
  { key: "resell", label: "Revault - Resell", catalogKey: null, path: "/resell" },
];

const overrideCache = {};
let prefetchStarted = false;

function mergeOverrides(catalogKey, overridesData) {
  const base = PRODUCT_CATALOG[catalogKey] || [];
  const overrideList = overridesData || [];
  const map = {};
  overrideList.forEach(o => { map[o.product_id] = o; });
  const hiddenIds = new Set(overrideList.filter(o => o.hidden === true || o.hidden === 'true').map(o => o.product_id));
  const mergedBase = base
    .filter(p => !hiddenIds.has(p.id))
    .map(p => {
      const ov = map[p.id];
      if (!ov) return p;
      return {
        ...p,
        ...(ov.name ? { name: ov.name } : {}),
        ...(ov.image_url ? { imageUrl: ov.image_url } : {}),
        ...(ov.price != null ? { price: Number(ov.price) } : {}),
      };
    });
  const customProducts = overrideList
    .filter(o => !BASE_PRODUCT_IDS.includes(o.product_id) && !(o.hidden === true || o.hidden === 'true'))
    .map(o => ({
      id: o.product_id,
      name: o.name || 'Custom Item',
      price: o.price != null ? Number(o.price) : 0,
      imageUrl: o.image_url || null,
      previewLabel: (o.name || 'Custom').slice(0, 12),
      swatch: ['#6b7280', '#9ca3af']
    }));
  return [...mergedBase, ...customProducts];
}

function prefetchAllOverrides() {
  if (prefetchStarted) return;
  prefetchStarted = true;
  const keys = ["utsav", "phaseshift", "farouche", "club"];
  keys.forEach(key => {
    if (overrideCache[key]) return;
    api.get('/api/catalog/overrides', { params: { tabKey: key } })
      .then(res => {
        overrideCache[key] = mergeOverrides(key, res.data?.overrides);
        const urls = overrideCache[key]
          .filter(p => p.imageUrl)
          .map(p => p.imageUrl);
        urls.forEach(url => { const img = new Image(); img.src = url; });
      })
      .catch(() => {});
  });
}

function TabPreview({ catalogKey }) {
  const base = catalogKey ? PRODUCT_CATALOG[catalogKey] : [];
  const [products, setProducts] = useState(() => overrideCache[catalogKey] || base);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!catalogKey) return;
    if (overrideCache[catalogKey]) {
      setProducts(overrideCache[catalogKey]);
      return;
    }
    const poll = setInterval(() => {
      if (overrideCache[catalogKey]) {
        setProducts(overrideCache[catalogKey]);
        clearInterval(poll);
      }
    }, 200);
    return () => clearInterval(poll);
  }, [catalogKey]);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % products.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(timer);
  }, [products.length]);

  if (!products.length) return null;
  const p = products[idx];
  const bg = p.imageUrl
    ? `url(${p.imageUrl}) center/cover no-repeat`
    : `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`;

  return (
    <div className="tab-preview-inner">
      <div className={`tab-preview-slide ${fade ? "tab-preview-slide--visible" : ""}`}>
        <div className="tab-preview-img" style={{ background: bg }}>
          {!p.imageUrl && <span className="tab-preview-label">{p.previewLabel}</span>}
        </div>
      </div>
      <div className="tab-preview-info">
        <span className="tab-preview-name">{p.name}</span>
        <span className="tab-preview-price">{formatPrice(p.price)}</span>
      </div>
      <div className="tab-preview-dots">
        {products.slice(0, 7).map((_, i) => (
          <span key={i} className={`tab-preview-dot ${i === idx % 7 ? "tab-preview-dot--active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

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
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = !!user?.isAdmin;
  const profilePercent = user?.profilePercent || 0;
  const avatarUrl = user?.pfpUrl || null;
  const avatarLetter = user?.email ? user.email.charAt(0).toUpperCase() : null;

  useEffect(() => { prefetchAllOverrides(); }, []);

  const fetchWishlistCount = React.useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }
    try {
      const res = await api.get('/api/wishlist');
      const items = res.data?.items || res.data || [];
      setWishlistCount(Array.isArray(items) ? items.length : 0);
    } catch (err) {
      console.warn('Failed to fetch wishlist:', err.message);
      setWishlistCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlistCount();
  }, [fetchWishlistCount, location.pathname]);

  useEffect(() => {
    const handler = () => fetchWishlistCount();
    window.addEventListener('wishlist-update', handler);
    return () => window.removeEventListener('wishlist-update', handler);
  }, [fetchWishlistCount]);

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
  const topbarRef = useRef(null);

  return (
    <div className={`app-root theme-${activeTab || "default"}`}>
      <DottedSurface />
      <header ref={topbarRef} className={`topbar${scrolled ? ' topbar--scrolled' : ''}`}>
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
            <Link
              to="/"
              className={`mobile-menu-item ${location.pathname === "/" ? "mobile-menu-item--active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                to={tab.path}
                className={`mobile-menu-item ${activeTab === tab.key ? "mobile-menu-item--active" : ""}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
              >
                {(tab.catalogKey || tab.key === "resell") ? (
                  <GradientText colors={["#1a1a1a", "#6b7280", "#9ca3af"]} animationSpeed={8} showBorder={false} className="gradient-text--tab">
                    {tab.label}
                  </GradientText>
                ) : (
                  tab.label
                )}
              </Link>
            ))}
            <div className="mobile-menu-divider" />
            <Link
              to="/size-chart"
              className={`mobile-menu-item ${location.pathname === "/size-chart" ? "mobile-menu-item--active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Size Chart
            </Link>
            <Link
              to="/use-of-our-website"
              className={`mobile-menu-item ${location.pathname === "/use-of-our-website" ? "mobile-menu-item--active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              T&amp;C
            </Link>
            <Link
              to="/about"
              className={`mobile-menu-item ${location.pathname === "/about" ? "mobile-menu-item--active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
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
                {(tab.catalogKey || tab.key === "resell") ? (
                  <GradientText colors={["#1a1a1a", "#6b7280", "#9ca3af"]} animationSpeed={8} showBorder={false} className="gradient-text--tab">
                    {tab.label}
                  </GradientText>
                ) : (
                  tab.label
                )}
              </Link>
              {tab.catalogKey && hoveredTab === tab.key && (
                <div className="tab-preview">
                  <TabPreview catalogKey={tab.catalogKey} />
                </div>
              )}
            </div>
          ))}
        </nav>

        <Link to="/" className="brand" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/assets/star-logo.jpeg" alt="Star Logo" style={{ height: '44px', width: 'auto', mixBlendMode: 'multiply' }} />
          <VariableProximity
            label="ALMA"
            className="brand-variable"
            fromFontVariationSettings="'wght' 700, 'opsz' 14"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={topbarRef}
            radius={120}
            falloff="linear"
          />
        </Link>

        <div className="top-actions">
            <button
              className="icon-btn"
              title="Search"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>

            <GlassToggle />

            <Link
              to="/wishlist"
              className="icon-btn wishlist-header-btn"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <div className="account" ref={accountRef}>
              <button
                className={`account-avatar${!avatarUrl && avatarLetter ? ' account-avatar--letter' : ''}`}
                aria-haspopup="true"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
                title="Account"
                style={avatarUrl ? {
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {!avatarUrl && avatarLetter ? avatarLetter : ''}
              </button>
              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  <button
                    className="account-dropdown-close"
                    onClick={() => setAccountOpen(false)}
                    aria-label="Close"
                  >✕</button>
                  {!user ? (
                    <div className="signin-section">
                      <div className="signin-header">
                        <h3>Welcome</h3>
                        <p>Sign in to access your cart and orders</p>
                      </div>
                      <GoogleSignIn onSuccess={handleGoogleSuccess} onCancel={() => setAccountOpen(false)} />
                      <div className="signin-note">
                        <span>Use your College Google account:</span>
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
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="avatar"
                            className="profile-avatar"
                          />
                        ) : (
                          <div className="profile-avatar profile-avatar--letter">
                            {avatarLetter}
                          </div>
                        )}
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
                        <Link
                          to="/orders"
                          className="btn btn--secondary"
                          onClick={() => setAccountOpen(false)}
                        >
                          My Orders
                        </Link>
                        <button className="btn btn--primary" onClick={() => { 
                          setAccountOpen(false);
                          setMobileMenuOpen(false);
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
                              to="/admin/dashboard"
                              className="btn btn--ghost btn--admin"
                              onClick={() => setAccountOpen(false)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>Dashboard
                            </Link>
                            <Link
                              to="/admin/orders"
                              className="btn btn--ghost btn--admin"
                              onClick={() => setAccountOpen(false)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>Manage Orders
                            </Link>
                            <Link
                              to="/admin/items"
                              className="btn btn--ghost btn--admin"
                              onClick={() => setAccountOpen(false)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,verticalAlign:'middle'}}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Manage Items
                            </Link>
                          </div>
                        </div>
                      )}

                      <div className="profile-status">
                        {profilePercent >= 100 ? (
                          <span className="status-enabled">✓ Revault enabled</span>
                        ) : (
                          <span className="status-info">
                            Complete your profile (USN, Name, Semester) to use Revault.
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

      <main className={`main-content ${location.pathname === "/" ? "main-content--home" : ""}`}>
        {children}
      </main>

      <MinimalFooter />

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
