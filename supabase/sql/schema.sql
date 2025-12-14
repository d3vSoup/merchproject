-- BMSCE Merchandise Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends backend user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  profile_percent INTEGER DEFAULT 50,
  name TEXT,
  phone TEXT,
  usn TEXT,
  branch TEXT,
  sem TEXT,
  pfp_url TEXT,
  resell_unlocked BOOLEAN DEFAULT FALSE,
  resell_banned_until TIMESTAMP WITH TIME ZONE,
  strike_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tab_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tab_key, product_id, variant)
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tab_key TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tab_key, product_id, variant)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resell profiles table
CREATE TABLE IF NOT EXISTS resell_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  sem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resell items table
CREATE TABLE IF NOT EXISTS resell_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  condition TEXT NOT NULL,
  year INTEGER,
  description TEXT,
  price_range TEXT,
  pictures TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_chat', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resell chats table
CREATE TABLE IF NOT EXISTS resell_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES resell_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  success BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_reported UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_accused UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES resell_items(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_resell_items_user_id ON resell_items(user_id);
CREATE INDEX IF NOT EXISTS idx_resell_items_status ON resell_items(status);
CREATE INDEX IF NOT EXISTS idx_resell_chats_buyer_id ON resell_chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_resell_chats_seller_id ON resell_chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_resell_chats_item_id ON resell_chats(item_id);
CREATE INDEX IF NOT EXISTS idx_resell_chats_is_active ON resell_chats(is_active);
CREATE INDEX IF NOT EXISTS idx_tickets_user_reported ON tickets(user_reported);
CREATE INDEX IF NOT EXISTS idx_tickets_user_accused ON tickets(user_accused);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE resell_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resell_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resell_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Cart policies
CREATE POLICY "Users can manage own cart" ON cart FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Resell profiles policies
CREATE POLICY "Users can manage own resell profile" ON resell_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Resell items policies
CREATE POLICY "Anyone can view active resell items" ON resell_items FOR SELECT USING (status = 'active' OR user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users can manage own resell items" ON resell_items FOR ALL USING (user_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Resell chats policies
CREATE POLICY "Users can view own chats" ON resell_chats FOR SELECT USING (buyer_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR seller_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users can create chats" ON resell_chats FOR INSERT WITH CHECK (buyer_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users can update own chats" ON resell_chats FOR UPDATE USING (buyer_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR seller_id IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Tickets policies
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (user_reported IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR user_accused IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (user_reported IN (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Note: For production, you'll need to set up Supabase Auth properly
-- The RLS policies above assume email-based matching, but you should use Supabase Auth JWT tokens

