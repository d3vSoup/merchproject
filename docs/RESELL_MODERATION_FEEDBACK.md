# Resell Moderation & Feedback

## Setup

Run the migrations in Supabase SQL Editor (in order):

1. `supabase/sql/resell_moderation_feedback.sql`
2. `supabase/sql/resell_feedback_replies.sql` (adds reply/comment chains)

This adds:
- **moderation_status** to `resell_items` (pending, approved, rejected)
- **resell_feedback** table for buyer reviews

## Moderation Flow

1. **New listings** → `moderation_status: 'pending'`
2. **Buyers** see only approved items
3. **Admin** (Manage Items → Listed tab) can Approve or Reject pending items
4. **Seller** sees "Pending review" badge until approved

## Feedback (Buyer Reviews)

- **Who:** Any signed-in buyer interested in an item
- **Form:** Name (required), USN (required, alphanumeric), Rating (optional 1–5), Comments (optional)
- **Storage:** Persisted in Supabase; survives refresh
- **Display:** Shown in item detail modal with average rating
- **Replies:** Buyers and sellers can reply to feedback, forming comment chains

## Search & Filter

- **Search:** By title, description, price (debounced 350ms)
- **Filter:** Condition, Min year, Max year

## API Endpoints

- `GET /api/resell/items/available?q=&condition=&minYear=&maxYear=` – Search/filter
- `GET /api/resell/items/:id/feedback` – Get feedback for an item (includes replies via parent_id)
- `POST /api/resell/items/:id/feedback` – Submit feedback or reply (body: buyerName, buyerUsn, rating?, comments?, parentId? for replies)
- `POST /api/admin/resell/items/:id/approve` – Approve pending listing
- `POST /api/admin/resell/items/:id/reject` – Reject pending listing

## Mobile

- Responsive grid (1 column on mobile)
- Touch-friendly modals
- Filters stack vertically on small screens
