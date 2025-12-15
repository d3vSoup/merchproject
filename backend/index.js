// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:3000',
    'https://bmscemerch.vercel.app',
    'https://merchproject.vercel.app',
    /^https:\/\/.*\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json());

// configuration
const PORT = process.env.PORT || 4000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_prod';
const MONGO_URI = process.env.MONGO_URI || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Google client (for verifying id_token)
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Supabase Admin client (service role - server only)
let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key') {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log('Supabase Admin client initialized');
} else {
  console.warn('⚠️  Supabase not properly configured!');
  console.warn('   SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'MISSING');
  console.warn('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? (SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key' ? 'PLACEHOLDER (needs real key)' : 'Set') : 'MISSING');
  console.warn('   Cart/wishlist/orders will NOT work until this is fixed!');
}

// -------------- Simple storage fallback (file) --------------
// If MONGO_URI is provided, we'll use mongoose for storage.
// Otherwise use a simple file-backed Map for quick dev/testing.
let Users = null;
let usingMongoose = false;

async function initStorage() {
  if (MONGO_URI) {
    // use mongoose
    const mongoose = require('mongoose');
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      name: String,
      googleId: String,
      usn: String,
      phone: String,
      pfpUrl: String,
      profilePercent: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
    });
    Users = mongoose.model('User', userSchema);
    usingMongoose = true;
    console.log('Using MongoDB for storage');
  } else {
    // file-backed store
    const DB_FILE = path.join(__dirname, '_users.json');
    let data = {};
    try {
      if (fs.existsSync(DB_FILE)) {
        data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}');
      }
    } catch (err) {
      console.error('Failed to read users DB file, starting fresh', err);
      data = {};
    }
    Users = {
      async findOne(query) {
        const keys = Object.keys(data);
        for (const k of keys) {
          const u = data[k];
          let match = true;
          for (const qKey of Object.keys(query)) {
            if (u[qKey] !== query[qKey]) { match = false; break; }
          }
          if (match) return { ...u, _id: k };
        }
        return null;
      },
      async create(obj) {
        const id = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        data[id] = { ...obj, _id: id };
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return { ...data[id] };
      },
      async findById(id) {
        return data[id] ? { ...data[id] } : null;
      },
      async findByIdAndUpdate(id, patch, opts) {
        if (!data[id]) throw new Error('Not found');
        data[id] = { ...data[id], ...patch };
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return { ...data[id] };
      },
      async findOneAndUpdate(query, patch, opts) {
        const found = await this.findOne(query);
        if (!found) return null;
        const id = found._id;
        data[id] = { ...data[id], ...patch };
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return { ...data[id] };
      },
    };
    usingMongoose = false;
    console.log('Using file-backed users store (no Mongo URI provided).');
  }
}

// Profile completion: 50% start (Google sign-in/email), 100% with USN + name + semester
// email: 50%, usn: +20%, name: +20%, sem: +10% = 100%
function computePercent(user) {
  // Simplified: 50 = email from Google, 100 = profile completed (has required fields)
  if (!user) return 0;
  if (user.name && user.usn && user.sem) {
    return 100; // Profile complete when name, USN, and semester are filled
  }
  if (user.googleId || user.email) return 50; // Just Google sign-in
  return 0;
}

async function ensureSupabaseUserRecord(email, existingSupabaseId = null, additionalData = {}) {
  if (!supabaseAdmin || !email) {
    return { id: null, data: null };
  }
  try {
    if (existingSupabaseId) {
      const { data: byId } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', existingSupabaseId)
        .maybeSingle();
      if (byId) {
        // Update name if not set and we have it from Google
        if (!byId.name && additionalData.name) {
          await supabaseAdmin
            .from('users')
            .update({ name: additionalData.name })
            .eq('id', existingSupabaseId);
          byId.name = additionalData.name;
        }
        return { id: existingSupabaseId, data: byId };
      }
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      // Update name if not set and we have it from Google
      if (!existing.name && additionalData.name) {
        await supabaseAdmin
          .from('users')
          .update({ name: additionalData.name })
          .eq('id', existing.id);
        existing.name = additionalData.name;
      }
      return { id: existing.id, data: existing };
    }

    let profile = null;
    try {
      profile = await Users.findOne({ email });
    } catch (err) {
      console.warn('ensureSupabaseUserRecord: failed to load local profile', err.message);
    }

    const payload = {
      email,
      name: additionalData.name || profile?.name || null,
      usn: additionalData.usn || profile?.usn || null,
      phone: additionalData.phone || profile?.phone || null,
      branch: profile?.branch || null,
      sem: profile?.sem || null,
      profile_percent: profile ? computePercent(profile) : 50
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([payload])
      .select('*')
      .single();

    if (insertError) {
      console.error('ensureSupabaseUserRecord insert error:', insertError);
      return { id: null, data: null };
    }

    return { id: inserted.id, data: inserted };
  } catch (err) {
    console.error('ensureSupabaseUserRecord error:', err);
    return { id: null, data: null };
  }
}

// Normalize variant to handle null/undefined/empty string consistently
function normVariant(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
}

// -------------- Auth helpers --------------
function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Enhanced auth middleware: verifies JWT and loads Supabase user ID
async function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.split(' ')[1];
  if (!token) {
    console.error('Auth middleware: No token provided');
    return res.status(401).json({ message: 'Authorization required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;

    // Get Supabase user ID from email (non-blocking, don't fail if Supabase is down)
    if (supabaseAdmin && payload.email) {
      try {
        const { data: sbUser, error: sbError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', payload.email)
          .maybeSingle();
        
        if (sbUser) {
          req.auth.supabaseId = sbUser.id;
        } else if (sbError) {
          console.warn('Auth middleware: Could not fetch Supabase user:', sbError.message);
          // Continue without supabaseId - will be created in cart/wishlist endpoints if needed
        }
      } catch (e) {
        console.warn('Auth middleware: Supabase error (non-fatal):', e.message);
        // Continue without supabaseId
      }
    }

    next();
  } catch (err) {
    console.error('Auth middleware: Token verification failed:', err.message);
    console.error('Token preview:', token.substring(0, 20) + '...');
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}

// -------------- multer setup for file uploads --------------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Memory storage for Supabase uploads (resell images)
const memoryStorage = multer.memoryStorage();

// Disk storage for local file uploads (pfp)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `pfp_${Date.now()}${Math.floor(Math.random()*900)+100}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (for resell images)
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) cb(new Error('Only image uploads allowed'));
    else cb(null, true);
  },
});

// Memory upload for resell images (goes directly to Supabase)
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) cb(new Error('Only image uploads allowed'));
    else cb(null, true);
  },
});

// serve uploads statically (development)
app.use('/uploads', express.static(uploadDir));

// -------------- Routes --------------

// test
app.get('/', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Diagnostic endpoint
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'),
    supabaseUrl: SUPABASE_URL ? 'Set' : 'Missing',
    supabaseKey: SUPABASE_SERVICE_ROLE_KEY ? (SUPABASE_SERVICE_ROLE_KEY === 'your_service_role_key' ? 'PLACEHOLDER - NEEDS REAL KEY' : 'Set') : 'Missing'
  });
});

