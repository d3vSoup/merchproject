// src/pages/Admin/AdminItems.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api";
import { PRODUCT_CATALOG } from "../../data/products";
import toast from "react-hot-toast";

const TABS = [
  { key: "utsav", label: "Utsav" },
  { key: "phaseshift", label: "Phaseshift" },
  { key: "farouche", label: "Farouche" },
  { key: "club", label: "Club & Dept Merch" },
  { key: "listed", label: "Listed (Resell)" },
];

const CLUBS = [
  "IEEE", "PENTAGRAM", "ROCKETRY CLUB", "TEAMCODELOCKED", "<CODE IO/>", "ACM CHAPTER",
  "AQUILLA AEROSPACE", "AUGMENT.AI", "BIG FOUNDATION", "BMSCE ALUMNI NETWORK", "BULLZ RACING",
  "CHIRANTANA", "DANZ ADDIX", "DSYNC", "EEEA", "ELSOC", "FINE ARTS CLUB", "FALCONS", "GDSC",
  "GRADIENT", "THE GROOVE HOUSE", "IIC", "INKSANITY", "ISE STUDENT CLUB", "LEO SATVA",
  "MANUSMARAN", "MELTON FOUNDATION", "MOUNTAINEERING CLUB", "MUNSOC", "NINAAD", "NSS",
  "TEAM PANACHE", "PARAMVAH", "PROTOCOL", "PRAVRUTTHI", "QCAINE", "RESPAWN", "ROBOTICS",
  "ROTARACT", "SAMSKRUTHI SAMBHRAMA", "SENSORED", "SINGULARITY", "SYNAPSE", "UPAGRAHA",
  "BUSINESS INSIGHTS", "MECHANICAL ENGG ASSC", "VARIANCE", "VAK", "AERO BMSCE", "WAKAI OTAKU",
  "NCC", "CORTECHS"
];

const IEEE_SUBCLUBS = [
  "IEEE COMPUTER SOCIETY", "IEEE COMSOC", "IEEE PELS AND IES", "IEEE PES AND SENSORS COUNCIL",
  "IEEE STUDENT BRANCH", "IEEE SSIT", "IEEE SSCS", "IEEE SIGNAL PROCESSING SOCIETY", "IEEE WIE"
];

