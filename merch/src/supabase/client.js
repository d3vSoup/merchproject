// src/supabase/client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to get user ID by email (since we're using email-based auth from backend)
// Creates user if doesn't exist
export async function getUserIdByEmail(email) {
  if (!supabase || !email) return null;
  let { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  // If user doesn't exist, create them
  if (error || !data) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ email, profile_percent: 50 })
      .select('id')
      .single();
    if (createError) {
      console.error('Error creating user:', createError);
      return null;
    }
    return newUser.id;
  }
  return data.id;
}

// Users
export async function getUserByEmail(email) {
  if (!supabase || !email) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
}

export async function createOrUpdateUser(userData) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { onConflict: 'email' })
    .select()
    .single();
  if (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }
  return data;
}

// Wishlist
export async function getWishlist(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('wishlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
  return data || [];
}

export async function addToWishlist(userId, item) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('wishlist')
    .insert({
      user_id: userId,
      tab_key: item.tabKey,
      product_id: item.productId,
      variant: item.variant || null,
    })
    .select()
    .single();
  if (error) {
    console.error('Error adding to wishlist:', error);
    return null;
  }
  return data;
}

export async function removeFromWishlist(userId, item) {
  if (!supabase || !userId) return false;
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('tab_key', item.tabKey)
    .eq('product_id', item.productId)
    .eq('variant', item.variant || null);
  if (error) {
    console.error('Error removing from wishlist:', error);
    return false;
  }
  return true;
}

// Cart
export async function getCart(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('cart')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
  return data || [];
}

export async function updateCartItem(userId, item, quantity) {
  if (!supabase || !userId) return null;
  if (quantity <= 0) {
    // Remove item
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('tab_key', item.tabKey)
      .eq('product_id', item.productId)
      .eq('variant', item.variant || null);
    if (error) {
      console.error('Error removing from cart:', error);
      return null;
    }
    return { quantity: 0 };
  } else {
    // Upsert item
    const { data, error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        tab_key: item.tabKey,
        product_id: item.productId,
        variant: item.variant || null,
        quantity: quantity,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tab_key,product_id,variant' })
      .select()
      .single();
    if (error) {
      console.error('Error updating cart:', error);
      return null;
    }
    return data;
  }
}

// Orders
export async function createOrder(userId, orderData) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      items: orderData.items,
      total_amount: orderData.totalAmount,
      payment_status: 'pending',
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating order:', error);
    return null;
  }
  return data;
}

export async function getOrders(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data || [];
}

// Resell Profiles
export async function getResellProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('resell_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching resell profile:', error);
    return null;
  }
  return data;
}

export async function createResellProfile(userId, profileData) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('resell_profiles')
    .insert({
      user_id: userId,
      name: profileData.name,
      branch: profileData.branch,
      sem: profileData.sem,
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating resell profile:', error);
    return null;
  }
  // Update user to unlock resell
  await supabase
    .from('users')
    .update({ resell_unlocked: true })
    .eq('id', userId);
  return data;
}

// Resell Items
export async function getResellItems(status = 'active') {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('resell_items')
    .select('*, user:users(email, name)')
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching resell items:', error);
    return [];
  }
  return data || [];
}

export async function getUserResellItems(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('resell_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching user resell items:', error);
    return [];
  }
  return data || [];
}

export async function createResellItem(userId, itemData) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('resell_items')
    .insert({
      user_id: userId,
      title: itemData.title,
      condition: itemData.condition,
      year: itemData.year,
      description: itemData.description,
      price_range: itemData.priceRange,
      pictures: itemData.pictures || [],
      status: 'active',
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating resell item:', error);
    return null;
  }
  return data;
}

export async function updateResellItemStatus(itemId, status) {
  if (!supabase || !itemId) return null;
  const { data, error } = await supabase
    .from('resell_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();
  if (error) {
    console.error('Error updating resell item status:', error);
    return null;
  }
  return data;
}

// Resell Chats
export async function getUserChats(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('resell_chats')
    .select('*, item:resell_items(*), buyer:users!resell_chats_buyer_id_fkey(email, name), seller:users!resell_chats_seller_id_fkey(email, name)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
  return data || [];
}

export async function getActiveChatForItem(itemId, userId) {
  if (!supabase || !itemId || !userId) return null;
  const { data, error } = await supabase
    .from('resell_chats')
    .select('*')
    .eq('item_id', itemId)
    .eq('buyer_id', userId)
    .eq('is_active', true)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching active chat:', error);
    return null;
  }
  return data;
}

export async function createChat(itemId, buyerId, sellerId) {
  if (!supabase || !itemId || !buyerId || !sellerId) return null;
  // Check if user already has an active chat
  const existingChats = await getUserChats(buyerId);
  if (existingChats.length > 0) {
    throw new Error('You already have an active chat. Please close it first.');
  }
  const { data, error } = await supabase
    .from('resell_chats')
    .insert({
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: sellerId,
      messages: [],
      is_active: true,
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }
  // Update item status to under_chat
  await updateResellItemStatus(itemId, 'under_chat');
  return data;
}

export async function addMessageToChat(chatId, message) {
  if (!supabase || !chatId) return null;
  const chat = await supabase
    .from('resell_chats')
    .select('messages')
    .eq('id', chatId)
    .single();
  if (chat.error) return null;
  const messages = chat.data.messages || [];
  messages.push({
    ...message,
    timestamp: new Date().toISOString(),
  });
  const { data, error } = await supabase
    .from('resell_chats')
    .update({ 
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)
    .select()
    .single();
  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  return data;
}

export async function closeChat(chatId, success, reason) {
  if (!supabase || !chatId) return null;
  const { data, error } = await supabase
    .from('resell_chats')
    .update({
      is_active: false,
      success,
      closed_reason: reason,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', chatId)
    .select()
    .single();
  if (error) {
    console.error('Error closing chat:', error);
    return null;
  }
  // Update item status
  if (success) {
    await updateResellItemStatus(data.item_id, 'completed');
  } else {
    await updateResellItemStatus(data.item_id, 'active');
  }
  return data;
}

// Tickets
export async function createTicket(ticketData) {
  if (!supabase) return null;
  // ticketData should have userReported (userId), userAccused (userId), itemId, reason
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_reported: ticketData.userReported,
      user_accused: ticketData.userAccused,
      item_id: ticketData.itemId || null,
      reason: ticketData.reason,
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
  // Increment strike count manually
  const { data: accusedUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', ticketData.userAccused)
    .single();
  
  if (accusedUser) {
    const newStrikes = (accusedUser.strike_count || 0) + 1;
    await supabase
      .from('users')
      .update({ strike_count: newStrikes })
      .eq('id', accusedUser.id);
    
    // Ban if 3 strikes
    if (newStrikes >= 3) {
      await supabase
        .from('users')
        .update({ resell_banned_until: '9999-12-31T23:59:59Z' })
        .eq('id', accusedUser.id);
    }
  }
  return data;
}

// Storage helpers for image uploads
export async function uploadResellImage(userId, file) {
  if (!supabase || !userId || !file) {
    console.error('uploadResellImage: Missing supabase, userId, or file', { supabase: !!supabase, userId, file: !!file });
    return null;
  }
  
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('resell-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading image to Supabase:', error);
      // If bucket doesn't exist or permission error, provide helpful message
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        console.error('resell-images bucket may not exist. Please create it in Supabase Storage.');
      }
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('resell-images')
      .getPublicUrl(data.path);
      
    return publicUrl;
  } catch (err) {
    console.error('Unexpected error in uploadResellImage:', err);
    return null;
  }
}

