import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";
import api from "../../api";
import { SkeletonGrid } from "../../components/Skeleton";
import GradientText from "../../components/ui/GradientText";
import "./ResellBuyer.css";

const CONDITIONS = [
  { value: "all", label: "All conditions" },
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - i);

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getConditionClass(condition) {
  if (!condition) return "";
  const c = condition.toLowerCase().replace(/\s+/g, "-");
  if (c === "new") return "resell-item-card__badge--new";
  if (c === "like-new" || c === "like new") return "resell-item-card__badge--like-new";
  if (c === "good") return "resell-item-card__badge--good";
  return "resell-item-card__badge--fair";
}

function formatConditionLabel(condition) {
  if (!condition) return "";
  return condition.charAt(0).toUpperCase() + condition.slice(1).replace(/-/g, " ");
}

function FeedbackItem({
  fb,
  parentName,
  replyingTo,
  setReplyingTo,
  replyForm,
  setReplyForm,
  submitReply,
  submittingReply,
  feedbackForm,
  user,
  depth = 0,
}) {
  const isReply = !!fb.parent_id;
  const showReplyForm = replyingTo === fb.id;

  return (
    <div className={`resell-feedback-item ${isReply ? "resell-feedback-item--reply" : ""}`} data-depth={depth}>
      {isReply && parentName && (
        <span className="resell-feedback-item__reply-to">Replying to {parentName}</span>
      )}
      <div className="resell-feedback-item__head">
        <div className="resell-feedback-item__avatar">{getInitials(fb.buyer_name)}</div>
        <span className="resell-feedback-item__name">{fb.buyer_name}</span>
        <span className="resell-feedback-item__meta">
          {fb.buyer_usn}
          {fb.rating != null && <span className="resell-feedback-item__rating"> · ★ {fb.rating}</span>}
          {fb.created_at && (
            <span className="resell-feedback-item__time">
              · {new Date(fb.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </span>
      </div>
      {fb.comments && (
        <p className="resell-feedback-item__comments">{fb.comments}</p>
      )}
      <div className="resell-feedback-item__footer">
        {user && (
          <button
            type="button"
            className="resell-feedback-reply-btn"
            onClick={() => setReplyingTo(showReplyForm ? null : fb.id)}
          >
            {showReplyForm ? "Cancel" : "Reply"}
          </button>
        )}
      </div>
      {showReplyForm && user && (
        <form onSubmit={submitReply} className="resell-feedback-reply-form">
          <textarea
            value={replyForm.comments}
            onChange={(e) => setReplyForm({ comments: e.target.value })}
            placeholder="Write a reply..."
            rows={2}
            maxLength={500}
            required
          />
          <div className="resell-feedback-reply-form__hint">
            Posting as {feedbackForm.buyerName || user?.name || "you"} ({feedbackForm.buyerUsn || user?.usn || "—"})
          </div>
          <button type="submit" className="btn btn--primary btn--sm" disabled={submittingReply}>
            {submittingReply ? "Posting..." : "Post reply"}
          </button>
        </form>
      )}
      {fb.replies && fb.replies.length > 0 && (
        <div className="resell-feedback-replies">
          {fb.replies.map((r) => (
            <FeedbackItem
              key={r.id}
              fb={r}
              parentName={fb.buyer_name}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyForm={replyForm}
              setReplyForm={setReplyForm}
              submitReply={submitReply}
              submittingReply={submittingReply}
              feedbackForm={feedbackForm}
              user={user}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResellBuyer() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [loadingSellerInfo, setLoadingSellerInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("all");
  const [filterMinYear, setFilterMinYear] = useState("");
  const [filterMaxYear, setFilterMaxYear] = useState("");
  const [feedback, setFeedback] = useState({});
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    buyerName: user?.name || "",
    buyerUsn: user?.usn || "",
    rating: null,
    comments: "",
  });
  const [replyForm, setReplyForm] = useState({ comments: "" });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
      if (filterCondition && filterCondition !== "all") params.condition = filterCondition;
      if (filterMinYear) params.minYear = filterMinYear;
      if (filterMaxYear) params.maxYear = filterMaxYear;
      const res = await api.get("/api/resell/items/available", { params });
      setItems(res.data?.items || []);
    } catch (err) {
      console.error("Failed to load available items:", err);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearch, filterCondition, filterMinYear, filterMaxYear]);

  useEffect(() => {
    if (user) loadItems();
  }, [user, loadItems]);

  useEffect(() => {
    setFeedbackForm((f) => ({
      ...f,
      buyerName: user?.name || f.buyerName,
      buyerUsn: user?.usn || f.buyerUsn,
    }));
  }, [user?.name, user?.usn]);

  async function loadFeedback(itemId) {
    if (!itemId) return;
    try {
      const res = await api.get(`/api/resell/items/${itemId}/feedback`);
      setFeedback((prev) => ({ ...prev, [itemId]: res.data?.feedback || [] }));
    } catch {
      setFeedback((prev) => ({ ...prev, [itemId]: [] }));
    }
  }

  useEffect(() => {
    if (selectedItem) loadFeedback(selectedItem.id);
  }, [selectedItem?.id]);

  async function handleContactSeller(item) {
    if (!user?.email) {
      toast.error("Please sign in to contact seller");
      return;
    }
    setLoadingSellerInfo(true);
    try {
      const res = await api.get(`/api/resell/seller-info/${item.user_id}`);
      setSellerInfo(res.data?.seller || null);
      setShowSellerModal(true);
    } catch (err) {
      console.error("Failed to get seller info:", err);
      toast.error("Failed to get seller information");
    } finally {
      setLoadingSellerInfo(false);
    }
  }

  function handleItemClick(item) {
    setSelectedItem(item);
    setSelectedImageIdx(0);
    setShowFeedbackForm(false);
    setReplyingTo(null);
    setFeedbackForm({
      buyerName: user?.name || "",
      buyerUsn: user?.usn || "",
      rating: null,
      comments: "",
    });
    setReplyForm({ comments: "" });
  }

  function closeDetailView() {
    setSelectedItem(null);
    setShowFeedbackForm(false);
    setReplyingTo(null);
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!selectedItem || !replyingTo || !replyForm.comments?.trim()) return;
    if (!feedbackForm.buyerName?.trim() || !feedbackForm.buyerUsn?.trim()) {
      toast.error("Name and USN are required to reply");
      return;
    }
    setSubmittingReply(true);
    try {
      await api.post(`/api/resell/items/${selectedItem.id}/feedback`, {
        buyerName: feedbackForm.buyerName.trim(),
        buyerUsn: feedbackForm.buyerUsn.trim(),
        comments: replyForm.comments.trim(),
        parentId: replyingTo,
      });
      toast.success("Reply posted!");
      setReplyingTo(null);
      setReplyForm({ comments: "" });
      loadFeedback(selectedItem.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  }

  function closeSellerModal() {
    setShowSellerModal(false);
    setSellerInfo(null);
  }

  async function submitFeedback(e) {
    e.preventDefault();
    if (!selectedItem) return;
    if (!feedbackForm.buyerName?.trim() || !feedbackForm.buyerUsn?.trim()) {
      toast.error("Name and USN are required");
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(feedbackForm.buyerUsn.trim())) {
      toast.error("USN must be alphanumeric only");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await api.post(`/api/resell/items/${selectedItem.id}/feedback`, {
        buyerName: feedbackForm.buyerName.trim(),
        buyerUsn: feedbackForm.buyerUsn.trim(),
        rating: feedbackForm.rating || null,
        comments: feedbackForm.comments?.trim() || null,
      });
      toast.success("Feedback submitted! Thank you.");
      setShowFeedbackForm(false);
      loadFeedback(selectedItem.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const flatFeedback = selectedItem ? feedback[selectedItem.id] || [] : [];
  const topLevelFeedback = flatFeedback.filter((f) => !f.parent_id);
  const ratingsWithValue = topLevelFeedback.filter((f) => f.rating != null);
  const avgRating =
    ratingsWithValue.length > 0
      ? (
          ratingsWithValue.reduce((s, f) => s + f.rating, 0) / ratingsWithValue.length
        ).toFixed(1)
      : null;

  function buildFeedbackTree(list) {
    const byId = {};
    const roots = [];
    list.forEach((f) => {
      byId[f.id] = { ...f, replies: [] };
    });
    list.forEach((f) => {
      const node = byId[f.id];
      if (f.parent_id && byId[f.parent_id]) {
        byId[f.parent_id].replies.push(node);
      } else {
        roots.push(node);
      }
    });
    roots.forEach((r) => r.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    return roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  const feedbackTree = buildFeedbackTree(flatFeedback);

  // Gallery: selected image for modal
  const modalImages = selectedItem?.pictures || [];
  const mainImage = modalImages[selectedImageIdx] || modalImages[0] || null;

  if (loading && items.length === 0) {
    return (
      <div className="resell-buyer">
        <div className="resell-buyer__skeleton">
          <SkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="resell-buyer">
      <div className="resell-buyer__header">
        <h2 className="resell-buyer__title">
          <GradientText colors={["#5227FF", "#FF9FFC", "#B19EEF"]} animationSpeed={8} showBorder={false}>
            Revault Marketplace
          </GradientText>
        </h2>
        <p className="resell-buyer__subtitle">Authenticated BMSCE Campus Gear — Browse verified student listings</p>
      </div>

      <div className="resell-buyer__filters">
        <div className="resell-search">
          <input
            type="search"
            placeholder="Search sneakers, hoodies, jackets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="resell-search__input"
            aria-label="Search items"
          />
        </div>
        <div className="resell-filters-row">
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="resell-filter-select"
            aria-label="Filter by condition"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterMinYear}
            onChange={(e) => setFilterMinYear(e.target.value)}
            className="resell-filter-select"
            aria-label="Min year"
          >
            <option value="">Min year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filterMaxYear}
            onChange={(e) => setFilterMaxYear(e.target.value)}
            className="resell-filter-select"
            aria-label="Max year"
          >
            <option value="">Max year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="resell-buyer__empty">
          <p>No items match your search. Try adjusting filters or check back later.</p>
        </div>
      ) : (
        <div className="resell-buyer__grid">
          {items.map((item) => (
            <article
              key={item.id}
              className="resell-item-card"
              onClick={() => handleItemClick(item)}
            >
              <div className="resell-item-card__image">
                {item.pictures?.[0] ? (
                  <img src={item.pictures[0]} alt={item.title} loading="lazy" />
                ) : (
                  <div className="resell-item-card__placeholder">No image</div>
                )}
                {item.condition && (
                  <span className={`resell-item-card__badge ${getConditionClass(item.condition)}`}>
                    {formatConditionLabel(item.condition)}
                  </span>
                )}
                <div className="resell-item-card__overlay">
                  <button
                    className="resell-item-card__quick-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactSeller(item);
                    }}
                    disabled={loadingSellerInfo}
                  >
                    Contact Seller
                  </button>
                </div>
              </div>
              <div className="resell-item-card__body">
                {item.year && <p className="resell-item-card__category">{item.year} Collection</p>}
                <h3 className="resell-item-card__title">{item.title}</h3>
                {item.description && (
                  <p className="resell-item-card__desc">
                    {item.description.length > 80
                      ? `${item.description.slice(0, 80)}...`
                      : item.description}
                  </p>
                )}
                {item.price_range && (
                  <div className="resell-item-card__price-row">
                    <div className="resell-item-card__price-col">
                      <span className="resell-item-card__price-label">Price</span>
                      <span className="resell-item-card__price">{item.price_range}</span>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="resell-modal-overlay" onClick={closeDetailView} role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
          <div className="resell-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="resell-modal__close"
              onClick={closeDetailView}
              aria-label="Close"
            >
              ×
            </button>

            {/* Gallery */}
            <div className="resell-modal__gallery">
              {mainImage ? (
                <>
                  <div className="resell-modal__gallery-main">
                    <img src={mainImage} alt={selectedItem.title} />
                  </div>
                  {modalImages.length > 1 && (
                    <div className="resell-modal__gallery-thumbs">
                      {modalImages.map((url, idx) => (
                        <div
                          key={idx}
                          className={`resell-modal__gallery-thumb ${idx === selectedImageIdx ? "is-active" : ""}`}
                          onClick={() => setSelectedImageIdx(idx)}
                        >
                          <img src={url} alt={`${selectedItem.title} ${idx + 1}`} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="resell-modal__no-image">No images</div>
              )}
            </div>

            <div className="resell-modal__body">
              <h2 id="item-detail-title" className="resell-modal__title">
                {selectedItem.title}
              </h2>

              <div className="resell-modal__meta">
                <span className="resell-modal__meta-chip">
                  {formatConditionLabel(selectedItem.condition)}
                </span>
                {selectedItem.year && (
                  <span className="resell-modal__meta-chip">📅 {selectedItem.year}</span>
                )}
                {selectedItem.price_range && (
                  <span className="resell-modal__meta-chip resell-modal__meta-chip--price">
                    {selectedItem.price_range}
                  </span>
                )}
              </div>

              {selectedItem.description && (
                <div className="resell-modal__desc">
                  <strong>Description</strong>
                  <p>{selectedItem.description}</p>
                </div>
              )}

              {/* Feedback section */}
              <div className="resell-modal__feedback">
                <div className="resell-feedback-header">
                  <h4>Reviews</h4>
                  {avgRating && (
                    <span className="resell-feedback-avg">
                      ★ {avgRating} ({topLevelFeedback.length})
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  >
                    {showFeedbackForm ? "Cancel" : "Leave feedback"}
                  </button>
                </div>

                {showFeedbackForm && (
                  <form onSubmit={submitFeedback} className="resell-feedback-form">
                    <label>
                      Name <span className="required">*</span>
                      <input
                        type="text"
                        value={feedbackForm.buyerName}
                        onChange={(e) =>
                          setFeedbackForm((f) => ({ ...f, buyerName: e.target.value }))
                        }
                        required
                        placeholder="Your name"
                        maxLength={100}
                      />
                    </label>
                    <label>
                      USN <span className="required">*</span>
                      <input
                        type="text"
                        value={feedbackForm.buyerUsn}
                        onChange={(e) =>
                          setFeedbackForm((f) => ({ ...f, buyerUsn: e.target.value }))
                        }
                        required
                        placeholder="e.g. 1BM20CS001"
                        maxLength={20}
                        pattern="[A-Za-z0-9]+"
                      />
                    </label>
                    <label>
                      Rating (optional)
                      <div className="resell-feedback-stars">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={`resell-star-btn ${feedbackForm.rating >= r ? "is-active" : ""}`}
                            onClick={() =>
                              setFeedbackForm((f) => ({
                                ...f,
                                rating: f.rating === r ? null : r,
                              }))
                            }
                            aria-label={`${r} star${r > 1 ? "s" : ""}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </label>
                    <label>
                      Comments (optional)
                      <textarea
                        value={feedbackForm.comments}
                        onChange={(e) =>
                          setFeedbackForm((f) => ({ ...f, comments: e.target.value }))
                        }
                        placeholder="Share your experience..."
                        rows={3}
                        maxLength={500}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback ? "Submitting..." : "Submit feedback"}
                    </button>
                  </form>
                )}

                <div className="resell-feedback-list">
                  {feedbackTree.length === 0 && !showFeedbackForm ? (
                    <p className="resell-feedback-empty">No reviews yet. Be the first!</p>
                  ) : (
                    feedbackTree.map((fb) => (
                      <FeedbackItem
                        key={fb.id}
                        fb={fb}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyForm={replyForm}
                        setReplyForm={setReplyForm}
                        submitReply={submitReply}
                        submittingReply={submittingReply}
                        feedbackForm={feedbackForm}
                        user={user}
                      />
                    ))
                  )}
                </div>
              </div>

              <button
                className="btn btn--primary resell-modal__contact"
                onClick={() => {
                  closeDetailView();
                  handleContactSeller(selectedItem);
                }}
                disabled={loadingSellerInfo}
              >
                {loadingSellerInfo ? "Loading..." : "Contact Seller"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Contact Modal */}
      {showSellerModal && (
        <div className="resell-modal-overlay" onClick={closeSellerModal} role="dialog" aria-modal="true">
          <div className="resell-seller-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="resell-modal__close"
              onClick={closeSellerModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="resell-seller-modal__icon">👤</div>
            <h2 className="resell-seller-modal__title">Seller Contact</h2>
            {sellerInfo ? (
              <div className="resell-seller-modal__info">
                <div className="resell-seller-field">
                  <span className="resell-seller-field__label">Name</span>
                  <span>{sellerInfo.name || "Not provided"}</span>
                </div>
                <div className="resell-seller-field">
                  <span className="resell-seller-field__label">Email</span>
                  <a href={`mailto:${sellerInfo.email}`}>{sellerInfo.email || "Not provided"}</a>
                </div>
                {sellerInfo.phone && (
                  <div className="resell-seller-field">
                    <span className="resell-seller-field__label">Phone</span>
                    <a href={`tel:${sellerInfo.phone}`}>{sellerInfo.phone}</a>
                  </div>
                )}
                <p className="resell-seller-modal__note">
                  Contact the seller directly to discuss the item.
                </p>
              </div>
            ) : (
              <p className="resell-seller-modal__empty">Seller information not available</p>
            )}
            <button className="btn btn--ghost" onClick={closeSellerModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
