# Setup Instructions

## 1. Run SQL Schemas

Go to Supabase SQL Editor and run these files in order:

1. `supabase/sql/orders_schema.sql` - Creates orders tables
2. `supabase/sql/admin_items_schema.sql` - Creates admin_items table for sold-out management

## 2. Git Configuration

The `.gitignore` has been moved to the root. To remove already-tracked files:

```bash
cd /Users/rik_mac/Desktop/merchproj
git rm -r --cached node_modules merch/node_modules backend/node_modules 2>/dev/null || true
git rm --cached .env merch/.env backend/.env 2>/dev/null || true
git add .gitignore
git commit -m "Move .gitignore to root and stop tracking node_modules & env files"
```

## 3. Profile Completion Logic

- **50%** - After Google sign-in
- **+15%** - When USN is added
- **+15%** - When phone number is added
- **+10%** - When branch OR semester is added (optional)
- **+10%** - When profile picture is added
- **Total: 100%**

## 4. Cart Fixes

- Variant normalization: Empty strings/undefined are converted to `null`
- Deletion now tries both null and normalized variant to handle mismatches
- Added `/api/cart/clear` endpoint to flush cart

## 5. Admin Orders

- Fixed to fetch from `confirmed_orders`, `cart`, and `wishlist` tables
- Shows email, name, USN, order number, items, total, payment status
- Can update payment status and refund orders

## 6. Sold-Out Management

- Created `admin_items` table to persist sold-out status
- Endpoints:
  - `GET /api/admin/items/soldouts` - Get all sold-out items
  - `POST /api/admin/items/soldout` - Update sold-out status

## 7. Club/Dept Tags

- Cart items now show which club/department they're from
- Tags are displayed as badges on cart items

