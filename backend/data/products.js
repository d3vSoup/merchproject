// backend/data/products.js

// Base products (copied from frontend)
const BASE_PRODUCTS = [
  {
    id: "tee",
    name: "Classic T-shirt",
    description: "Soft ring-spun cotton with event crest print.",
    price: 349,
    previewLabel: "Tee",
    variant: null,
  },
  {
    id: "oversized",
    name: "Oversized T-shirt",
    description: "Relaxed drop-shoulder silhouette, premium GSM.",
    price: 399,
    previewLabel: "Oversized",
    variant: null,
  },
  {
    id: "poptee",
    name: "Pop T-shirt",
    description: "Vibrant all-over graphic for after-hours events.",
    price: 399,
    previewLabel: "Pop Tee",
    variant: null,
  },
  {
    id: "polo",
    name: "Polo T-shirt",
    description: "Cut-and-sew collar with dual stripe taping.",
    price: 449,
    previewLabel: "Polo",
    variant: null,
  },
  {
    id: "jacket",
    name: "Lightweight Jacket",
    description: "Windbreaker shell, mesh lining for Bengaluru evenings.",
    price: 699,
    previewLabel: "Jacket",
    variant: null,
  },
  {
    id: "varsity",
    name: "Varsity Jacket",
    description: "Wool blend body with faux-leather sleeves & chenille patch.",
    price: 799,
    previewLabel: "Varsity",
    variant: null,
  },
  {
    id: "hoodie",
    name: "Premium Hoodie",
    description: "Fleece-lined hoodie with kangaroo pocket.",
    price: 699,
    previewLabel: "Hoodie",
    variant: null,
  },
];

function themedProducts(overrides = {}) {
  return BASE_PRODUCTS.map((p) => ({
    ...p,
    ...(overrides[p.id] || {}),
  }));
}

// EXACT same product catalog as the frontend
exports.PRODUCT_CATALOG = {
  utsav: themedProducts({
    tee: { name: "Utsav Classic T-shirt" },
    oversized: { name: "Utsav Oversized Tee" },
    poptee: { name: "Carnival Pop T-shirt" },
    polo: { name: "Festival Polo T-shirt" },
    jacket: { name: "Evening Jacket" },
    varsity: { name: "Utsav Varsity Jacket" },
    hoodie: { name: "Sunset Hoodie" },
  }),

  phaseshift: themedProducts({
    tee: { name: "Phaseshift Tee" },
    oversized: { name: "Neon Oversized Tee" },
    poptee: { name: "Hackathon Pop Tee" },
    polo: { name: "Circuit Polo Tee" },
    jacket: { name: "Lab Jacket" },
    varsity: { name: "Binary Varsity Jacket" },
    hoodie: { name: "Aurora Hoodie" },
  }),

  farouche: themedProducts({
    tee: { name: "Farouche Tee" },
    oversized: { name: "Hostelite Oversized Tee" },
    poptee: { name: "Graffiti Pop Tee" },
    polo: { name: "Street Polo Tee" },
    jacket: { name: "Midnight Bomber" },
    varsity: { name: "Farouche Varsity Jacket" },
    hoodie: { name: "Neon Alley Hoodie" },
  }),

  club: themedProducts({
    tee: { name: "Clubhouse Tee" },
    oversized: { name: "Squad Oversized Tee" },
    poptee: { name: "Pop Culture Tee" },
    polo: { name: "Coach Polo Tee" },
    jacket: { name: "Team Coach Jacket" },
    varsity: { name: "Club Varsity Jacket" },
    hoodie: { name: "Arena Hoodie" },
  }),
};
