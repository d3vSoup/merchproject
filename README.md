# BMSCE Merchandise Platform

A full-stack e-commerce platform for BMSCE event merchandise (Utsav, Phaseshift, Farouche) and club/department merchandise with resell functionality.

## 🚀 Features

- **Event Merchandise**: Browse and purchase merchandise for Utsav, Phaseshift, and Farouche events
- **Club & Department Merch**: Custom merchandise for various clubs and departments
- **Resell Marketplace**: Students can list and buy second-hand merchandise
- **Wishlist**: Save items for later
- **Admin Panel**: Manage products, orders, and inventory
- **User Profiles**: Complete profile management with USN, branch, semester

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Google OAuth 2.0
- **Styling**: CSS3 with modern animations

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Google OAuth credentials

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/d3vSoup/merchproject.git
cd merchproject
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See BACKEND_SETUP.md for detailed instructions
```

**Required Environment Variables:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 4000)

### 3. Frontend Setup

```bash
cd merch

# Install dependencies
npm install

# Copy environment template (if needed)
cp .env.example .env
```

### 4. Database Setup

Run the SQL migrations in your Supabase SQL Editor (in order):

1. `supabase/sql/schema.sql` - Main schema
2. `supabase/sql/admin_items_schema.sql` - Admin items
3. `supabase/sql/orders_schema.sql` - Orders
4. `supabase/sql/wishlist_schema.sql` - Wishlist
5. `supabase/sql/resell_expiration.sql` - Resell expiration
6. `supabase/sql/users_fix.sql` - User profile fields
7. `supabase/sql/cart_club_support.sql` - Club items support
8. `supabase/sql/product_images.sql` - Product images

See `STORAGE_SETUP.md` for storage bucket configuration.

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd merch
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📁 Project Structure

```
merchproj/
├── backend/           # Express.js backend server
│   ├── index.js      # Main server file
│   ├── .env          # Environment variables (not in git)
│   └── utils/        # Utility functions
├── merch/            # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   └── api/      # API helpers
│   └── vite.config.js
└── supabase/
    └── sql/          # Database migrations
```

## 🔐 Security

- All sensitive data is stored in `.env` files (never committed)
- User authentication via Google OAuth
- JWT tokens for session management
- Row Level Security (RLS) in Supabase
- Service role key only used server-side

## 📝 Documentation

- `BACKEND_SETUP.md` - Backend configuration guide
- `STORAGE_SETUP.md` - Supabase storage setup
- `GITHUB_SETUP.md` - GitHub deployment guide
- `TROUBLESHOOTING.md` - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 👤 Author

**Soup (d3vSoup)**
- GitHub: [@d3vSoup](https://github.com/d3vSoup)

## 🙏 Acknowledgments

- BMSCE for the platform requirements
- Supabase for the backend infrastructure
- React community for excellent documentation
