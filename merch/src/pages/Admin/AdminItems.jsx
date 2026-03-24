// src/pages/Admin/AdminItems.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { SkeletonGrid, SkeletonList } from "../../components/Skeleton";
import HeroImagesManager from "../../components/admin/HeroImagesManager";
import EventImagesManager from "../../components/admin/EventImagesManager";
import SizeChartManager from "../../components/admin/SizeChartManager";
import { PRODUCT_CATALOG, BASE_PRODUCT_IDS } from "../../data/products";
import toast from "react-hot-toast";
import "./AdminItems.css";

function toLocalDatetime(isoOrLocal) {
  if (!isoOrLocal) return '';
  const d = new Date(isoOrLocal);
  if (isNaN(d)) return isoOrLocal;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISO(localDatetime) {
  if (!localDatetime) return null;
  const d = new Date(localDatetime);
  return isNaN(d) ? null : d.toISOString();
}

const TABS = [
  { key: "utsav", label: "Utsav" },
  { key: "phaseshift", label: "Phaseshift" },
  { key: "farouche", label: "Farouche" },
  { key: "club", label: "Club & Dept Merch" },
  { key: "listed", label: "Listed (Resell)" },
  { key: "system", label: "Hero & Event Images" },
];

const CLUBS = [
  "ACM CHAPTER", "AERO BMSCE", "AQUILLA AEROSPACE", "AUGMENT.AI", "BIG FOUNDATION", 
  "BMSCE ALUMNI NETWORK", "BULLZ RACING", "BUSINESS INSIGHTS", "CHIRANTANA", "<CODE IO/>", 
  "CORTECHS", "DANZ ADDIX", "DSYNC", "EEEA", "ELSOC", "FALCONS", "FINE ARTS CLUB", "GDSC", 
  "GRADIENT", "THE GROOVE HOUSE", "IEEE", "IIC", "INKSANITY", "ISE STUDENT CLUB", "LEO SATVA", 
  "MANUSMARAN", "MECHANICAL ENGG ASSC", "MELTON FOUNDATION", "MOUNTAINEERING CLUB", 
  "MUNSOC", "NCC", "NINAAD", "NSS", "PARAMVAH", "PENTAGRAM", "PRAVRUTTHI", "PROTOCOL", 
  "QCAINE", "RESPAWN", "ROBOTICS", "ROCKETRY CLUB", "ROTARACT", "SAMSKRUTHI SAMBHRAMA", 
  "SENSORED", "SINGULARITY", "SYNAPSE", "TEAM PANACHE", "TEAMCODELOCKED", "UPAGRAHA", 
  "VAK", "VARIANCE", "WAKAI OTAKU"
];

const IEEE_SUBCLUBS = [
  "IEEE COMPUTER SOCIETY", "IEEE COMSOC", "IEEE PELS AND IES", "IEEE PES AND SENSORS COUNCIL",
  "IEEE STUDENT BRANCH", "IEEE SSIT", "IEEE SSCS", "IEEE SIGNAL PROCESSING SOCIETY", "IEEE WIE"
];

const DEPARTMENTS = [
  "AEROSPACE", "AI-DS", "AIML", "BIOTECHNOLOGY", "CHEMICAL", "CIVIL", 
  "CS ALLIED", "CSE", "ECE", "EEE", "IEM", "MECHANICAL"
];

const formatPrice = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export default function AdminItems() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("utsav");
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [ieeeSubclub, setIeeeSubclub] = useState(null);
  const [editableCatalog, setEditableCatalog] = useState(() => {
    const saved = localStorage.getItem('admin_catalog');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(PRODUCT_CATALOG));
  });
  const [eventStatuses, setEventStatuses] = useState(() => {
    const saved = localStorage.getItem('admin_event_statuses');
    return saved ? JSON.parse(saved) : (() => {
      const statuses = {};
      TABS.forEach(tab => {
        statuses[tab.key] = { type: "ongoing", countdown: null, soldOut: false };
      });
      return statuses;
    })();
  });
  const [soldOutItems, setSoldOutItems] = useState({});
  const [limitedItems, setLimitedItems] = useState({});
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [resellItems, setResellItems] = useState([]);
  const [resellSortByDate, setResellSortByDate] = useState('desc');
  const [viewingResellItem, setViewingResellItem] = useState(null);
  const [loadingResell, setLoadingResell] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busyItems, setBusyItems] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [eventDetailsDraft, setEventDetailsDraft] = useState({});
  const [savingEventDetails, setSavingEventDetails] = useState(false);
  const [trendingStatus, setTrendingStatus] = useState({});
  const [deliveryAllowed, setDeliveryAllowed] = useState(true);
  const [eventCardLabels, setEventCardLabels] = useState({});

  // Persist to localStorage whenever changes are made
  useEffect(() => {
    localStorage.setItem('admin_catalog', JSON.stringify(editableCatalog));
  }, [editableCatalog]);

  useEffect(() => {
    localStorage.setItem('admin_event_statuses', JSON.stringify(eventStatuses));
  }, [eventStatuses]);

  // Handle edit popover collision detection (flip left if no right space)
  useEffect(() => {
    if (editingProduct) {
      setTimeout(() => {
        const popover = document.querySelector('.admin-edit-popover');
        if (popover) {
          const rect = popover.getBoundingClientRect();
          if (rect.right > (window.innerWidth || document.documentElement.clientWidth)) {
            popover.classList.add('popover-left');
          }
        }
      }, 50);
    }
  }, [editingProduct]);

  // Fetch delivery setting
  useEffect(() => {
    api.get('/api/settings/delivery').then(res => {
      setDeliveryAllowed(res.data?.allowed !== false);
    }).catch(() => {});
  }, []);

  // Removed localStorage for soldOutItems - now authoritative only from DB

  // Load sold-out status from backend
  async function loadSoldOutStatus() {
    if (!user || !user.isAdmin) return;
    
    try {
      const res = await api.get('/api/items/soldouts', { params: { tabKey: selectedTab } });
      const soldMap = {};
      const limitMap = {};
      
      // Sort by updated_at descending to get the most recent entry for each product
      const items = (res.data?.items || []).sort((a, b) => {
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      });
      
      // Use a Set to track which products we've already processed
      const processed = new Set();
      
      items.forEach(item => {
        // Create a unique key for this product (ignoring variant for base products)
        const uniqueId = `${item.product_id}:${item.club_or_dept || ''}`;
        
        // Only process the most recent entry for each product
        if (processed.has(uniqueId)) return;
        processed.add(uniqueId);
        
        const isSoldOut = item.sold_out === true;
        const isLimited = item.limited === true;
        
        // Create multiple keys to ensure matching works with any variant format
        const productKey = `${selectedTab}:${item.product_id}`;
        const standardKey = `${selectedTab}:${item.product_id}:standard`;
        const nullKey = `${selectedTab}:${item.product_id}:null`;
        
        // Set all possible keys so checkbox can find the status
        soldMap[productKey] = isSoldOut;
        soldMap[standardKey] = isSoldOut;
        soldMap[nullKey] = isSoldOut;

        limitMap[productKey] = isLimited;
        limitMap[standardKey] = isLimited;
        limitMap[nullKey] = isLimited;
        
        // Also set with club_or_dept if present
        if (item.club_or_dept) {
          soldMap[`${productKey}:${item.club_or_dept}`] = isSoldOut;
          soldMap[`${standardKey}:${item.club_or_dept}`] = isSoldOut;

          limitMap[`${productKey}:${item.club_or_dept}`] = isLimited;
          limitMap[`${standardKey}:${item.club_or_dept}`] = isLimited;
        }
      });
      
      // Replace entire state with fresh data from server
      setSoldOutItems(soldMap);
      setLimitedItems(limitMap);

      // Sync event status from server so admin dropdown matches reality
      if (res.data?.eventStatus) {
        const serverEvt = res.data.eventStatus;
        setEventStatuses(prev => ({
          ...prev,
          [selectedTab]: {
            type: serverEvt.type || 'ongoing',
            countdown: serverEvt.countdown || null,
            soldOut: serverEvt.type === 'soldout' || serverEvt.type === 'over' || serverEvt.type === 'no_new_releases'
          }
        }));
      }
    } catch (err) {
      console.error('Failed to load sold-out status:', err);
    }
  }

  // Load sold-out status when tab changes
  useEffect(() => {
    if (user && user.isAdmin && selectedTab !== 'listed') {
      loadSoldOutStatus();
    }
  }, [selectedTab, user]);

  // Load event details for event tabs (utsav, phaseshift, farouche)
  const EVENT_TAB_KEYS = ['utsav', 'phaseshift', 'farouche'];
  useEffect(() => {
    if (!EVENT_TAB_KEYS.includes(selectedTab)) {
      setEventDetails(null);
      setEventDetailsDraft({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/event-details', { params: { tabKey: selectedTab } });
        if (cancelled) return;
        const d = res.data?.eventDetails || null;
        setEventDetails(d);
        setEventDetailsDraft({
          eventDate: d?.event_date || '',
          eventTime: d?.event_time || '',
          eventLocation: d?.event_location || '',
          eventGmapsUrl: d?.event_gmaps_url || '',
          entryPolicy: d?.entry_policy || '',
          merchPopup: d?.merch_popup || '',
        });
      } catch (err) {
        if (!cancelled) {
          setEventDetails(null);
          setEventDetailsDraft({});
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTab]);

  // Save sold-out status to backend
  async function saveSoldOutStatus(tabKey, productId, variant, soldOut, clubOrDept = null, eventStatusOverride = null) {
    if (!user || !user.isAdmin) return;
    
    try {
      const payload = {
        tabKey,
        productId,
        variant: variant || null,
        soldOut,
        clubOrDept
      };
      
      if (eventStatusOverride !== null) {
        payload.eventStatus = eventStatusOverride;
      }
      
      await api.post('/api/admin/items/soldout', payload);
      toast.success(`Item ${soldOut ? 'marked unavailable' : 'marked available'}`);
    } catch (err) {
      console.error('Failed to save sold-out status:', err);
      toast.error('Failed to save to database');
      throw err;
    }
  }

  async function saveLimitedStatus(tabKey, productId, variant, limited, clubOrDept = null) {
    if (!user || !user.isAdmin) return;
    
    try {
      const payload = {
        tabKey,
        productId,
        variant: variant || null,
        limited,
        clubOrDept
      };
      
      await api.post('/api/admin/items/soldout', payload);
      toast.success(`Item ${limited ? 'marked as Limited' : 'marked as standard'}`);
    } catch (err) {
      console.error('Failed to save limited status:', err);
      toast.error('Failed to save to database');
      throw err;
    }
  }

  async function saveCatalogOverride(product) {
    if (!user || !user.isAdmin) return;
    const payload = {
      tabKey: product.tabKey,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      images: product.images || [],
      hidden: product.hidden || false
    };
    try {
      await api.post('/api/admin/items/catalog', payload);
    } catch (err) {
      console.error('Failed to save product override:', err);
      throw err;
    }
  }

  async function hideOrDeleteProduct(tabKey, productId) {
    const isBase = BASE_PRODUCT_IDS.includes(productId);
    const product = editableCatalog[tabKey]?.find(p => p.id === productId);
    try {
      if (isBase) {
        await api.post('/api/admin/items/catalog', {
          tabKey,
          productId,
          name: product?.name,
          price: product?.price,
          imageUrl: product?.imageUrl,
          description: product?.description,
          images: product?.images || [],
          hidden: true
        });
        toast.success('Product hidden from listing');
      } else {
        await api.delete('/api/admin/items/catalog', { params: { tabKey, productId } });
        toast.success('Product removed');
      }
      await fetchOverrides();
    } catch (err) {
      console.error('Failed to hide/delete:', err);
      toast.error('Failed to remove product');
    }
  }

  async function restoreProduct(tabKey, productId) {
    const product = editableCatalog[tabKey]?.find(p => p.id === productId);
    try {
      await api.post('/api/admin/items/catalog', {
        tabKey,
        productId,
        name: product?.name,
        price: product?.price,
        imageUrl: product?.imageUrl,
        description: product?.description,
        images: product?.images || [],
        hidden: false
      });
      toast.success('Product restored');
      await fetchOverrides();
    } catch (err) {
      console.error('Failed to restore:', err);
      toast.error('Failed to restore product');
    }
  }

  async function addNewProduct(tabKey, product) {
    const productId = `custom_${Date.now()}`;
    try {
      await api.post('/api/admin/items/catalog', {
        tabKey,
        productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || "",
        description: product.description || "",
        images: product.images || [],
        hidden: false
      });
      toast.success('Product added');
      await fetchOverrides();
      setAddingProduct(false);
    } catch (err) {
      console.error('Failed to add product:', err);
      toast.error('Failed to add product');
      throw err;
    }
  }

  useEffect(() => {
    fetchOverrides();
  }, []);

  async function fetchOverrides() {
    try {
      const res = await api.get('/api/catalog/overrides');
      const overrides = res.data?.overrides || [];
      const updated = JSON.parse(JSON.stringify(PRODUCT_CATALOG));
      if (!updated.system) updated.system = [];
      overrides.forEach((override) => {
        const tab = override.tab_key;
        if (!updated[tab]) return;
        const isCustom = !BASE_PRODUCT_IDS.includes(override.product_id);
        const baseProduct = updated[tab].find(p => p.id === override.product_id);
        if (baseProduct) {
          updated[tab] = updated[tab].map(product => {
            if (product.id !== override.product_id) return product;
            return {
              ...product,
              hidden: !!override.hidden,
              ...(override.name ? { name: override.name } : {}),
              ...(override.price !== null && override.price !== undefined ? { price: Number(override.price) } : {}),
              ...(override.image_url ? { imageUrl: override.image_url } : {}),
              ...(override.description ? { description: override.description } : {}),
              ...(override.images ? { images: override.images } : {}),
            };
          });
        } else if (isCustom) {
          const customProduct = {
            id: override.product_id,
            name: override.name || 'Custom Item',
            description: override.description || '',
            price: override.price != null ? Number(override.price) : 0,
            imageUrl: override.image_url || null,
            images: override.images || [],
            sleeveOptions: [],
            previewLabel: (override.name || 'Custom').slice(0, 12),
            swatch: ['#6b7280', '#9ca3af'],
            hidden: !!override.hidden,
          };
          updated[tab] = updated[tab] ? [...updated[tab], customProduct] : [customProduct];
        }
      });
      
      const trendingOverride = overrides.find(o => o.tab_key === 'system' && o.product_id === 'trending_status');
      if (trendingOverride && trendingOverride.description) {
        try {
          setTrendingStatus(JSON.parse(trendingOverride.description));
        } catch (e) {
          console.error("Failed to parse trending_status", e);
        }
      }

      // Parse event card labels
      const labelsOverride = overrides.find(o => o.tab_key === 'system' && o.product_id === 'event_card_labels');
      if (labelsOverride && labelsOverride.description) {
        try {
          setEventCardLabels(JSON.parse(labelsOverride.description));
        } catch (e) {
          console.error("Failed to parse event_card_labels", e);
        }
      }
      
      setEditableCatalog(updated);
    } catch (err) {
      console.error('Failed to load catalog overrides', err);
    }
  }

  const currentProducts = editableCatalog[selectedTab] || [];
  
  // Load resell items when "listed" tab is selected
  useEffect(() => {
    if (selectedTab === 'listed') {
      loadResellItems();
    }
  }, [selectedTab]);

  async function loadResellItems() {
    if (!user || !user.isAdmin) return;
    setLoadingResell(true);
    try {
      const res = await api.get('/api/admin/resell/items');
      setResellItems(res.data.items || []);
    } catch (err) {
      console.error('Failed to load resell items:', err);
      toast.error('Failed to load resell items');
    } finally {
      setLoadingResell(false);
    }
  }
  
  // For club tab, filter products by selected club/dept
  const displayProducts = selectedTab === 'club' 
    ? currentProducts // All club products (filtering by club/dept would need product metadata)
    : currentProducts;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Catalog Management</h1>
        <p>Manage products, hero banners, and event configurations.</p>
      </div>

      {/* Global Delivery Toggle */}
      <div className="admin-delivery-toggle-banner" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '14px 20px',
        background: deliveryAllowed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${deliveryAllowed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: '12px',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: deliveryAllowed ? '#16a34a' : '#dc2626' }}>
            {deliveryAllowed ? '🚚 Delivery is currently ENABLED' : '🚫 Delivery is currently DISABLED'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
            {deliveryAllowed
              ? 'Users can select delivery at checkout. Toggle off to grey out the delivery option for all users.'
              : 'The delivery checkbox is greyed out for all users. Toggle on to re-enable.'}
          </div>
        </div>
        <button
          className={`admin-btn ${deliveryAllowed ? 'admin-btn--danger' : 'admin-btn--primary'}`}
          style={{ flexShrink: 0, minWidth: 130 }}
          onClick={async () => {
            const newValue = !deliveryAllowed;
            const prev = deliveryAllowed;
            setDeliveryAllowed(newValue);
            try {
              await api.post('/api/admin/settings/delivery', { allowed: newValue });
              toast.success(newValue ? 'Delivery enabled for all users' : 'Delivery disabled for all users');
            } catch (err) {
              setDeliveryAllowed(prev);
              toast.error('Failed to update delivery setting');
            }
          }}
        >
          {deliveryAllowed ? 'Disable Delivery' : 'Enable Delivery'}
        </button>
      </div>

      <div className="admin-orders-controls">
        <div className="admin-orders-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${selectedTab === tab.key ? "admin-tab--active" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-orders-actions">
           <button className="admin-icon-btn" onClick={fetchOverrides} title="Refresh Catalog">
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => setAddingProduct(true)}>
            <span className="material-symbols-outlined">add</span> Add Item
          </button>
        </div>
      </div>

        <div className="admin-event-status">
          <h4>Event Status{selectedTab === "club" && (ieeeSubclub || selectedClub || selectedDept) ? ` - ${ieeeSubclub || selectedClub || selectedDept}` : ""}</h4>
          <div className="status-controls">
            <label>
              <select
                value={eventStatuses[selectedTab]?.type || "ongoing"}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  const currentCategory = ieeeSubclub || selectedClub || selectedDept;
                  
                  // For club tab, require a specific club/dept to be selected
                  if (selectedTab === "club" && !currentCategory) {
                    toast.error('Please select a specific club or department to change event status');
                    return;
                  }
                  
                  setEventStatuses(prev => ({
                    ...prev,
                    [selectedTab]: { ...prev[selectedTab], type: newStatus, soldOut: newStatus === "soldout" || newStatus === "over" || newStatus === "no_new_releases" }
                  }));
                  
                  // Call backend to sync event status (club/dept-specific for club tab)
                  try {
                    const countdownDate = newStatus === "countdown" 
                      ? toISO(eventStatuses[selectedTab]?.countdown) 
                      : null;
                    
                    await api.post("/api/admin/event/status", {
                      tabKey: selectedTab,
                      status: newStatus,
                      clubOrDept: selectedTab === "club" ? currentCategory : null,
                      countdownDate: countdownDate || null,
                    });
                    toast.success(selectedTab === "club" 
                      ? `Event status updated for ${currentCategory}` 
                      : 'Event status updated globally');
                  } catch (err) {
                    console.error('Failed to update event status:', err);
                    toast.error(err.response?.data?.message || 'Failed to sync event status');
                    return; // Don't update UI if backend failed
                  }
                  
                  const newSoldOuts = { ...soldOutItems };
                  
                  // If event is sold out/over/no_new_releases, mark all products as sold out
                  // For club tab, only update products for the selected club/dept
                  if (newStatus === "soldout" || newStatus === "over" || newStatus === "no_new_releases") {
                    currentProducts.forEach(product => {
                      const productKey = `${selectedTab}:${product.id}`;
                      const categoryKey = currentCategory ? `${productKey}:${currentCategory}` : productKey;
                      newSoldOuts[categoryKey] = true;
                      // Save to backend with club/dept
                      saveSoldOutStatus(selectedTab, product.id, null, true, currentCategory || null, newStatus);
                    });
                  } else if (newStatus === "ongoing" || newStatus === "countdown") {
                    // If event is ongoing/countdown, clear sold_out for all products
                    // The backend endpoint will handle this, but we also update UI optimistically
                    currentProducts.forEach(product => {
                      const productKey = `${selectedTab}:${product.id}`;
                      const categoryKey = currentCategory ? `${productKey}:${currentCategory}` : productKey;
                      // Clear from UI - backend will set sold_out: false
                      delete newSoldOuts[categoryKey];
                      // Also clear base keys
                      delete newSoldOuts[productKey];
                      delete newSoldOuts[`${productKey}:standard`];
                      delete newSoldOuts[`${productKey}:null`];
                    });
                  }
                  
                  setSoldOutItems(newSoldOuts);
                  // Reload to ensure UI matches database - wait a bit longer for backend to process
                  setTimeout(() => {
                    loadSoldOutStatus();
                  }, 500);
                }}
              >
                <option value="ongoing">Ongoing</option>
                <option value="countdown">Countdown</option>
                <option value="soldout">Sold Out</option>
                <option value="over">Over</option>
                <option value="no_new_releases">No New Releases</option>
              </select>
            </label>
            {eventStatuses[selectedTab]?.type === "countdown" && (
              <input
                type="datetime-local"
                value={toLocalDatetime(eventStatuses[selectedTab]?.countdown)}
                onChange={async (e) => {
                  const newCountdown = e.target.value;
                  const isoCountdown = toISO(newCountdown);
                  setEventStatuses(prev => ({
                    ...prev,
                    [selectedTab]: { ...prev[selectedTab], countdown: isoCountdown || newCountdown }
                  }));
                  
                  // Save countdown date to backend immediately
                  try {
                    const currentCategory = ieeeSubclub || selectedClub || selectedDept;
                    await api.post("/api/admin/event/status", {
                      tabKey: selectedTab,
                      status: "countdown",
                      clubOrDept: selectedTab === "club" ? currentCategory : null,
                      countdownDate: isoCountdown,
                    });
                    toast.success('Countdown date updated');
                  } catch (err) {
                    console.error('Failed to update countdown date:', err);
                    toast.error('Failed to save countdown date');
                  }
                }}
              />
            )}
            
            {(selectedTab !== "system" && selectedTab !== "listed") && (
              <div className="admin-trending-toggle">
                <label className="trending-checkbox-wrapper">
                  <input 
                    type="checkbox"
                    checked={!!trendingStatus[ieeeSubclub || selectedClub || selectedDept || selectedTab]}
                    onChange={async (e) => {
                      const isTrending = e.target.checked;
                      const catKey = ieeeSubclub || selectedClub || selectedDept || selectedTab;
                      const newStatus = { ...trendingStatus, [catKey]: isTrending };
                      setTrendingStatus(newStatus);
                      try {
                        await saveCatalogOverride({
                          tabKey: 'system',
                          id: 'trending_status',
                          name: 'Trending Flags',
                          description: JSON.stringify(newStatus)
                        });
                        toast.success(`${catKey} is ${isTrending ? 'now marked as trending' : 'no longer trending'}`);
                        await fetchOverrides();
                      } catch (err) {
                        toast.error('Failed to save trending status');
                        setTrendingStatus(trendingStatus); // revert
                      }
                    }}
                  />
                  <span className="trending-text">Mark Collection as Trending 🔥</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {EVENT_TAB_KEYS.includes(selectedTab) && (
          <div className="admin-event-details">
            <h4>Event Details (Date, Time, Location)</h4>
            <p className="admin-event-details-note">These appear in the &quot;Festival Grounds&quot; section on the event page. Add a Google Maps link for location.</p>
            <div className="admin-event-details-fields">
              <label>
                <span>Date</span>
                <input
                  type="text"
                  placeholder="e.g. October 24-26, 2024"
                  value={eventDetailsDraft.eventDate || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </label>
              <label>
                <span>Time</span>
                <input
                  type="text"
                  placeholder="e.g. Starts at 10:00 AM Daily"
                  value={eventDetailsDraft.eventTime || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, eventTime: e.target.value }))}
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  type="text"
                  placeholder="e.g. Indoor Stadium Lounge"
                  value={eventDetailsDraft.eventLocation || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, eventLocation: e.target.value }))}
                />
              </label>
              <label>
                <span>Google Maps URL</span>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={eventDetailsDraft.eventGmapsUrl || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, eventGmapsUrl: e.target.value }))}
                />
              </label>
              <label>
                <span>Merch Pop-up Info</span>
                <input
                  type="text"
                  placeholder="e.g. Exclusive stall at Indoor Stadium. Online pickups available."
                  value={eventDetailsDraft.merchPopup || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, merchPopup: e.target.value }))}
                />
              </label>
              <label>
                <span>Entry Policy</span>
                <input
                  type="text"
                  placeholder="e.g. ID cards mandatory. Wear merch for priority access."
                  value={eventDetailsDraft.entryPolicy || ''}
                  onChange={(e) => setEventDetailsDraft(prev => ({ ...prev, entryPolicy: e.target.value }))}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              style={{ display: 'block', margin: '2rem auto 0', minWidth: '200px' }}
              disabled={savingEventDetails}
              onClick={async () => {
                setSavingEventDetails(true);
                try {
                  await api.put('/api/admin/event-details', {
                    tabKey: selectedTab,
                    eventDate: eventDetailsDraft.eventDate || null,
                    eventTime: eventDetailsDraft.eventTime || null,
                    eventLocation: eventDetailsDraft.eventLocation || null,
                    eventGmapsUrl: eventDetailsDraft.eventGmapsUrl || null,
                    entryPolicy: eventDetailsDraft.entryPolicy || null,
                    merchPopup: eventDetailsDraft.merchPopup || null,
                  });
                  toast.success('Event details saved');
                  setEventDetails(eventDetailsDraft);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to save event details');
                } finally {
                  setSavingEventDetails(false);
                }
              }}
            >
              {savingEventDetails ? 'Saving...' : 'Save Event Details'}
            </button>
          </div>
        )}

        {selectedTab !== 'listed' && selectedTab === "club" && (
          <div className="club-tabs-container">
            <div className="club-main-tabs">
              <button
                className={`club-tab ${!selectedClub && !selectedDept ? "is-active" : ""}`}
                onClick={() => { setSelectedClub(null); setSelectedDept(null); setIeeeSubclub(null); }}
              >
                ALL
              </button>
              <button
                className={`club-tab ${selectedClub && !selectedDept ? "is-active" : ""}`}
                onClick={() => { setSelectedDept(null); setIeeeSubclub(null); }}
              >
                CLUBS
              </button>
              <button
                className={`club-tab ${selectedDept ? "is-active" : ""}`}
                onClick={() => { setSelectedClub(null); setIeeeSubclub(null); }}
              >
                DEPARTMENTS
              </button>
            </div>

            {!selectedDept && (
              <div className="club-selection club-selection--dropdown">
                <label className="club-dropdown-label">
                  <span>Select Club</span>
                  <select
                    className="club-dropdown"
                    value={selectedClub || ""}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      setSelectedClub(v);
                      setIeeeSubclub(null);
                    }}
                  >
                    <option value="">-- Select a club --</option>
                    {CLUBS.map((club) => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>
                </label>
                {selectedClub === "IEEE" && (
                  <label className="club-dropdown-label">
                    <span>IEEE Subclub</span>
                    <select
                      className="club-dropdown"
                      value={ieeeSubclub || ""}
                      onChange={(e) => setIeeeSubclub(e.target.value || null)}
                    >
                      <option value="">-- Select IEEE subclub --</option>
                      {IEEE_SUBCLUBS.map((subclub) => (
                        <option key={subclub} value={subclub}>{subclub}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {!selectedClub && (
              <div className="department-selection department-selection--dropdown">
                <label className="club-dropdown-label">
                  <span>Select Department</span>
                  <select
                    className="club-dropdown"
                    value={selectedDept || ""}
                    onChange={(e) => setSelectedDept(e.target.value || null)}
                  >
                    <option value="">-- Select a department --</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {(selectedClub || selectedDept || ieeeSubclub) && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                <strong>Selected: </strong>
                {ieeeSubclub || selectedClub || selectedDept}
                <button
                  className="btn btn--ghost"
                  onClick={() => { setSelectedClub(null); setSelectedDept(null); setIeeeSubclub(null); }}
                  style={{ marginLeft: 12, fontSize: '0.85rem' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'system' ? (
          <>
            <HeroImagesManager
              images={editableCatalog['system']?.find(p => p.id === 'hero_carousel')?.images || []}
              onSave={async (urls) => {
                await saveCatalogOverride({
                  tabKey: 'system',
                  id: 'hero_carousel',
                  name: 'Hero Carousel Config',
                  images: urls
                });
                await fetchOverrides();
              }}
            />
            <EventImagesManager
              eventImages={(() => {
                const map = {};
                (editableCatalog['system'] || []).forEach((p) => {
                  if (p?.id?.startsWith('event_images_')) {
                    map[p.id] = { images: Array.isArray(p.images) ? p.images : [] };
                  }
                });
                return map;
              })()}
              eventCardLabels={eventCardLabels}
              onSave={async (eventKey, images) => {
                await saveCatalogOverride({
                  tabKey: 'system',
                  id: `event_images_${eventKey}`,
                  name: `Event Images ${eventKey}`,
                  images
                });
                await fetchOverrides();
              }}
              onSaveLabel={async (eventKey, label) => {
                const newLabels = { ...eventCardLabels, [eventKey]: label };
                setEventCardLabels(newLabels);
                try {
                  await saveCatalogOverride({
                    tabKey: 'system',
                    id: 'event_card_labels',
                    name: 'Event Card Labels',
                    description: JSON.stringify(newLabels)
                  });
                  toast.success(`Label updated for ${eventKey}`);
                  await fetchOverrides();
                } catch (err) {
                  toast.error('Failed to save label');
                  setEventCardLabels(eventCardLabels);
                }
              }}
            />
            <SizeChartManager
              imageUrl={editableCatalog['system']?.find(p => p.id === 'size_chart')?.images?.[0] || null}
              onSave={async (images) => {
                await saveCatalogOverride({
                  tabKey: 'system',
                  id: 'size_chart',
                  name: 'Size Chart',
                  images: images || []
                });
                await fetchOverrides();
              }}
            />

            {/* Delivery Toggle */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginTop: 24, border: '1px solid rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>Delivery Settings</h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--admin-text-muted)' }}>Control whether users can opt for delivery at checkout.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className={`admin-btn ${deliveryAllowed ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
                  onClick={async () => {
                    try {
                      await api.post('/api/admin/settings/delivery', { allowed: true });
                      setDeliveryAllowed(true);
                      toast.success('Delivery enabled');
                    } catch (err) { toast.error('Failed to update'); }
                  }}
                >
                  ✅ Allow Delivery
                </button>
                <button
                  className={`admin-btn ${!deliveryAllowed ? 'admin-btn--danger' : 'admin-btn--ghost'}`}
                  onClick={async () => {
                    try {
                      await api.post('/api/admin/settings/delivery', { allowed: false });
                      setDeliveryAllowed(false);
                      toast.success('Delivery disabled');
                    } catch (err) { toast.error('Failed to update'); }
                  }}
                >
                  🚫 Disallow Delivery
                </button>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '0.82rem', color: deliveryAllowed ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                Status: {deliveryAllowed ? 'Delivery is currently ALLOWED' : 'Delivery is currently DISABLED'}
              </p>
            </div>
          </>
        ) : selectedTab === 'listed' ? (
          <div className="admin-products-list">
            <h4>Resell Listings</h4>
            {loadingResell ? (
              <SkeletonList rows={5} />
            ) : resellItems.length === 0 ? (
              <p>No resell items listed yet.</p>
            ) : (
              <div className="resell-admin-list">
                <div className="resell-admin-header">
                  <div>Seller / Email</div>
                  <div>Title</div>
                  <button
                    type="button"
                    className="resell-admin-header__sort"
                    onClick={() => setResellSortByDate((s) => (s === 'desc' ? 'asc' : 'desc'))}
                    title={resellSortByDate === 'desc' ? 'Newest first (click to sort oldest first)' : 'Oldest first (click to sort newest first)'}
                  >
                    Listed {resellSortByDate === 'desc' ? '↓' : '↑'}
                  </button>
                  <div>Status</div>
                  <div>Price</div>
                  <div>Actions</div>
                </div>
                {[...resellItems]
                  .sort((a, b) => {
                    const da = new Date(a.created_at || 0).getTime();
                    const db = new Date(b.created_at || 0).getTime();
                    return resellSortByDate === 'desc' ? db - da : da - db;
                  })
                  .map((item) => {
                  const isHidden = !!item.admin_hidden;
                  const modStatus = item.moderation_status || 'approved';
                  const isPending = modStatus === 'pending';
                  const status = isHidden ? 'Hidden' : isPending ? 'Pending review' : (item.display_status || item.status);
                  const statusCls = status?.toLowerCase?.().replace(/\s/g, '-') || '';
                  const isExpanded = viewingResellItem?.id === item.id;
                  return (
                    <div key={item.id} className="resell-admin-row-group">
                      <div className={`resell-admin-row ${isHidden ? 'is-hidden' : ''} ${isPending ? 'is-pending' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
                      <div className="resell-admin-seller">
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {item.user?.name || (item.user?.email || 'Unknown').split('@')[0]}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', wordBreak: 'break-word' }}>
                          {item.user?.email || 'Unknown'}
                        </div>
                      </div>
                      <div className="resell-admin-title">
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                          {item.condition}{item.year ? ` • ${item.year}` : ''}
                        </div>
                      </div>
                      <div className="resell-admin-listed">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '–'}
                      </div>
                      <div>
                        <span className={`resell-status-badge resell-status--${statusCls}`}>
                          {statusCls === 'active' && '✓ '}
                          {statusCls === 'pending-review' && '⏳ '}
                          {statusCls === 'expired' && '⏱ '}
                          {statusCls === 'deleted' && '🗑 '}
                          {statusCls === 'hidden' && '👁 '}
                          {status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        {item.price_range || 'TBD'}
                      </div>
                      <div className="resell-admin-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setViewingResellItem(isExpanded ? null : item)}
                          title={isExpanded ? "Close details" : "View full details"}
                        >
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                        {isPending && (
                          <>
                            <button
                              className="btn btn--ghost btn--sm"
                              style={{ color: '#16a34a' }}
                              onClick={async () => {
                                try {
                                  await api.post(`/api/admin/resell/items/${item.id}/approve`);
                                  toast.success('Listing approved');
                                  loadResellItems();
                                } catch (err) {
                                  toast.error('Failed to approve');
                                }
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn--ghost btn--sm"
                              style={{ color: '#dc2626' }}
                              onClick={async () => {
                                if (window.confirm(`Reject "${item.title}"? It will not be visible to buyers.`)) {
                                  try {
                                    await api.post(`/api/admin/resell/items/${item.id}/reject`);
                                    toast.success('Listing rejected');
                                    loadResellItems();
                                  } catch (err) {
                                    toast.error('Failed to reject');
                                  }
                                }
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isHidden ? (
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ color: 'var(--accent)' }}
                            onClick={async () => {
                              try {
                                await api.post(`/api/admin/resell/items/${item.id}/restore`);
                                toast.success('Item restored');
                                loadResellItems();
                              } catch (err) {
                                toast.error('Failed to restore');
                              }
                            }}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            className="btn btn--ghost btn--sm"
                            style={{ color: '#dc2626' }}
                            onClick={async () => {
                              if (window.confirm(`Hide "${item.title}" from the resell tab?`)) {
                                try {
                                  await api.post(`/api/admin/resell/items/${item.id}/hide`);
                                  toast.success('Item hidden');
                                  loadResellItems();
                                } catch (err) {
                                  toast.error('Failed to hide item');
                                }
                              }
                            }}
                          >
                            Hide
                          </button>
                        )}
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ color: '#991b1b' }}
                          onClick={async () => {
                            if (window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) {
                              try {
                                await api.delete(`/api/admin/resell/items/${item.id}`);
                                toast.success('Item deleted');
                                loadResellItems();
                              } catch (err) {
                                toast.error('Failed to delete');
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="admin-resell-detail-expanded">
                          <div className="admin-resell-detail-gallery">
                            {item.pictures?.length > 0 ? (
                              item.pictures.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`${item.title} ${idx + 1}`}
                                  loading="lazy"
                                  onClick={() => window.open(url, '_blank')}
                                />
                              ))
                            ) : (
                              <div className="admin-resell-detail-no-image">No images</div>
                            )}
                          </div>
                          
                          {item.description && (
                            <div className="admin-resell-detail-desc">
                              <strong>Description</strong>
                              <p>{item.description}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Inventory {selectedClub || selectedDept || ieeeSubclub ? ` — ${ieeeSubclub || selectedClub || selectedDept}` : ''}</h2>
              <div className="admin-section-actions">
                <span className="admin-badge">{displayProducts.length} Products</span>
              </div>
            </div>

            <div className="admin-items-grid">
              {displayProducts.map((product) => {
                const productKey = `${selectedTab}:${product.id}`;
                const variantKey = `${selectedTab}:${product.id}:standard`;
                const nullKey = `${selectedTab}:${product.id}:null`;
                const isSoldOut = soldOutItems[productKey] || soldOutItems[variantKey] || soldOutItems[nullKey];
                const isItemLimited = limitedItems[productKey] || limitedItems[variantKey] || limitedItems[nullKey];
                const currentCategory = ieeeSubclub || selectedClub || selectedDept;
                const categoryKey = currentCategory ? `${productKey}:${currentCategory}` : productKey;
                const isCategorySoldOut = currentCategory ? soldOutItems[categoryKey] : false;
                const finalSoldOut = isCategorySoldOut || isSoldOut || (!currentCategory && eventStatuses[selectedTab]?.soldOut);
                const finalLimited = currentCategory ? limitedItems[categoryKey] : isItemLimited;
                const isHidden = !!product.hidden;
                const isEditingThis = editingProduct?.id === product.id;
                
                return (
                  <div key={product.id} className="admin-item-card-wrapper">
                    <div className={`admin-item-card ${isHidden ? 'is-hidden' : ''} ${isEditingThis ? 'is-editing' : ''}`}>
                      <div className="admin-item-card__image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          background: `linear-gradient(135deg, ${product.swatch?.[0] || '#eee'}, ${product.swatch?.[1] || '#ddd'})` 
                        }} />
                      )}
                      {finalSoldOut && !isHidden && <span className="admin-item-card__badge admin-item-card__badge--soldout">SOLD OUT</span>}
                      {isHidden && <span className="admin-item-card__badge">HIDDEN</span>}
                    </div>

                    <div className="admin-item-card__content">
                      <h3 className="admin-item-card__title">{product.name}</h3>
                      <div className="admin-item-card__price">{formatPrice(product.price)}</div>
                      
                      <div className="admin-item-status-toggle">
                        <label className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={!finalSoldOut}
                            disabled={isHidden || busyItems[product.id]}
                            onChange={async (e) => {
                              if (busyItems[product.id]) return;
                              setBusyItems(prev => ({ ...prev, [product.id]: true }));
                              
                              const newSoldOut = !e.target.checked;
                              const keyToUpdate = currentCategory ? categoryKey : productKey;
                              const vKey = `${selectedTab}:${product.id}:standard`;
                              
                              setSoldOutItems(prev => {
                                const updated = { ...prev };
                                updated[keyToUpdate] = newSoldOut;
                                if (!currentCategory) {
                                  updated[vKey] = newSoldOut;
                                }
                                return updated;
                              });
                              
                              try {
                                await saveSoldOutStatus(selectedTab, product.id, null, newSoldOut, currentCategory, null);
                              } catch (err) {
                                setSoldOutItems(prev => {
                                  const reverted = { ...prev };
                                  reverted[keyToUpdate] = !newSoldOut;
                                  if (!currentCategory) {
                                    reverted[vKey] = !newSoldOut;
                                  }
                                  return reverted;
                                });
                              } finally {
                                setBusyItems(prev => ({ ...prev, [product.id]: false }));
                                // Reload from server to sync state (fixes restored item toggle)
                                loadSoldOutStatus();
                              }
                            }}
                           />
                          <span>{busyItems[product.id] ? 'Saving...' : 'Available'}</span>
                        </label>

                        <label className="admin-checkbox-label" style={{ marginLeft: '12px' }}>
                          <input
                            type="checkbox"
                            checked={finalLimited || false}
                            disabled={isHidden || busyItems[`${product.id}_limit`]}
                            onChange={async (e) => {
                              if (busyItems[`${product.id}_limit`]) return;
                              setBusyItems(prev => ({ ...prev, [`${product.id}_limit`]: true }));
                              
                              const newLimited = e.target.checked;
                              const keyToUpdate = currentCategory ? categoryKey : productKey;
                              const vKey = `${selectedTab}:${product.id}:standard`;
                              
                              setLimitedItems(prev => {
                                const updated = { ...prev };
                                updated[keyToUpdate] = newLimited;
                                if (!currentCategory) {
                                  updated[vKey] = newLimited;
                                }
                                return updated;
                              });
                              
                              try {
                                await saveLimitedStatus(selectedTab, product.id, null, newLimited, currentCategory);
                              } catch (err) {
                                setLimitedItems(prev => {
                                  const reverted = { ...prev };
                                  reverted[keyToUpdate] = !newLimited;
                                  if (!currentCategory) {
                                    reverted[vKey] = !newLimited;
                                  }
                                  return reverted;
                                });
                              } finally {
                                setBusyItems(prev => ({ ...prev, [`${product.id}_limit`]: false }));
                              }
                            }}
                          />
                          <span style={{ color: finalLimited ? '#FF6B00' : 'inherit', fontWeight: finalLimited ? 'bold' : 'normal' }}>
                            {busyItems[`${product.id}_limit`] ? 'Saving...' : 'Limited'}
                          </span>
                        </label>
                      </div>

                      <div className="admin-item-card__footer">
                        <button
                          className="admin-icon-btn"
                          disabled={busyItems[product.id]}
                          onClick={() => setEditingProduct({ ...product, tabKey: selectedTab, productKey })}
                          title="Edit Product"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>

                        <div className="admin-item-card__actions">
                          {isHidden ? (
                            <button
                              className="admin-btn admin-btn--sm"
                              disabled={busyItems[product.id]}
                              onClick={async () => {
                                if (busyItems[product.id]) return;
                                setBusyItems(prev => ({ ...prev, [product.id]: true }));
                                try {
                                  await restoreProduct(selectedTab, product.id);
                                } finally {
                                  setBusyItems(prev => ({ ...prev, [product.id]: false }));
                                }
                              }}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className="admin-icon-btn admin-icon-btn--danger"
                              disabled={busyItems[product.id]}
                              onClick={async () => {
                                if (busyItems[product.id]) return;
                                if (!window.confirm(`Remove "${product.name}" from this event?`)) return;
                                setBusyItems(prev => ({ ...prev, [product.id]: true }));
                                try {
                                  await hideOrDeleteProduct(selectedTab, product.id);
                                } finally {
                                  setBusyItems(prev => ({ ...prev, [product.id]: false }));
                                }
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                    
                    {isEditingThis && (
                      <div className="admin-edit-popover" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Product</h3>
                          <button className="admin-icon-btn" onClick={() => setEditingProduct(null)}>
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                        <div className="admin-edit-form">
                          <label>
                            Upload Image
                            <input
                              type="file"
                              accept="image/*,.heic"
                              style={{ marginTop: '0.5rem' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingImage(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('image', file);
                                  const res = await api.post('/api/resell/upload-image', formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                  });
                                  if (res.data?.url) {
                                    setEditingProduct(prev => ({ ...prev, imageUrl: res.data.url }));
                                    toast.success('Image uploaded');
                                  }
                                } catch (err) {
                                  toast.error('Failed to upload image');
                                } finally {
                                  setUploadingImage(false);
                                }
                              }}
                              disabled={uploadingImage}
                            />
                            {uploadingImage && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0' }}>Uploading...</p>}
                          </label>
                          <label>
                            Or Image URL
                            <input
                              type="text"
                              value={editingProduct.imageUrl || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                              placeholder="https://..."
                            />
                          </label>
                          <label>
                            Name
                            <input
                              type="text"
                              value={editingProduct.name || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            />
                          </label>
                          <label>
                            Price (₹)
                            <input
                              type="number"
                              value={editingProduct.price || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                            />
                          </label>
                          <label>
                            Description
                            <textarea
                              value={editingProduct.description || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                              rows={3}
                            />
                          </label>
                          <div className="admin-edit-actions" style={{ marginTop: '12px' }}>
                            <button
                              className="btn btn--primary"
                              disabled={uploadingImage}
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={async () => {
                                try {
                                  // Optimistic UI update
                                  setEditableCatalog(prev => {
                                    const updated = { ...prev };
                                    const tab = editingProduct.tabKey;
                                    updated[tab] = updated[tab].map(p => 
                                      p.id === editingProduct.id ? editingProduct : p
                                    );
                                    return updated;
                                  });
                                  
                                  await saveCatalogOverride(editingProduct);
                                  toast.success('Product updated');
                                  setEditingProduct(null);
                                  await fetchOverrides();
                                } catch (err) {
                                  toast.error('Failed to save changes');
                                }
                              }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {addingProduct && (
          <div className="admin-edit-modal" onClick={() => setAddingProduct(false)}>
            <div className="admin-edit-content" onClick={(e) => e.stopPropagation()}>
              <h3>Add New Product to {TABS.find(t => t.key === addingProduct.tabKey)?.label}</h3>
              <div className="admin-edit-form">
                <label>
                  Name
                  <input
                    type="text"
                    value={addingProduct.name || ""}
                    onChange={(e) => setAddingProduct({ ...addingProduct, name: e.target.value })}
                    placeholder="Product Name"
                  />
                </label>
                <label>
                  Price (₹)
                  <input
                    type="number"
                    value={addingProduct.price || 0}
                    onChange={(e) => setAddingProduct({ ...addingProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </label>
                <label>
                  Primary Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ marginTop: '0.5rem' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                       try {
                        const formData = new FormData();
                        formData.append('image', file);
                        const res = await api.post('/api/resell/upload-image', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data?.url) {
                          setAddingProduct({ ...addingProduct, imageUrl: res.data.url });
                          toast.success('Image uploaded successfully');
                        }
                      } catch (err) {
                        toast.error('Failed to upload image');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Uploading...</p>}
                </label>
                <label>
                  Description
                  <textarea
                    value={addingProduct.description || ""}
                    onChange={(e) => setAddingProduct({ ...addingProduct, description: e.target.value })}
                    rows={2}
                    placeholder="Product description"
                  />
                </label>
                <label>
                  Additional Images (URLs, one per line)
                  <textarea
                    value={(addingProduct.images || []).join('\n')}
                    onChange={(e) => {
                      const urls = e.target.value.split('\n').filter(url => url.trim());
                      setAddingProduct({ ...addingProduct, images: urls });
                    }}
                    rows={3}
                    placeholder="https://example.com/image1.jpg"
                  />
                </label>
                <div className="admin-edit-actions">
                  <button
                    className="btn"
                    disabled={!addingProduct.name?.trim() || (addingProduct.price === undefined || addingProduct.price === null || addingProduct.price < 0)}
                    onClick={async () => {
                      try {
                        await addNewProduct(addingProduct.tabKey, addingProduct);
                      } catch (e) {}
                    }}
                  >
                    Add Product
                  </button>
                  <button className="btn btn--ghost" onClick={() => setAddingProduct(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

