# 🛍️ GadgetGlam — MERN E-Commerce Setup Guide

## 📁 Project Structure

```
gadgetglam/
├── backend/
│   ├── server.js              ← Express entry point
│   ├── .env.example           ← Copy to .env and fill in values
│   ├── models/
│   │   ├── Product.js         ← Product schema + SEO fields
│   │   ├── User.js            ← User schema + auth
│   │   └── OrderReview.js     ← Orders + Reviews schemas
│   ├── routes/
│   │   ├── auth.js            ← Register, Login, /me
│   │   ├── products.js        ← CRUD + search + sitemap
│   │   ├── orders.js          ← Create + track orders
│   │   ├── reviews.js         ← Post + get reviews
│   │   ├── users.js           ← Profile + wishlist
│   │   └── admin.js           ← Dashboard stats + user mgmt
│   └── middleware/
│       └── auth.js            ← JWT protect + adminOnly
│
└── frontend/
    ├── public/
    │   └── index.html         ← Meta tags, OG, JSON-LD
    └── src/
        ├── App.js             ← All routes defined
        ├── index.js           ← Providers: Auth, Cart, Helmet
        ├── index.css          ← Global CSS variables
        ├── context/
        │   ├── AuthContext.js ← Login, Register, Logout
        │   └── CartContext.js ← Add/remove/update cart
        ├── components/
        │   ├── common/
        │   │   └── SEOHead.js ← Per-page SEO (Helmet)
        │   ├── layout/
        │   │   ├── Navbar.js  ← Nav + search + cart icon
        │   │   └── Footer.js  ← SEO links + sitemap links
        │   └── product/
        │       └── ProductCard.js ← Schema.org microdata
        └── pages/
            ├── HomePage.js         ← Hero, categories, products
            ├── ProductsPage.js     ← Filter, sort, paginate
            ├── ProductDetailPage.js← Full SEO + reviews
            └── (+ Auth, Cart, Category, Admin, 404)
```

---

## 🔌 CONNECTIONS REQUIRED

### 1. MongoDB Atlas (Database)
**What it is:** Cloud-hosted MongoDB database

**Steps:**
1. Go to → https://cloud.mongodb.com
2. Sign up / Log in
3. Click **"Create a new project"** → name it `GadgetGlam`
4. Click **"Build a Database"** → choose **Free tier (M0)**
5. Choose provider: AWS, region: closest to Pakistan (Mumbai)
6. Create a **database user** → username + password → save these
7. In **Network Access** → click **"Add IP Address"** → Add `0.0.0.0/0` (allow all) for development
8. Click **"Connect"** → **"Connect your application"** → copy the connection string
9. Replace `<username>` and `<password>` in the string
10. Paste into your `.env` as `MONGODB_URI`

**Your connection string looks like:**
```
mongodb+srv://youruser:yourpass@cluster0.abc12.mongodb.net/gadgetglam?retryWrites=true&w=majority
```

---

### 2. Node.js Backend
**What it is:** Express.js API server

**Required installed on your machine:**
- Node.js v18+ → https://nodejs.org
- npm (comes with Node)

**Steps:**
```bash
cd backend
npm install
cp .env.example .env
# → fill in your MONGODB_URI and JWT_SECRET
npm run dev
```
✅ You should see: `✅ MongoDB Atlas connected` and `🚀 Server running on port 5000`

---

### 3. React Frontend
**What it is:** React app talking to the backend via Axios

**Steps:**
```bash
cd frontend
npm install
npm start
```
✅ Opens at http://localhost:3000
The `"proxy": "http://localhost:5000"` in package.json auto-forwards `/api/` calls to backend.

---

### 4. AliExpress Affiliate (Revenue)
**Steps:**
1. Go to → https://portals.aliexpress.com
2. Sign up → apply for affiliate
3. After approval → go to **Tools → Affiliate Links**
4. Find a product → generate tracking link
5. Add the link to your product's `affiliate_link` field in MongoDB
6. (Optional) Apply for API access to auto-import products

---

### 5. Environment Variables Required

Create `backend/.env` with:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/gadgetglam?retryWrites=true&w=majority
JWT_SECRET=make_this_long_random_string_32chars
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

## 🚀 RUNNING THE PROJECT

### Development (run both simultaneously)
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

### Or use concurrently (install in root)
```bash
npm init -y
npm install concurrently
# Add to root package.json scripts:
# "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm start\""
npm run dev
```

---

## 🌐 SEO FEATURES IMPLEMENTED

| Feature | Where |
|---------|-------|
| Meta title + description per page | `SEOHead.js` via react-helmet-async |
| Open Graph (Facebook/WhatsApp share) | `public/index.html` + `SEOHead.js` |
| Twitter Cards | `SEOHead.js` |
| Product JSON-LD schema | `SEOHead.js` (auto from product data) |
| Breadcrumb schema | Product detail page |
| Organization JSON-LD | `public/index.html` |
| Schema.org microdata (itemProp) | `ProductCard.js`, `ProductDetailPage.js` |
| SEO-friendly slugs | Product model (auto-generated) |
| Sitemap endpoint | `GET /api/products/sitemap/all` |
| Semantic HTML (article, nav, section, h1) | All pages |
| Alt text on all images | `ProductCard.js`, `ProductDetailPage.js` |
| Canonical URLs | `SEOHead.js` |
| Rel="noopener sponsored" on affiliate links | `ProductDetailPage.js` |
| Category-specific meta tags | `CategoryPage.js` |
| Full-text search index | MongoDB (`Product.js`) |

---

## 🧩 TECH STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| SEO | react-helmet-async, JSON-LD, Schema.org |
| Styling | Custom CSS (no framework needed) |
| State | Context API (Auth + Cart) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (cloud) |
| Auth | JWT + bcryptjs |
| Security | Helmet, rate limiting, mongo-sanitize |
| Notifications | react-hot-toast |

---

## 📋 QUICK ADD PRODUCT (via API)

Once backend is running, use Postman or Thunder Client:

```http
POST http://localhost:5000/api/products
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Magsafe Silicone Case iPhone 15",
  "description": "Military-grade protection with Magsafe compatibility...",
  "short_description": "Magsafe-compatible silicone case for iPhone 15",
  "price": 5999,
  "compare_price": 8999,
  "brand": "Anker",
  "category": "Cases",
  "device_compatibility": ["iPhone 15", "iPhone 15 Plus"],
  "affiliate_link": "https://s.click.aliexpress.com/e/?af=YOURID&productId=...",
  "affiliate_platform": "AliExpress",
  "is_featured": true,
  "stock_status": "In Stock",
  "seo": {
    "meta_title": "Magsafe Silicone Case iPhone 15 | GadgetGlam",
    "meta_description": "Buy the best Magsafe silicone case for iPhone 15 in Pakistan at GadgetGlam.",
    "meta_keywords": ["iphone 15 case", "magsafe case", "iphone case pakistan"]
  }
}
```

---

*GadgetGlam © 2026 — MERN Stack E-Commerce with Full SEO*
