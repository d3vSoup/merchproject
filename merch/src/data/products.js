// src/data/products.js
export const BASE_PRODUCT_IDS = ['tee', 'oversized', 'poptee', 'polo', 'jacket', 'varsity', 'hoodie'];

const BASE_PRODUCTS = [
  {
    id: "tee",
    name: "Classic T-shirt",
    description: "Soft ring-spun cotton with event crest print.",
    price: 349,
    sleeveOptions: ["Half Sleeve", "Full Sleeve"],
    previewLabel: "Tee",
    swatch: ["#ff7a00", "#ffbf69"],
  },
  {
    id: "oversized",
    name: "Oversized T-shirt",
    description: "Relaxed drop-shoulder silhouette, premium GSM.",
    price: 399,
    sleeveOptions: ["Half Sleeve"],
    previewLabel: "Oversized",
    swatch: ["#f45c43", "#eb3349"],
  },
  {
    id: "poptee",
    name: "Pop T-shirt",
    description: "Vibrant all-over graphic for after-hours events.",
    price: 399,
    sleeveOptions: ["Half Sleeve", "Full Sleeve"],
    previewLabel: "Pop Tee",
    swatch: ["#8a2be2", "#ff6f91"],
  },
  {
    id: "polo",
    name: "Polo T-shirt",
    description: "Cut-and-sew collar with dual stripe taping.",
    price: 449,
    sleeveOptions: ["Half Sleeve", "Full Sleeve"],
    previewLabel: "Polo",
    swatch: ["#05668d", "#00a896"],
  },
  {
    id: "jacket",
    name: "Lightweight Jacket",
    description: "Windbreaker shell, mesh lining for Bengaluru evenings.",
    price: 699,
    previewLabel: "Jacket",
    swatch: ["#2d3436", "#636e72"],
  },
  {
    id: "varsity",
    name: "Varsity Jacket",
    description: "Wool blend body with faux-leather sleeves & chenille patch.",
    price: 799,
    previewLabel: "Varsity",
    swatch: ["#1b1464", "#5758bb"],
  },
  {
    id: "hoodie",
    name: "Premium Hoodie",
    description: "Fleece-lined hoodie with kangaroo pocket.",
    price: 699,
    previewLabel: "Hoodie",
    swatch: ["#312e81", "#4f46e5"],
  },
];

function themedProducts(overrides) {
  return BASE_PRODUCTS.map((product) => ({
    ...product,
    ...(overrides[product.id] || {}),
  }));
}

export const PRODUCT_CATALOG = {
  utsav: themedProducts({
    tee: { name: "Utsav Classic T-shirt", swatch: ["#ff7a00", "#ffd35c"] },
    oversized: { name: "Utsav Oversized Tee", swatch: ["#f45c43", "#ffb347"] },
    poptee: { name: "Carnival Pop T-shirt", swatch: ["#ff6b6b", "#feca57"] },
    polo: { name: "Festival Polo T-shirt", swatch: ["#ffc371", "#ff5f6d"] },
    jacket: { name: "Evening Jacket", swatch: ["#2d3436", "#4b6584"] },
    varsity: { name: "Utsav Varsity Jacket", swatch: ["#1b1464", "#5f27cd"] },
    hoodie: { name: "Sunset Hoodie", swatch: ["#ff9a9e", "#fad0c4"] },
  }),
  phaseshift: themedProducts({
    tee: { name: "Phaseshift Tee", swatch: ["#1f3f72", "#43b2ff"] },
    oversized: { name: "Neon Oversized Tee", swatch: ["#00c6fb", "#005bea"] },
    poptee: { name: "Hackathon Pop Tee", swatch: ["#7f53ac", "#647dee"] },
    polo: { name: "Circuit Polo Tee", swatch: ["#05668d", "#00a896"] },
    jacket: { name: "Lab Jacket", swatch: ["#0d1b2a", "#1b263b"] },
    varsity: { name: "Binary Varsity Jacket", swatch: ["#28313b", "#485461"] },
    hoodie: { name: "Aurora Hoodie", swatch: ["#2f80ed", "#1cb5e0"] },
  }),
  farouche: themedProducts({
    tee: { name: "Farouche Tee", swatch: ["#410c68", "#df5ef4"] },
    oversized: { name: "Hostelite Oversized Tee", swatch: ["#b721ff", "#21d4fd"] },
    poptee: { name: "Graffiti Pop Tee", swatch: ["#ff416c", "#ff4b2b"] },
    polo: { name: "Street Polo Tee", swatch: ["#3a1c71", "#d76d77"] },
    jacket: { name: "Midnight Bomber", swatch: ["#1f1c2c", "#928dab"] },
    varsity: { name: "Farouche Varsity Jacket", swatch: ["#20002c", "#cbb4d4"] },
    hoodie: { name: "Neon Alley Hoodie", swatch: ["#654ea3", "#eaafc8"] },
  }),
  club: themedProducts({
    tee: { name: "Clubhouse Tee", swatch: ["#0f5132", "#6ce6a3"] },
    oversized: { name: "Squad Oversized Tee", swatch: ["#2af598", "#009efd"] },
    poptee: { name: "Pop Culture Tee", swatch: ["#13547a", "#80d0c7"] },
    polo: { name: "Coach Polo Tee", swatch: ["#11998e", "#38ef7d"] },
    jacket: { name: "Team Coach Jacket", swatch: ["#0f9d58", "#34a853"] },
    varsity: { name: "Club Varsity Jacket", swatch: ["#0b8457", "#66bb6a"] },
    hoodie: { name: "Arena Hoodie", swatch: ["#1d976c", "#93f9b9"] },
  }),
};