// POST /api/auth/google
// body: { id_token }
app.post('/api/auth/google', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ message: 'id_token required' });

  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ message: 'Server missing GOOGLE_CLIENT_ID env' });

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
  } catch (err) {
    console.error('Google token verify error', err && err.toString());
    return res.status(400).json({ message: 'Invalid Google token' });
  }

  const payload = ticket.getPayload();
  const email = payload.email;
  const name = payload.name || '';
  const googleId = payload.sub;

  const allowedDomains = ['@bmsce.ac.in', '@bmsca.org', '@bmscl.ac.in'];
  if (!email || !allowedDomains.some(domain => email.endsWith(domain))) {
    return res.status(403).json({ message: 'Use a BMSCE Google account (@bmsce.ac.in, @bmsca.org, or @bmscl.ac.in) only' });
  }

  // find or create
  try {
    let user = await Users.findOne({ email });
    if (!user) {
      const newUser = {
        email,
        name,
        googleId,
        usn: null,
        phone: null,
        pfpUrl: null,
        profilePercent: 50,
        createdAt: new Date().toISOString(),
      };
      user = await Users.create(newUser);
    } else {
      // update googleId and ensure profilePercent at least 50
      const patch = { googleId };
      if (!user.profilePercent || user.profilePercent < 50) patch.profilePercent = 50;
      if (usingMongoose) {
        user.googleId = googleId;
        user.profilePercent = Math.max(user.profilePercent || 0, 50);
        await user.save();
      } else {
        user = await Users.findOneAndUpdate({ email }, patch, { new: true, upsert: true });
      }
    }

    // sign token (include uid and email)
    const uid = usingMongoose ? user._id.toString() : user._id;
    const token = signJwt({ uid, email });

    console.log('✅ Google sign-in successful for:', email);
    console.log('   Token created, length:', token.length);

    // --- Upsert to Supabase users table and get supabase id ---
    let supabaseId = null;
    try {
      if (supabaseAdmin) {
        // First try to get existing user
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          supabaseId = existingUser.id;
          // Update user info
          await supabaseAdmin
            .from('users')
            .update({
              google_id: googleId,
              name: name,
              pfp_url: user.pfpUrl || null,
              profile_percent: user.profilePercent || 50
            })
            .eq('id', supabaseId);
          console.log('   Supabase user updated, ID:', supabaseId);
        } else {
          // Create new user - try insert, if it fails due to unique constraint, try to get it
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert([{
              email: email,
              google_id: googleId,
              name: name,
              pfp_url: user.pfpUrl || null,
              profile_percent: user.profilePercent || 50
            }])
            .select('id')
            .single();

          if (createError) {
            // If error is due to unique constraint (email already exists), try to fetch it
            if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
              console.warn('   User already exists, fetching...');
              const { data: existing } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();
              if (existing) {
                supabaseId = existing.id;
                console.log('   ✅ Found existing Supabase user, ID:', supabaseId);
              }
            } else {
              console.error('❌ Failed to create user in Supabase:', createError);
              console.error('   Error code:', createError.code);
              console.error('   Error message:', createError.message);
              console.error('   Error details:', JSON.stringify(createError, null, 2));
            }
          } else if (newUser) {
            supabaseId = newUser.id;
            console.log('   ✅ Supabase user created, ID:', supabaseId);
          }
        }
      } else {
        console.warn('   Supabase Admin not available, skipping upsert');
      }
    } catch (e) {
      console.error('❌ Supabase upsert error:', e);
      console.error('   Error stack:', e.stack);
    }

    // Fetch full profile from Supabase to return to frontend
    let fullProfile = { ...user.toObject ? user.toObject() : user, supabaseId };
    
    if (supabaseAdmin && supabaseId) {
      try {
        const { data: sbUser } = await supabaseAdmin
          .from('users')
          .select('id, email, name, usn, phone, branch, sem, profile_percent, pfp_url')
          .eq('id', supabaseId)
          .single();
        
        if (sbUser) {
          // Calculate profile percent from actual data (authoritative)
          // Profile is 100% if name, USN, and sem are all present
          const calculatedPercent = (sbUser.name && sbUser.usn && sbUser.sem) ? 100 : 50;
          
          // Use Supabase data as authoritative source for profile fields
          fullProfile = {
            id: sbUser.id,
            email: sbUser.email,
            name: sbUser.name || fullProfile.name || null,
            usn: sbUser.usn || null,
            phone: sbUser.phone || null,
            branch: sbUser.branch || null,
            sem: sbUser.sem || null,
            profilePercent: calculatedPercent, // Calculate from actual data
            pfpUrl: sbUser.pfp_url || null,
            supabaseId: sbUser.id
          };
          console.log('   ✅ Loaded full profile from Supabase, profilePercent:', calculatedPercent);
        }
      } catch (e) {
        console.warn('   Could not fetch full profile from Supabase:', e.message);
        // Continue with MongoDB user data as fallback
      }
    }

    // return token + user (which now includes full profile from Supabase)
    return res.json({ token, user: fullProfile });
  } catch (err) {
    console.error('Create/find user error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/me - Get current user profile (from Supabase)
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    // Get user from Supabase (authoritative source)
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      // Try to get from email
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(404).json({ message: 'User not found in database' });
      }
      supabaseId = ensured.id;
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Fetch user from Supabase
    const { data: sbUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, usn, phone, branch, sem, profile_percent, pfp_url')
      .eq('id', supabaseId)
      .single();

    if (error) {
      console.error('Error fetching user from Supabase:', error);
      return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }

    if (!sbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate profile percent from actual data (authoritative)
    // Profile is 100% if name, USN, and sem are all present
    const calculatedPercent = (sbUser.name && sbUser.usn && sbUser.sem) ? 100 : 50;
    
    // Map Supabase user to frontend user format
    const user = {
      id: sbUser.id,
      email: sbUser.email,
      name: sbUser.name || null,
      usn: sbUser.usn || null,
      phone: sbUser.phone || null,
      branch: sbUser.branch || null,
      sem: sbUser.sem || null,
      profilePercent: calculatedPercent, // Calculate from actual data, not stored value
      pfpUrl: sbUser.pfp_url || null,
      supabaseId: sbUser.id
    };

    return res.json({ user });
  } catch (err) {
    console.error('GET /api/me error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/uploads/pfp (multipart, auth)
app.post('/api/uploads/pfp', authMiddleware, upload.single('pfp'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // In prod you should upload to S3 and provide public URL
    const url = `/uploads/${req.file.filename}`;
    return res.json({ url });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
});

// GET /api/resell/items - Get user's resell items (uses service role, bypasses RLS)
app.get('/api/resell/items', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    // Get user's Supabase ID
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    // Get all items (active and past) for the user
    const { data, error } = await supabaseAdmin
      .from('resell_items')
      .select('*')
      .eq('user_id', supabaseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resell items:', error);
      return res.status(500).json({ message: 'Failed to fetch items', error: error.message });
    }

    // Separate active and past listings
    const now = new Date().toISOString();
    const activeItems = [];
    const pastItems = [];
    
    (data || []).forEach(item => {
      const isExpired = item.expires_at && new Date(item.expires_at) < new Date(now);
      const isDeleted = item.deleted_at !== null;
      
      if (isDeleted || isExpired) {
        pastItems.push(item);
      } else {
        activeItems.push(item);
      }
    });

    return res.json({ 
      items: activeItems,
      pastItems: pastItems
    });
  } catch (err) {
    console.error('Resell items fetch error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/resell/items/available - Get all active resell items except current user's own items (for buyers)
app.get('/api/resell/items/available', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    // Get user's Supabase ID
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    // Get all active, non-expired, non-deleted items except current user's own items
    const now = new Date().toISOString();
    const { data: allItems, error: fetchError } = await supabaseAdmin
      .from('resell_items')
      .select('*')
      .eq('status', 'active')
      .neq('user_id', supabaseId) // Exclude current user's own listings
      .is('deleted_at', null) // Not deleted
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching available resell items:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch items', error: fetchError.message });
    }

    // Filter out expired items in JavaScript (Supabase .or() can be tricky with nulls)
    const data = (allItems || []).filter(item => {
      if (!item.expires_at) return true; // No expiration date means it's still valid
      return new Date(item.expires_at) > new Date(now);
    });

    const error = null; // No error after filtering

    if (error) {
      console.error('Error fetching available resell items:', error);
      return res.status(500).json({ message: 'Failed to fetch items', error: error.message });
    }

    return res.json({ items: data || [] });
  } catch (err) {
    console.error('Resell available items fetch error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/resell/create-item - Create resell listing (uses service role, bypasses RLS)
app.post('/api/resell/create-item', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    const { title, condition, year, description, priceRange, pictures } = req.body;

    if (!title || !description || !pictures || pictures.length < 6) {
      return res.status(400).json({ message: 'Title, description, and at least 6 pictures are required' });
    }

    // Ensure user exists in Supabase
    const { data: sbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', req.auth.email)
      .single();

    if (userError || !sbUser) {
      // Try to create user if doesn't exist
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(400).json({ message: 'User missing in Supabase users table. Please sign in again.' });
      }
      var supabaseId = ensured.id;
    } else {
      var supabaseId = sbUser.id;
    }

    const { data, error } = await supabaseAdmin
      .from('resell_items')
      .insert([{
        user_id: supabaseId, // Use sbUser.id from the check above
        title,
        condition: condition || 'new',
        year: year || null,
        description,
        price_range: priceRange || null,
        pictures: pictures || [],
        status: 'active',
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating resell item:', error);
      return res.status(500).json({ message: 'Failed to create listing', error: error.message });
    }

    return res.json({ item: data });
  } catch (err) {
    console.error('Resell item creation error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/resell/items/:id - Soft delete a resell listing
app.delete('/api/resell/items/:id', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    const itemId = req.params.id;
    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    // Get user's Supabase ID
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    // Verify the item belongs to the user
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('resell_items')
      .select('user_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.user_id !== supabaseId) {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }

    // Soft delete by setting deleted_at
    const { error } = await supabaseAdmin
      .from('resell_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting resell item:', error);
      return res.status(500).json({ message: 'Failed to delete listing', error: error.message });
    }

    return res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (err) {
    console.error('Resell item deletion error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/resell/seller-info/:userId - Get seller contact info for buyers
app.get('/api/resell/seller-info/:userId', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    const sellerId = req.params.userId;
    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    // Fetch seller info from users table
    const { data: seller, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone')
      .eq('id', sellerId)
      .single();

    if (error) {
      console.error('Error fetching seller info:', error);
      return res.status(404).json({ message: 'Seller not found' });
    }

    return res.json({ 
      seller: {
        name: seller.name || null,
        email: seller.email || null,
        phone: seller.phone || null
      }
    });
  } catch (err) {
    console.error('Get seller info error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/resell/items/:id/relist - Relist an expired or deleted item
app.post('/api/resell/items/:id/relist', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    const itemId = req.params.id;
    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    console.log('Relist request for item:', itemId, 'by user:', req.auth.email);

    // Get user's Supabase ID
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        console.error('Relist failed: Could not get user ID');
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    console.log('User Supabase ID:', supabaseId);

    // Verify the item exists
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('resell_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      console.error('Error fetching item:', fetchError);
      return res.status(404).json({ message: 'Item not found', error: fetchError.message });
    }
    
    if (!item) {
      console.error('Item not found:', itemId);
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log('Found item:', item.id, 'owner:', item.user_id);

    if (item.user_id !== supabaseId) {
      console.error('Permission denied: item owner', item.user_id, '!= current user', supabaseId);
      return res.status(403).json({ message: 'You can only relist your own listings' });
    }

    // Relist by clearing deleted_at and setting new expires_at (30 days from now)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    console.log('Relisting item:', itemId, 'new expires_at:', newExpiresAt.toISOString());

    // Build update object - only include updated_at if the column exists
    const updateObj = { 
      deleted_at: null,
      expires_at: newExpiresAt.toISOString(),
      status: 'active'
    };

    const { data, error } = await supabaseAdmin
      .from('resell_items')
      .update(updateObj)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error relisting item:', error);
      return res.status(500).json({ message: 'Failed to relist item', error: error.message });
    }

    if (!data) {
      console.error('No data returned after relist update');
      return res.status(500).json({ message: 'Relist succeeded but no data returned' });
    }

    console.log('Item relisted successfully:', data.id, 'status:', data.status);
    return res.json({ item: data, message: 'Item relisted successfully' });
  } catch (err) {
    console.error('Resell item relist error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/resell/items/list (duplicate endpoint - keeping for backward compatibility, but /api/resell/create-item is preferred)
app.post("/api/resell/items/list", authMiddleware, async (req, res) => {
  try {
    const { title, description, priceRange, condition, year, pictures } = req.body;

    if (!title || !description || !pictures || pictures.length < 6) {
      return res.status(400).json({ message: "Title, description, and at least 6 pictures are required" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    // Ensure user exists in Supabase
    const { data: sbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', req.auth.email)
      .single();

    if (userError || !sbUser) {
      // Try to create user if doesn't exist
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(400).json({ message: 'User missing in Supabase users table. Please sign in again.' });
      }
      var supabaseId = ensured.id;
    } else {
      var supabaseId = sbUser.id;
    }

    // Insert resell item
    const { data: item, error } = await supabaseAdmin
      .from("resell_items")
      .insert([
        {
          user_id: supabaseId,
          title,
          description,
          price_range: priceRange || null,
          condition: condition || 'new',
          year: year || null,
          pictures: pictures || [],
          status: "active",
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Resell item insert error:", error);
      return res.status(500).json({ message: "Failed to list item", error: error.message });
    }

    return res.json({ ok: true, item });
  } catch (err) {
    console.error("Listing error:", err);
    return res.status(500).json({ message: "Failed to list item", error: err.message });
  }
});

// POST /api/resell/upload-image - Upload resell image to Supabase Storage (uses service role, bypasses RLS)
app.post('/api/resell/upload-image', authMiddleware, uploadMemory.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    // Get user's Supabase ID
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    // Upload to Supabase Storage using service role (bypasses RLS)
    const fileExt = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `${supabaseId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Use buffer from memory storage
    const { data, error } = await supabaseAdmin.storage
      .from('resell-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found') || error.statusCode === 404) {
        return res.status(500).json({ 
          message: 'Storage bucket "resell-images" not found. Please create it in Supabase Dashboard → Storage. See STORAGE_SETUP.md for instructions.',
          error: error.message 
        });
      }
      return res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('resell-images')
      .getPublicUrl(data.path);

    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('Resell image upload error', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// POST /api/user/profile (auth) -> { usn, phone, pfpUrl, name, branch, sem (optional) }
app.post('/api/user/profile', authMiddleware, async (req, res) => {
  const { usn, phone, pfpUrl, name, branch, sem } = req.body || {};
  try {
    const uid = req.auth.uid;
    // load user
    let user = usingMongoose ? await Users.findById(uid) : await Users.findById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // update fields
    const patch = {};
    if (usn !== undefined) patch.usn = usn;
    if (phone !== undefined) patch.phone = phone;
    if (pfpUrl !== undefined) patch.pfpUrl = pfpUrl;
    if (name !== undefined) patch.name = name;
    if (branch !== undefined) patch.branch = branch;
    if (sem !== undefined) patch.sem = sem;

    if (usingMongoose) {
      if (patch.usn !== undefined) user.usn = patch.usn;
      if (patch.phone !== undefined) user.phone = patch.phone;
      if (patch.pfpUrl !== undefined) user.pfpUrl = patch.pfpUrl;
      if (patch.name !== undefined) user.name = patch.name;
      if (patch.branch !== undefined) user.branch = patch.branch;
      if (patch.sem !== undefined) user.sem = patch.sem;
      user.profilePercent = computePercent(user);
      await user.save();
    } else {
      const newObj = { ...user, ...patch };
      newObj.profilePercent = computePercent(newObj);
      await Users.findByIdAndUpdate(user._id, newObj);
      user = newObj;
    }

      // Also update in Supabase
      if (supabaseAdmin && req.auth.supabaseId) {
        console.log('Syncing profile to Supabase by ID:', req.auth.supabaseId);
        console.log('  USN:', user.usn, '- Name:', user.name, '- Phone:', user.phone);
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            usn: user.usn || null,
            phone: user.phone || null,
            pfp_url: user.pfpUrl || null,
            name: user.name || null,
            branch: user.branch || null,
            sem: user.sem || null,
            profile_percent: user.profilePercent
          })
          .eq('id', req.auth.supabaseId);
        
        if (updateError) {
          console.error('Failed to sync profile to Supabase:', updateError);
        } else {
          console.log('  Profile synced successfully');
        }
      } else if (supabaseAdmin && req.auth.email) {
        // Fallback: update by email if supabaseId not available
        console.log('Syncing profile to Supabase by email:', req.auth.email);
        console.log('  USN:', user.usn, '- Name:', user.name, '- Phone:', user.phone);
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            usn: user.usn || null,
            phone: user.phone || null,
            pfp_url: user.pfpUrl || null,
            name: user.name || null,
            branch: user.branch || null,
            sem: user.sem || null,
            profile_percent: user.profilePercent
          })
          .eq('email', req.auth.email);
        
        if (updateError) {
          console.error('Failed to sync profile to Supabase:', updateError);
        } else {
          console.log('  Profile synced successfully');
        }
      } else {
        console.warn('Cannot sync to Supabase: no supabaseId or email available');
      }

    if (!req.auth.supabaseId && supabaseAdmin) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (ensured.id) {
        req.auth.supabaseId = ensured.id;
      }
    }
    if (req.auth.supabaseId) {
      user.supabaseId = req.auth.supabaseId;
    }

    return res.json({ user });
  } catch (err) {
    console.error('Profile update error', err);
    return res.status(500).json({ message: 'Profile update failed' });
  }
});

// GET /api/user/supabase-id (ensure Supabase user exists, return ID)
app.get('/api/user/supabase-id', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    const ensured = await ensureSupabaseUserRecord(req.auth.email, req.auth.supabaseId);
    if (!ensured.id) {
      return res.status(500).json({ message: 'Unable to ensure Supabase user' });
    }
    req.auth.supabaseId = ensured.id;
    return res.json({ supabaseId: ensured.id });
  } catch (err) {
    console.error('Get supabase id error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ========== CART ROUTES ==========

// GET /api/cart
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase Admin not initialized');
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    
    // Ensure user exists in Supabase
    let supabaseId = req.auth.supabaseId;
    if (!supabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      supabaseId = ensured.id;
    }

    const { data, error } = await supabaseAdmin
      .from('cart')
      .select('*')
      .eq('user_id', supabaseId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get cart error:', error);
      return res.status(500).json({ message: 'Failed to fetch cart' });
    }

    return res.json({ items: data || [] });
  } catch (err) {
    console.error('Cart fetch error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/cart/update
app.post('/api/cart/update', authMiddleware, async (req, res) => {
  try {
    const supabaseId = req.auth.supabaseId;
    if (!supabaseAdmin) {
      console.error('Supabase Admin not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    // Ensure user exists in Supabase with all profile data
    let finalSupabaseId = req.auth.supabaseId;
    if (!finalSupabaseId) {
      const ensured = await ensureSupabaseUserRecord(req.auth.email);
      if (!ensured.id) {
        return res.status(500).json({ message: 'Failed to get user ID' });
      }
      finalSupabaseId = ensured.id;
      req.auth.supabaseId = finalSupabaseId;
    } else {
      // Sync user profile data from local store to Supabase (non-blocking for performance)
      Users.findOne({ email: req.auth.email }).then(localProfile => {
        if (localProfile) {
          supabaseAdmin
            .from('users')
            .update({
              name: localProfile.name || null,
              usn: localProfile.usn || null,
              phone: localProfile.phone || null,
              branch: localProfile.branch || null,
              sem: localProfile.sem || null,
              profile_percent: computePercent(localProfile)
            })
            .eq('id', finalSupabaseId)
            .then(() => {
              // Silently updated - don't block cart operation
            })
            .catch(err => {
              console.warn('Failed to sync user profile in cart update:', err.message);
            });
        }
      }).catch(err => {
        console.warn('Failed to fetch local profile for sync:', err.message);
      });
    }

    const { tabKey, productId, variant, quantity, clubOrDept } = req.body;
    if (!tabKey || !productId || quantity === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Normalize variant to handle null/undefined/empty string
    const normVar = normVariant(variant);
    const normClub = clubOrDept || null;

    if (quantity <= 0) {
      // Delete item - match including club_or_dept
      let deleteQuery = supabaseAdmin
        .from('cart')
        .delete()
        .eq('user_id', finalSupabaseId)
        .eq('tab_key', tabKey)
        .eq('product_id', productId);
      
      // Handle variant
      if (normVar !== null) {
        deleteQuery = deleteQuery.eq('variant', normVar);
      } else {
        deleteQuery = deleteQuery.is('variant', null);
      }
      
      // Handle club_or_dept
      if (normClub !== null) {
        deleteQuery = deleteQuery.eq('club_or_dept', normClub);
      } else {
        deleteQuery = deleteQuery.is('club_or_dept', null);
      }
      
      const { error } = await deleteQuery;
      
      if (error) {
        console.error('Delete cart item error:', { error, tabKey, productId, variant: normVar, clubOrDept: normClub, finalSupabaseId });
        return res.status(500).json({ message: 'Failed to remove item', error: error.message });
      }

      return res.json({ success: true });
    } else {
      // Upsert item - check if exists first, then update or insert
      let findQuery = supabaseAdmin
        .from('cart')
        .select('id, quantity')
        .eq('user_id', finalSupabaseId)
        .eq('tab_key', tabKey)
        .eq('product_id', productId);
      
      // Handle variant
      if (normVar !== null) {
        findQuery = findQuery.eq('variant', normVar);
      } else {
        findQuery = findQuery.is('variant', null);
      }
      
      // Handle club_or_dept
      if (normClub !== null) {
        findQuery = findQuery.eq('club_or_dept', normClub);
      } else {
        findQuery = findQuery.is('club_or_dept', null);
      }
      
      const { data: existing, error: checkError } = await findQuery.maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing cart item:', checkError);
        return res.status(500).json({ message: 'Failed to check cart', error: checkError.message });
      }

      let data, error;
      if (existing) {
        // Update existing
        const result = await supabaseAdmin
          .from('cart')
          .update({ quantity, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new
        const result = await supabaseAdmin
          .from('cart')
          .insert([{
            user_id: finalSupabaseId,
            tab_key: tabKey,
            product_id: productId,
            variant: normVar,
            quantity: quantity,
            club_or_dept: normClub
          }])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Update cart error:', error);
        return res.status(500).json({ 
          message: 'Failed to update cart', 
          error: error.message,
          details: error
        });
      }

      return res.json({ item: data, success: true });
    }
  } catch (err) {
    console.error('Cart update error', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
});

// ========== WISHLIST ROUTES ==========

// GET /api/wishlist
app.get('/api/wishlist', authMiddleware, async (req, res) => {
  try {
    let supabaseId = req.auth.supabaseId;
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    
    if (!supabaseId) {
      // Get or create user
      const { data: sbUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', req.auth.email)
        .maybeSingle();
      
      if (sbUser) {
        supabaseId = sbUser.id;
      } else {
        const { data: newUser } = await supabaseAdmin
          .from('users')
          .insert([{ email: req.auth.email, profile_percent: 50 }])
          .select('id')
          .single();
        if (newUser) supabaseId = newUser.id;
      }
    }
    
    if (!supabaseId) {
      return res.status(500).json({ message: 'Failed to get user ID' });
    }

    const { data, error } = await supabaseAdmin
      .from('wishlist')
      .select('*')
      .eq('user_id', supabaseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get wishlist error:', error);
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.error('Wishlist table does not exist. Run: supabase/sql/wishlist_schema.sql');
        return res.json({ items: [], message: 'Wishlist table not set up yet' });
      }
      return res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
    }

    return res.json({ items: data || [] });
  } catch (err) {
    console.error('Wishlist fetch error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/wishlist/toggle
app.post('/api/wishlist/toggle', authMiddleware, async (req, res) => {
  try {
    let supabaseId = req.auth.supabaseId;
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    
    if (!supabaseId) {
      // Get or create user
      const { data: sbUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', req.auth.email)
        .maybeSingle();
      
      if (sbUser) {
        supabaseId = sbUser.id;
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert([{ email: req.auth.email, profile_percent: 50 }])
          .select('id')
          .single();
        if (createError) {
          console.error('Failed to create user for wishlist:', createError);
          return res.status(500).json({ message: 'Failed to create user', error: createError.message });
        }
        if (newUser) supabaseId = newUser.id;
      }
    }
    
    if (!supabaseId) {
      return res.status(500).json({ message: 'Failed to get user ID' });
    }

    const { tabKey, productId, variant } = req.body;
    if (!tabKey || !productId) {
      return res.status(400).json({ message: 'Missing required fields: tabKey and productId are required' });
    }

    console.log('Wishlist toggle:', { tabKey, productId, variant, supabaseId });

    // Check if item exists - handle variant null matching properly
    let query = supabaseAdmin
      .from('wishlist')
      .select('id')
      .eq('user_id', supabaseId)
      .eq('tab_key', tabKey)
      .eq('product_id', productId);
    
    if (variant) {
      query = query.eq('variant', variant);
    } else {
      query = query.is('variant', null);
    }
    
    const { data: existing, error: checkError } = await query.maybeSingle();

    if (checkError) {
      console.error('Check wishlist error:', checkError);
      // If table doesn't exist, return a helpful message
      if (checkError.code === '42P01' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
        return res.status(500).json({ 
          message: 'Wishlist table not found. Please run the SQL schema from supabase/sql/wishlist_schema.sql',
          error: checkError.message 
        });
      }
      return res.status(500).json({ message: 'Failed to check wishlist', error: checkError.message });
    }

    if (existing) {
      // Remove
      const { error } = await supabaseAdmin
        .from('wishlist')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Remove wishlist error:', error);
        return res.status(500).json({ message: 'Failed to remove from wishlist', error: error.message });
      }

      console.log('Removed from wishlist');
      return res.json({ added: false });
    } else {
      // Add
      const { data, error } = await supabaseAdmin
        .from('wishlist')
        .insert([{
          user_id: supabaseId,
          tab_key: tabKey,
          product_id: productId,
          variant: variant || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Add wishlist error:', error);
        // If table doesn't exist, return a helpful message
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return res.status(500).json({ 
            message: 'Wishlist table not found. Please run the SQL schema from supabase/sql/wishlist_schema.sql',
            error: error.message 
          });
        }
        return res.status(500).json({ message: 'Failed to add to wishlist', error: error.message });
      }

      console.log('Added to wishlist:', data?.id);
      return res.json({ added: true, item: data });
    }
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ========== ORDERS ROUTES ==========

// POST /api/orders/create
app.post('/api/orders/create', authMiddleware, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }

    let supabaseId = req.auth.supabaseId;
    let ensured = await ensureSupabaseUserRecord(req.auth.email, supabaseId);
    if (!ensured.id) {
      return res.status(500).json({ message: 'Failed to get user ID' });
    }
    supabaseId = ensured.id;
    req.auth.supabaseId = supabaseId;

    // Check profile completion - must be 100% to place order
    let { data: userData } = ensured.data
      ? { data: ensured.data }
      : await supabaseAdmin
          .from('users')
          .select('profile_percent, name, usn, email, phone, sem')
          .eq('id', supabaseId)
          .maybeSingle();

    if (!userData) {
      userData = {};
    }

    if (userData.profile_percent === undefined || userData.profile_percent === null || userData.profile_percent < 100) {
      try {
        const localProfile = await Users.findOne({ email: req.auth.email });
        if (localProfile) {
          const computed = computePercent(localProfile);
          if (!userData.profile_percent || userData.profile_percent !== computed) {
            await supabaseAdmin
              .from('users')
              .update({
                profile_percent: computed,
                name: localProfile.name || null,
                usn: localProfile.usn || null,
                phone: localProfile.phone || null,
                sem: localProfile.sem || null,
                branch: localProfile.branch || null
              })
              .eq('id', supabaseId);
            userData = {
              profile_percent: computed,
              name: localProfile.name || userData.name || null,
              usn: localProfile.usn || userData.usn || null,
              email: req.auth.email,
              phone: localProfile.phone || userData.phone || null,
              sem: localProfile.sem || userData.sem || null,
              branch: localProfile.branch || userData.branch || null,
            };
          }
        }
      } catch (syncErr) {
        console.warn('Failed to sync profile percent from local user', syncErr.message);
      }
    }

    if (!userData.profile_percent || userData.profile_percent < 100) {
      return res.status(400).json({
        message: 'Profile must be 100% complete to place order. Please add USN, name, and semester in your profile.',
        profilePercent: userData?.profile_percent || 0
      });
    }

    const { items, totalAmount } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    const profileDetails = {
      name: userData?.name || null,
      usn: userData?.usn || null,
      email: userData?.email || req.auth.email,
      phone: userData?.phone || null
    };

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([{
        user_id: supabaseId,
        items: items,
        total_amount: totalAmount,
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ message: 'Failed to create order' });
    }

    // Clear cart after order creation
    await supabaseAdmin
      .from('cart')
      .delete()
      .eq('user_id', supabaseId);

    // Also create entry in confirmed_orders table
    const { data: sbUser, error: userErr } = await supabaseAdmin
  .from("users")
  .select("id, name, email, usn, phone")
  .eq("id", supabaseId)
  .single();

if (userErr || !sbUser) {
  console.error("User not found for confirmed_orders:", userErr);
}

// Create order number
const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

// Insert into confirmed_orders with user metadata
const { data: confirmedOrder, error: orderErr } = await supabaseAdmin
  .from("confirmed_orders")
  .insert([
    {
      user_id: supabaseId,
      order_number: orderNumber,
      items,
      total_amount: totalAmount,
      payment_status: "pending",
      user_name: sbUser?.name || "Unknown",
      user_email: sbUser?.email || req.auth.email,
      user_usn: sbUser?.usn || "-",
      user_phone: sbUser?.phone || "-",
    }
  ])
  .select()
  .single();

if (orderErr) {
  console.error("Confirmed order insert error:", orderErr);
}

    return res.json({ order: data, orderNumber });
  } catch (err) {
    console.error('Order creation error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/orders - Get all orders (admin only)
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    // Get all confirmed orders - fetch separately and join manually
    const { data: confirmedOrders, error: confirmedError } = await supabaseAdmin
      .from('confirmed_orders')
      .select('id, order_number, items, total_amount, payment_status, created_at, user_id, user_name, user_email, user_usn, user_phone')
      .order('created_at', { ascending: false });

    // Get all cart items (dummy orders) - fetch separately and join manually
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart')
      .select('*')
      .order('updated_at', { ascending: false });

    // Get all resell items (fetch separately to avoid join issues)
    const { data: resellItems, error: resellError } = await supabaseAdmin
      .from('resell_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (confirmedError || cartError) {
      console.error('Error fetching orders:', { confirmedError, cartError });
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }
    
    if (resellError) {
      console.error('Error fetching resell items (non-critical):', resellError);
      // Don't fail the whole request if resell items fail
    }

    const allOrders = [];

    // Get all user IDs and fetch user details
    const userIds = new Set();
    if (confirmedOrders) {
      confirmedOrders.forEach(o => {
        if (o.user_id) {
          userIds.add(o.user_id);
          console.log('Order user_id:', o.user_id, '- saved name:', o.user_name, '- saved email:', o.user_email);
        }
      });
    }
    if (cartItems) {
      cartItems.forEach(c => {
        if (c.user_id) {
          userIds.add(c.user_id);
        }
      });
      console.log('Cart items count:', cartItems.length, '- unique users:', new Set(cartItems.map(c => c.user_id)).size);
    }
    if (resellItems) resellItems.forEach(r => r.user_id && userIds.add(r.user_id));

    let usersMap = {};
    if (userIds.size > 0) {
      console.log('Fetching user profiles for', userIds.size, 'users:', Array.from(userIds));
      
      // First try with all columns, fall back to basic columns if it fails
      let users = null;
      let usersError = null;
      
      // Try with full columns first
      const { data: fullData, error: fullError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, usn, phone')
        .in('id', Array.from(userIds));
      
      if (fullError && (fullError.code === '42703' || fullError.message?.includes('does not exist'))) {
        // Column doesn't exist, try with basic columns only
        console.log('Some columns missing, trying basic query...');
        const { data: basicData, error: basicError } = await supabaseAdmin
          .from('users')
          .select('id, email, name')
          .in('id', Array.from(userIds));
        
        if (basicError) {
          console.error('Failed to fetch user profiles (basic):', basicError);
        } else {
          users = basicData;
        }
      } else if (fullError) {
        console.error('Failed to fetch user profiles for orders:', fullError);
      } else {
        users = fullData;
      }
      
      if (users) {
        usersMap = users.reduce((acc, u) => {
          if (u?.id) {
            acc[u.id] = u;
            console.log('  User loaded:', u.id, '- name:', u.name, '- email:', u.email);
          }
          return acc;
        }, {});
        console.log('Loaded', users.length, 'user profiles for orders');
      } else {
        console.log('No users found for the given IDs');
      }
    } else {
      console.log('No user IDs to fetch');
    }

    async function fetchUserInfo(userId) {
      if (!userId) return null;
      if (usersMap[userId]) return usersMap[userId];
      
      // Try with all columns first, fall back to basic if columns don't exist
      let data = null;
      const { data: fullData, error: fullError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, usn, phone')
        .eq('id', userId)
        .maybeSingle();
      
      if (fullError && (fullError.code === '42703' || fullError.message?.includes('does not exist'))) {
        // Column doesn't exist, try basic query
        const { data: basicData } = await supabaseAdmin
          .from('users')
          .select('id, email, name')
          .eq('id', userId)
          .maybeSingle();
        data = basicData;
      } else if (fullError) {
        console.warn('Failed to fetch user info for', userId, fullError.message);
        return null;
      } else {
        data = fullData;
      }
      
      if (data) {
        usersMap[userId] = data;
        return data;
      }
      return null;
    }

    // Process confirmed orders
    if (confirmedOrders) {
      confirmedOrders.forEach(order => {
        const user = usersMap[order.user_id] || {};
        // Prioritize order data (user_name, user_email, user_usn from confirmed_orders table)
        // Fallback to users table, then email prefix
        const email = order.user_email || user.email || 'Unknown';
        const name = (order.user_name && order.user_name.trim() && order.user_name !== 'Unknown') 
          ? order.user_name 
          : ((user.name && user.name.trim() && user.name !== 'Unknown') 
            ? user.name 
            : (email !== 'Unknown' ? email.split('@')[0] : 'Unknown'));
        const usn = (order.user_usn && order.user_usn.trim() && order.user_usn !== '-') 
          ? order.user_usn 
          : ((user.usn && user.usn.trim()) ? user.usn : null);
        
        allOrders.push({
          id: order.id,
          type: 'confirmed_order',
          orderNumber: order.order_number,
          email: email,
          name: name,
          usn: usn,
          items: order.items || [],
          totalAmount: parseFloat(order.total_amount || 0),
          paymentStatus: order.payment_status,
          createdAt: order.created_at
        });
      });
    }

    // Process cart items (dummy orders) - separate entry per user
    if (cartItems && cartItems.length > 0) {
      console.log('=== Processing', cartItems.length, 'cart items ===');
      const cartByUserId = {};
      for (const item of cartItems) {
        const userId = item.user_id;
        if (!userId) {
          console.log('  Skipping cart item with no user_id');
          continue;
        }
        
        // Fetch user info with retry
        let user = usersMap[userId];
        console.log('  Looking up user:', userId, '- found in map:', !!user);
        if (!user) {
          console.log('  User not in map, fetching from DB...');
          user = await fetchUserInfo(userId);
          console.log('  Fetched user:', user ? JSON.stringify(user) : 'null');
        }
        
        if (!cartByUserId[userId]) {
          // Get user details from the users table
          let email = user?.email || null;
          let name = user?.name || null;
          let usn = user?.usn || null;
          
          console.log('  Cart user data:', { userId, name, email, usn });
          
          // If still no email/name, try to find user by any means
          if (!email || !name) {
            // Check if we can get email from confirmed_orders for this user
            const { data: recentOrder } = await supabaseAdmin
              .from('confirmed_orders')
              .select('user_email, user_name, user_usn')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (recentOrder) {
              email = email || recentOrder.user_email;
              name = name || recentOrder.user_name;
              usn = usn || recentOrder.user_usn;
              console.log('  Found from confirmed_orders - name:', name, '- email:', email);
            }
          }
          
          // Final fallback: extract name from email
          if (!name && email) {
            name = email.split('@')[0];
          }
          
          cartByUserId[userId] = {
            userId,
            email: email || 'Unknown',
            name: name || 'Unknown',
            usn: usn || null,
            items: []
          };
        }
        cartByUserId[userId].items.push({
          tabKey: item.tab_key,
          productId: item.product_id,
          variant: item.variant,
          quantity: item.quantity
        });
      }

      // Create separate order entry for each user
      for (const cart of Object.values(cartByUserId)) {
        const email = cart.email && cart.email !== 'Unknown' ? cart.email : 'Unknown';
        const name = (cart.name && cart.name.trim() && cart.name !== 'Unknown')
          ? cart.name
          : (email !== 'Unknown' ? email.split('@')[0] : 'Unknown');
        const usn = (cart.usn && cart.usn.trim()) ? cart.usn : null;
        
        allOrders.push({
          id: `cart-${cart.userId}`, // Unique ID per user
          type: 'cart',
          userId: cart.userId,
          email,
          name,
          usn,
          items: cart.items,
          paymentStatus: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Process resell items
    if (resellItems && resellItems.length > 0) {
      for (const item of resellItems) {
        let user = usersMap[item.user_id];
        if (!user) {
          user = await fetchUserInfo(item.user_id);
        }
        
        const email = user?.email || 'Unknown';
        const name = (user?.name && user.name.trim() && user.name !== 'Unknown') 
          ? user.name 
          : (email !== 'Unknown' ? email.split('@')[0] : 'Unknown');
        const usn = (user?.usn && user.usn.trim()) ? user.usn : null;
        
        // Compute actual status based on deleted_at and expires_at
        let actualStatus = item.status || 'active';
        if (item.deleted_at) {
          actualStatus = 'deleted';
        } else if (item.expires_at && new Date(item.expires_at) < new Date()) {
          actualStatus = 'expired';
        }
        
        allOrders.push({
          id: `resell-${item.id}`,
          type: 'resell_listing',
          userId: item.user_id,
          email,
          name,
          usn,
          items: [{
            name: item.title,
            description: item.description,
            condition: item.condition,
            year: item.year,
            priceRange: item.price_range,
            pictures: item.pictures || [],
            status: actualStatus
          }],
          totalAmount: 0, // Resell items don't have fixed prices
          paymentStatus: actualStatus,
          createdAt: item.created_at
        });
      }
    }

    return res.json({ orders: allOrders });
  } catch (err) {
    console.error('Admin orders fetch error', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/orders/update-status - Update order payment status
app.post('/api/admin/orders/update-status', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ message: 'orderId and status required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    const { error } = await supabaseAdmin
      .from('confirmed_orders')
      .update({ payment_status: status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Failed to update order status' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Update order status error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ========== ADMIN RESELL ROUTES ==========

// GET /api/admin/resell/items - Get all resell items for admin
app.get('/api/admin/resell/items', authMiddleware, async (req, res) => {
  try {
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    const { data: items, error } = await supabaseAdmin
      .from('resell_items')
      .select(`
        *,
        user:users(email, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resell items:', error);
      return res.status(500).json({ message: 'Failed to fetch resell items' });
    }

    return res.json({ items: items || [] });
  } catch (err) {
    console.error('Admin resell items fetch error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Public: GET /api/catalog/overrides - fetch product overrides
app.get('/api/catalog/overrides', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Return empty array instead of error to allow page to load
      return res.json({ overrides: [] });
    }
    const { tabKey } = req.query;
    let query = supabaseAdmin.from('product_overrides').select('*');
    if (tabKey) {
      query = query.eq('tab_key', tabKey);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Fetch catalog overrides error:', error);
      // Return empty array instead of error to allow page to load
      return res.json({ overrides: [] });
    }
    return res.json({ overrides: data || [] });
  } catch (err) {
    console.error('Catalog overrides error', err);
    // Return empty array instead of error to allow page to load
    return res.json({ overrides: [] });
  }
});

// Admin: POST /api/admin/items/catalog - update product overrides
app.post('/api/admin/items/catalog', authMiddleware, async (req, res) => {
  try {
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured on server' });
    }
    const { tabKey, productId, name, price, imageUrl, description, images } = req.body || {};
    if (!tabKey || !productId) {
      return res.status(400).json({ message: 'tabKey and productId are required' });
    }
    const payload = {
      tab_key: tabKey,
      product_id: productId,
      name: name || null,
      price: price !== undefined && price !== null ? Number(price) : null,
      image_url: imageUrl || null,
      description: description || null,
      images: images || [],
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin
      .from('product_overrides')
      .upsert([payload], { onConflict: 'tab_key,product_id' })
      .select()
      .single();
    if (error) {
      console.error('Save catalog override error:', error);
      return res.status(500).json({ message: 'Failed to save override' });
    }
    return res.json({ success: true, override: data });
  } catch (err) {
    console.error('Save catalog override error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ========== ADMIN ITEMS ROUTES ==========

// GET /api/items/soldouts - Get all sold-out items (public endpoint)
app.get('/api/items/soldouts', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      // Return empty data instead of error to allow page to load
      console.warn('Supabase not configured, returning empty sold-out data');
      return res.json({ soldOuts: {}, items: [] });
    }

    const { tabKey } = req.query;
    let query = supabaseAdmin.from('admin_items').select('*');
    
    if (tabKey) {
      query = query.eq('tab_key', tabKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get soldouts error:', error);
      // Return empty data instead of error to allow page to load
      return res.json({ soldOuts: {}, items: [] });
    }

    console.log('Fetched admin_items for', tabKey || 'all', ':', data?.length || 0, 'items');

    // Convert to map for easy lookup
    // Important: If event_status is "ongoing" or "countdown", items should be available unless explicitly marked sold_out
    const soldOutMap = {};
    let eventStatusInfo = null; // Track event status and countdown for the tab
    
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        const baseKey = `${item.tab_key}:${item.product_id}:${item.variant || 'standard'}`;
        const key = item.club_or_dept ? `${baseKey}:${item.club_or_dept}` : baseKey;
        
        console.log('  Item:', item.product_id, '- sold_out:', item.sold_out, '- event_status:', item.event_status);
        
        // Mark as unavailable if:
        // 1. Explicitly marked sold_out (individual item), OR
        // 2. Event status is soldout/over/no_new_releases (event-wide)
        const eventStatus = item.event_status || 'ongoing';
        const isUnavailable = 
          item.sold_out ||
          eventStatus === 'soldout' ||
          eventStatus === 'over' ||
          eventStatus === 'no_new_releases';
          
        if (isUnavailable) {
          soldOutMap[key] = true;
        }

        // Extract event status and countdown date (use first item with status for the tab)
        // Prioritize items with countdown_date if status is "countdown"
        if (item.tab_key === tabKey && item.event_status) {
          if (!eventStatusInfo) {
            eventStatusInfo = {
              type: item.event_status,
              countdown: item.countdown_date || null
            };
          } else if (item.event_status === "countdown" && item.countdown_date && !eventStatusInfo.countdown) {
            // If we find a countdown item with a date, use it (more complete info)
            eventStatusInfo = {
              type: item.event_status,
              countdown: item.countdown_date
            };
          }
        }
      });
    }

    return res.json({ 
      soldOuts: soldOutMap, 
      items: data || [],
      eventStatus: eventStatusInfo || { type: 'ongoing', countdown: null }
    });
  } catch (err) {
    console.error('Get soldouts error', err);
    // Return empty data instead of error to allow page to load
    return res.json({ soldOuts: {}, items: [] });
  }
});

// GET /api/admin/items/soldouts - Get all sold-out items (admin endpoint - kept for backward compatibility)
app.get('/api/admin/items/soldouts', authMiddleware, async (req, res) => {
  try {
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    const { tabKey } = req.query;
    let query = supabaseAdmin.from('admin_items').select('*');
    
    if (tabKey) {
      query = query.eq('tab_key', tabKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get soldouts error:', error);
      return res.status(500).json({ message: 'Failed to fetch sold-out items' });
    }

    // Convert to map for easy lookup
    // Important: If event_status is "ongoing" or "countdown", items should be available unless explicitly marked sold_out
    const soldOutMap = {};
    if (data) {
      data.forEach(item => {
        const baseKey = `${item.tab_key}:${item.product_id}:${item.variant || 'standard'}`;
        const key = item.club_or_dept ? `${baseKey}:${item.club_or_dept}` : baseKey;
        
        // Mark as unavailable if:
        // 1. Explicitly marked sold_out (individual item), OR
        // 2. Event status is soldout/over/no_new_releases (event-wide)
        const eventStatus = item.event_status || 'ongoing';
        const isUnavailable = 
          item.sold_out ||
          eventStatus === 'soldout' ||
          eventStatus === 'over' ||
          eventStatus === 'no_new_releases';
          
        if (isUnavailable) {
          soldOutMap[key] = true;
        }
      });
    }

    return res.json({ soldOuts: soldOutMap, items: data || [] });
  } catch (err) {
    console.error('Get soldouts error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/items/soldout - Update sold-out status
app.post('/api/admin/items/soldout', authMiddleware, async (req, res) => {
  try {
    if (req.auth.email !== 'souparno.cs24@bmsce.ac.in') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { tabKey, productId, variant, soldOut, eventStatus, clubOrDept } = req.body;
    if (!tabKey || !productId) {
      return res.status(400).json({ message: 'Missing tabKey or productId' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ message: 'Supabase not configured' });
    }

    const normVar = normVariant(variant);
    const normClub = clubOrDept || null;
    
    // First check if the item exists - handle null values correctly
    let existingQuery = supabaseAdmin
      .from('admin_items')
      .select('*')
      .eq('tab_key', tabKey)
      .eq('product_id', productId);
    
    // Handle variant - use .is() for null, .eq() for values
    if (normVar === null) {
      existingQuery = existingQuery.is('variant', null);
    } else {
      existingQuery = existingQuery.eq('variant', normVar);
    }
    
    // Handle club_or_dept - use .is() for null, .eq() for values
    if (normClub === null) {
      existingQuery = existingQuery.is('club_or_dept', null);
    } else {
      existingQuery = existingQuery.eq('club_or_dept', normClub);
    }
    
    const { data: existing } = await existingQuery.maybeSingle();

    const updateData = {
      tab_key: tabKey,
      product_id: productId,
      variant: normVar,
      sold_out: !!soldOut,
      updated_at: new Date().toISOString(),
      club_or_dept: normClub
    };

    // Preserve existing event_status if not explicitly provided
    if (eventStatus !== undefined && eventStatus !== null) {
      updateData.event_status = eventStatus;
    } else if (existing && existing.event_status) {
      // Keep the existing event_status when just toggling individual item
      updateData.event_status = existing.event_status;
    } else {
      updateData.event_status = 'ongoing'; // Default
    }

    console.log('Updating soldout status:', { tabKey, productId, variant: normVar, soldOut, eventStatus, clubOrDept });
    console.log('Update payload:', updateData);

    const { data, error } = await supabaseAdmin
      .from('admin_items')
      .upsert([updateData], { onConflict: 'tab_key,product_id,variant,club_or_dept' })
      .select()
      .single();

    if (error) {
      console.error('Admin upsert soldout error:', error);
      return res.status(500).json({ message: 'Failed to update sold out', error: error.message });
    }

    console.log('Updated soldout status successfully:', data);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Update soldout error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
app.post("/api/admin/event/status", authMiddleware, async (req, res) => {
  if (req.auth.email !== "souparno.cs24@bmsce.ac.in") {
    return res.status(403).json({ message: "Admin only" });
  }

  const { tabKey, status, clubOrDept, countdownDate } = req.body;

  try {
    const soldOut =
      status === "soldout" ||
      status === "over" ||
      status === "no_new_releases";

    // Prepare update data
    const updateData = {
      sold_out: soldOut,
      event_status: status
    };

    // Handle countdown_date:
    // - If status is "countdown" and countdownDate is provided, store it
    // - If status is "countdown" but countdownDate is not provided, preserve existing countdown_date
    // - If status is NOT "countdown", clear countdown_date
    if (status === "countdown") {
      if (countdownDate) {
        // Convert datetime-local string to ISO timestamp
        const countdownTimestamp = new Date(countdownDate).toISOString();
        updateData.countdown_date = countdownTimestamp;
      }
      // If countdownDate is not provided, don't set it in updateData
      // This preserves the existing countdown_date in the database
    } else {
      // Clear countdown_date if status is not countdown
      updateData.countdown_date = null;
    }

    // Build query - filter by tab_key and optionally by club_or_dept
    let updateQuery = supabaseAdmin
      .from("admin_items")
      .update(updateData)
      .eq("tab_key", tabKey);

    // If clubOrDept is provided, only update items for that specific club/dept
    // If clubOrDept is null/undefined, update all items for the tab (for non-club tabs)
    if (clubOrDept !== undefined && clubOrDept !== null && clubOrDept !== "") {
      updateQuery = updateQuery.eq("club_or_dept", clubOrDept);
      console.log(`Updating event status for ${tabKey} - ${clubOrDept} to ${status}${countdownDate ? ` (countdown: ${countdownDate})` : ''} (sold_out: ${soldOut})`);
    } else if (tabKey === "club") {
      // For club tab, if no clubOrDept specified, don't update anything
      // (admin should select a specific club/dept to change its status)
      return res.status(400).json({ 
        message: "For club tab, please specify a clubOrDept to update event status" 
      });
    } else {
      console.log(`Updating event status for ${tabKey} to ${status}${countdownDate ? ` (countdown: ${countdownDate})` : ''} (sold_out: ${soldOut})`);
    }

    const { data, error } = await updateQuery.select();

    if (error) throw error;

    console.log(`Updated ${data?.length || 0} items. Event status for ${tabKey}${clubOrDept ? ` (${clubOrDept})` : ''} set to ${status}`);
    return res.json({ ok: true, updated: data?.length || 0 });
  } catch (err) {
    console.error("Event status update error:", err);
    return res.status(500).json({ message: "Failed to update event status", error: err.message });
  }
});
// start up: init storage then listen
initStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
      console.log(`GOOGLE_CLIENT_ID ${GOOGLE_CLIENT_ID ? 'present' : 'MISSING'}`);
      console.log(`Using MongoDB: ${usingMongoose}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init storage', err);
    process.exit(1);
  });
