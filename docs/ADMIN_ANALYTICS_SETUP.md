# Admin Dashboard & Analytics Setup

## 1. Run Supabase Migration

Run the analytics and audit schema in your Supabase SQL Editor:

```bash
# File: supabase/sql/analytics_audit_schema.sql
```

This creates:
- **analytics_events** – stores page views, cart adds, checkout starts, orders placed, product views, wishlist adds
- **audit_log** – stores admin actions (product hide/restore, price changes, resell moderation)

## 2. Admin Dashboard

- **URL:** `/admin/dashboard` (admin only)
- **Metrics:** Page views, products browsed, cart adds, checkout starts, orders placed, revenue (paid), wishlist adds
- **Period filter:** 1, 7, 14, 30, or 90 days
- **Audit log:** Last 20 admin actions

## 3. Manage Orders – CSV Export

- **Today:** Exports orders for the current date
- **All:** Exports all orders
- **API:** `GET /api/admin/orders/export?date=YYYY-MM-DD` (optional date)

## 4. Analytics Tracking (Frontend)

Events are sent to `POST /api/analytics/track`:

| Event          | When                          |
|----------------|-------------------------------|
| page_view      | Route change                  |
| product_view   | Product modal opened          |
| cart_add       | Item added to cart            |
| checkout_start | Checkout button clicked        |
| order_placed   | Order created successfully    |
| wishlist_add   | Item added to wishlist        |

## 5. Audit Logging (Backend)

Logged automatically when admins:

- Create/update product overrides (name, price, hidden)
- Delete product overrides
- Hide/restore resell items

## 6. Health Check

- **URL:** `GET /api/health`
- **Response:** `{ ok, status, timestamp, supabaseConfigured }`
- Use for uptime monitoring (e.g. UptimeRobot, Pingdom)

## 7. Structured Logging

- **Request ID:** Every request gets `X-Request-ID` (or uses client-provided)
- **Log format:** JSON with `timestamp`, `level`, `message`, `requestId`, `method`, `path`, `status`, `durationMs`
- **Env:** Set `LOG_LEVEL=debug|info|warn|error` (default: info)
