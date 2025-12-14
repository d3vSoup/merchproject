# Backend Setup Guide

## Environment Variables Required

Add these to your `backend/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# MongoDB (optional - uses file storage if not provided)
MONGO_URI=your_mongodb_uri

# Supabase (REQUIRED for cart/wishlist/orders)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Port
PORT=4000
```

## Important Notes

1. **Supabase Service Role Key**: This is a **secret key** that should NEVER be exposed to the frontend. It bypasses RLS policies and should only be used on the server.

2. **User Flow**:
   - User signs in with Google → Backend verifies token
   - Backend upserts user to Supabase → Returns `supabaseId` in user object
   - Frontend stores `user.supabaseId` in localStorage
   - All cart/wishlist/orders operations use backend APIs which use `supabaseId`

3. **No More "User Not Found"**: The backend automatically creates users in Supabase during Google sign-in, so `supabaseId` is always available.

## API Endpoints

### Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/update` - Update cart item quantity (body: `{ tabKey, productId, variant, quantity }`)

### Wishlist
- `GET /api/wishlist` - Get user's wishlist (requires auth)
- `POST /api/wishlist/toggle` - Toggle wishlist item (body: `{ tabKey, productId, variant }`)

### Orders
- `POST /api/orders/create` - Create order (body: `{ items, totalAmount }`)

All endpoints require `Authorization: Bearer <token>` header.

## Testing

1. Start backend: `cd backend && npm start`
2. Sign in with Google
3. Check browser DevTools → Application → LocalStorage → `user` object should contain `supabaseId`
4. Add items to cart → Check Supabase `cart` table
5. Add items to wishlist → Check Supabase `wishlist` table