const DEPARTMENTS = [
  "CSE", "CS ALLIED", "AIML", "AIML ALLIED", "ECE", "EEE", "AEROSPACE", "MECHANICAL",
  "CIVIL", "BIOTECHNOLOGY", "CHEMICAL"
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
  const [editingProduct, setEditingProduct] = useState(null);
  const [resellItems, setResellItems] = useState([]);
  const [loadingResell, setLoadingResell] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Persist to localStorage whenever changes are made
  useEffect(() => {
    localStorage.setItem('admin_catalog', JSON.stringify(editableCatalog));
  }, [editableCatalog]);

  useEffect(() => {
    localStorage.setItem('admin_event_statuses', JSON.stringify(eventStatuses));
  }, [eventStatuses]);

  // Removed localStorage for soldOutItems - now authoritative only from DB

  // Load sold-out status from backend
  async function loadSoldOutStatus() {
    if (!user || user.email !== 'souparno.cs24@bmsce.ac.in') return;
    
    try {
      const res = await api.get('/api/items/soldouts', { params: { tabKey: selectedTab } });
      const map = {};
      
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
        
        // Create multiple keys to ensure matching works with any variant format
        const productKey = `${selectedTab}:${item.product_id}`;
        const standardKey = `${selectedTab}:${item.product_id}:standard`;
        const nullKey = `${selectedTab}:${item.product_id}:null`;
        
        // Set all possible keys so checkbox can find the status
        map[productKey] = isSoldOut;
        map[standardKey] = isSoldOut;
        map[nullKey] = isSoldOut;
        
        // Also set with club_or_dept if present
        if (item.club_or_dept) {
          map[`${productKey}:${item.club_or_dept}`] = isSoldOut;
          map[`${standardKey}:${item.club_or_dept}`] = isSoldOut;
        }
        
        console.log('Loaded item:', item.product_id, '- sold_out:', isSoldOut, '- updated_at:', item.updated_at);
      });
      
      console.log('Loaded soldOutItems:', Object.keys(map).length, 'keys from', processed.size, 'unique products');
      
      // Replace entire state with fresh data from server
      setSoldOutItems(map);
    } catch (err) {
      console.error('Failed to load sold-out status:', err);
    }
  }

  // Load sold-out status when tab changes
  useEffect(() => {
    if (user && user.email === 'souparno.cs24@bmsce.ac.in' && selectedTab !== 'listed') {
      loadSoldOutStatus();
    }
  }, [selectedTab, user]);

  // Save sold-out status to backend
  async function saveSoldOutStatus(tabKey, productId, variant, soldOut, clubOrDept = null, eventStatusOverride = null) {
    if (!user || user.email !== 'souparno.cs24@bmsce.ac.in') return;
    
    try {
      const payload = {
        tabKey,
        productId,
        variant: variant || null,
        soldOut,
        clubOrDept
      };
      
      // Only set eventStatus if explicitly provided (for event-level changes)
      // When toggling individual items, don't override eventStatus
      if (eventStatusOverride !== null) {
        payload.eventStatus = eventStatusOverride;
      }
      
      console.log('Saving soldout status:', payload);
      const res = await api.post('/api/admin/items/soldout', payload);
      console.log('Saved successfully:', res.data);
      toast.success(`Item ${soldOut ? 'marked unavailable' : 'marked available'}`);
      
      // Reload to ensure UI matches database
      setTimeout(() => loadSoldOutStatus(), 200);
    } catch (err) {
      console.error('Failed to save sold-out status:', err);
      toast.error('Failed to save to database');
      throw err; // Rethrow so the caller can revert
    }
  }

  async function saveCatalogOverride(product) {
    if (!user || user.email !== 'souparno.cs24@bmsce.ac.in') return;
    const payload = {
      tabKey: product.tabKey,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      images: product.images || []
    };
    try {
      await api.post('/api/admin/items/catalog', payload);
    } catch (err) {
      console.error('Failed to save product override:', err);
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
      if (!overrides.length) {
        return;
      }
      const updated = JSON.parse(JSON.stringify(PRODUCT_CATALOG));
      overrides.forEach((override) => {
        const tab = override.tab_key;
        if (!updated[tab]) return;
        updated[tab] = updated[tab].map(product => {
          if (product.id !== override.product_id) return product;
          return {
            ...product,
            ...(override.name ? { name: override.name } : {}),
            ...(override.price !== null && override.price !== undefined ? { price: Number(override.price) } : {}),
            ...(override.image_url ? { imageUrl: override.image_url } : {}),
            ...(override.description ? { description: override.description } : {}),
            ...(override.images ? { images: override.images } : {}),
          };
        });
      });
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
    if (!user || user.email !== 'souparno.cs24@bmsce.ac.in') return;
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
    <section className="admin-section">
      <div className="section-heading">Item Management</div>
      <div className="admin-panel">
        <div className="admin-tabs-row">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`admin-tab ${selectedTab === tab.key ? "is-active" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
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
                    await api.post("/api/admin/event/status", {
                      tabKey: selectedTab,
                      status: newStatus,
                      clubOrDept: selectedTab === "club" ? currentCategory : null,
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
                value={eventStatuses[selectedTab]?.countdown || ""}
                onChange={(e) => {
                  setEventStatuses(prev => ({
                    ...prev,
                    [selectedTab]: { ...prev[selectedTab], countdown: e.target.value }
                  }));
                }}
              />
            )}
          </div>
        </div>

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
              <div className="club-selection">
                <div className="club-list">
                  {CLUBS.map((club) => (
                    <div key={club} className="club-item-wrapper">
                      {club === "IEEE" ? (
                        <div className="ieee-dropdown">
                          <button
                            className={`club-item ${selectedClub === club ? "is-active" : ""}`}
                            onClick={() => {
                              if (selectedClub === club) {
                                setSelectedClub(null);
                                setIeeeSubclub(null);
                              } else {
                                setSelectedClub(club);
                                setIeeeSubclub(null);
                              }
                            }}
                          >
                            {club} {selectedClub === club ? "▼" : "▶"}
                          </button>
                          {selectedClub === club && (
                            <div className="ieee-subclubs">
                              {IEEE_SUBCLUBS.map((subclub) => (
                                <button
                                  key={subclub}
                                  className={`club-item subclub ${ieeeSubclub === subclub ? "is-active" : ""}`}
                                  onClick={() => setIeeeSubclub(subclub)}
                                >
                                  {subclub}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          className={`club-item ${selectedClub === club ? "is-active" : ""}`}
                          onClick={() => {
                            setSelectedClub(selectedClub === club ? null : club);
                            setIeeeSubclub(null);
                          }}
                        >
                          {club}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedClub && (
              <div className="department-selection">
                <div className="department-list">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      className={`department-item ${selectedDept === dept ? "is-active" : ""}`}
                      onClick={() => setSelectedDept(selectedDept === dept ? null : dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
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

        {selectedTab === 'listed' ? (
          <div className="admin-products-list">
            <h4>Resell Listings</h4>
            {loadingResell ? (
              <p>Loading...</p>
            ) : resellItems.length === 0 ? (
              <p>No resell items listed yet.</p>
            ) : (
              <div className="admin-products-grid">
                {resellItems.map((item) => (
                  <div key={item.id} className="admin-product-card">
                    <div className="admin-product-preview" style={{ background: item.pictures?.[0] ? `url(${item.pictures[0]}) center/cover` : '#f0f0f0', position: 'relative' }}>
                      {item.pictures?.length > 0 && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                          {item.pictures.length} images
                        </div>
                      )}
                    </div>
                    <div className="admin-product-info">
                      <div className="admin-product-name">{item.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                        Condition: {item.condition} {item.year && `• Year: ${item.year}`}
                      </div>
                      {item.price_range && (
                        <div className="admin-product-price">{item.price_range}</div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8, maxHeight: 60, overflow: 'hidden' }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                        Status: <strong>{item.status}</strong> • Listed by: {item.user?.email || 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="admin-products-list">
          <h4>Products{selectedClub || selectedDept || ieeeSubclub ? ` - ${ieeeSubclub || selectedClub || selectedDept}` : ''}</h4>
          <div className="admin-products-grid">
            {displayProducts.map((product) => {
              const productKey = `${selectedTab}:${product.id}`;
              const variantKey = `${selectedTab}:${product.id}:standard`;
              const nullKey = `${selectedTab}:${product.id}:null`;
              const isSoldOut = soldOutItems[productKey] || soldOutItems[variantKey] || soldOutItems[nullKey];
              const currentCategory = ieeeSubclub || selectedClub || selectedDept;
              const categoryKey = currentCategory ? `${productKey}:${currentCategory}` : productKey;
              const isCategorySoldOut = currentCategory ? soldOutItems[categoryKey] : false;
              const finalSoldOut = isCategorySoldOut || isSoldOut || eventStatuses[selectedTab]?.soldOut;
              
              return (
                <div key={product.id} className={`admin-product-card ${finalSoldOut ? "is-soldout" : ""}`}>
                  <div
                    className="admin-product-preview"
                    style={{
                      background: product.imageUrl
                        ? `url(${product.imageUrl}) center/cover`
                        : `linear-gradient(135deg, ${product.swatch[0]}, ${product.swatch[1]})`
                    }}
                  >
                    {finalSoldOut && <div className="sold-out-badge">UNAVAILABLE</div>}
                  </div>
                  <div className="admin-product-info">
                    <div className="admin-product-name">{product.name}</div>
                    <div className="admin-product-price">{formatPrice(product.price)}</div>
                    <div className="admin-product-availability">
                      <label>
                        <input
                          type="checkbox"
                          checked={!finalSoldOut}
                          onChange={async (e) => {
                            const newSoldOut = !e.target.checked;
                            const keyToUpdate = currentCategory ? categoryKey : productKey;
                            const variantKey = `${selectedTab}:${product.id}:standard`;
                            
                            // Optimistically update UI
                            setSoldOutItems(prev => {
                              const updated = { ...prev };
                              updated[keyToUpdate] = newSoldOut;
                              if (!currentCategory) {
                                updated[variantKey] = newSoldOut;
                              }
                              return updated;
                            });
                            
                            // Save to backend
                            try {
                              await saveSoldOutStatus(selectedTab, product.id, null, newSoldOut, currentCategory, null);
                              // Don't show toast here as loadSoldOutStatus will be called after save
                            } catch (err) {
                              // Revert on error
                              setSoldOutItems(prev => {
                                const reverted = { ...prev };
                                reverted[keyToUpdate] = !newSoldOut;
                                if (!currentCategory) {
                                  reverted[variantKey] = !newSoldOut;
                                }
                                return reverted;
                              });
                              toast.error('Failed to update availability');
                            }
                          }}
                        />
                        Available
                      </label>
                    </div>
                    {currentCategory && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                        Category: {currentCategory}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setEditingProduct({ ...product, tabKey: selectedTab, productKey })}
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {editingProduct && (
          <div className="admin-edit-modal">
            <div className="admin-edit-content">
              <h3>Edit Product</h3>
              <div className="admin-edit-form">
                <label>
                  Primary Image URL
                  <input
                    type="url"
                    value={editingProduct.imageUrl || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </label>
                
                <label>
                  Upload Image from PC
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      setUploadingImage(true);
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        const res = await api.post('/api/resell/upload-image', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        if (res.data?.url) {
                          setEditingProduct({ ...editingProduct, imageUrl: res.data.url });
                          toast.success('Image uploaded successfully');
                        }
                      } catch (err) {
                        console.error('Failed to upload:', err);
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
                  Additional Images (URLs, one per line)
                  <textarea
                    value={(editingProduct.images || []).join('\n')}
                    onChange={(e) => {
                      const urls = e.target.value.split('\n').filter(url => url.trim());
                      setEditingProduct({ ...editingProduct, images: urls });
                    }}
                    rows={4}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
                    Enter one URL per line. These will be shown in the product detail popup.
                  </p>
                </label>
                <label>
                  Name
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </label>
                <label>
                  Price (₹)
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                  />
                </label>
                <div className="admin-edit-actions">
                  <button
                    className="btn"
                    onClick={async () => {
                      const productToSave = { ...editingProduct };
                      try {
                        await saveCatalogOverride(productToSave);
                        const updated = {
                          ...editableCatalog,
                          [productToSave.tabKey]: editableCatalog[productToSave.tabKey].map(p =>
                            p.id === productToSave.id ? productToSave : p
                          )
                        };
                        setEditableCatalog(updated);
                        setEditingProduct(null);
                        toast.success("Product updated successfully!");
                      } catch {
                        toast.error("Failed to save changes");
                      }
                    }}
                  >
                    Save
                  </button>
                  <button className="btn btn--ghost" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

