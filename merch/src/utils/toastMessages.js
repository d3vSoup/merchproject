import toast from "react-hot-toast";

const ADDED_MESSAGES = [
  "Added to cart!",
  "Nice pick!",
  "Great choice!",
  "In your cart now",
  "Locked in!",
];

const REMOVED_MESSAGES = [
  "Removed from cart",
  "Taken out",
  "Removed!",
];

const WISHLIST_ADD = [
  "Saved to wishlist",
  "Added to your list!",
  "Wishlisted!",
];

const WISHLIST_REMOVE = [
  "Removed from wishlist",
  "Unwishlisted",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function toastCartAdd() {
  toast.success(pick(ADDED_MESSAGES));
}

export function toastCartRemove() {
  toast.success(pick(REMOVED_MESSAGES));
}

export function toastCartUpdate() {
  toast.success("Cart updated");
}

export function toastWishlistAdd() {
  toast.success(pick(WISHLIST_ADD));
}

export function toastWishlistRemove() {
  toast.success(pick(WISHLIST_REMOVE));
}
