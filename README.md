# AURA ATELIER — Luxury Haute Couture & Ready-to-Wear E-Commerce Platform

A production-ready, full-stack luxury fashion clothing e-commerce website and secure administrative control dashboard built with Node.js, Express, SQLite (WAL mode), React 19, Tailwind CSS v4, and Lucide icons.

---

## 🌟 Key Features

### 1. Storefront & Brand Experience
- **Luxury Brand Aesthetics**: High-fashion typography (`Playfair Display`, `Cinzel`, `Plus Jakarta Sans`), curated editorial imagery, and fluid animations.
- **Sticky / Glass Header**: Dynamic scroll background blur, promotional announcement bar, responsive mobile navigation drawer.
- **Hero Runway Section**: Impactful editorial banner with CTA buttons, trust badges (Complimentary Worldwide Delivery, Artisan Craftsmanship, 30-Day Returns).
- **All 14 Required Fashion Categories**:
  - Men, Women, Kids
  - Shalwar Qameez, Kurta
  - Shirts, T-Shirts, Jeans, Pants
  - Suits, Dresses, Abayas, Hijabs, Seasonal Collection
- **Product Details & Gallery**:
  - Multi-image zoom magnifier
  - Variant size & color selectors with live swatches
  - Real-time inventory counter
  - Interactive Bespoke Size Guide modal
  - Shipping, Returns, and Fabric Care accordions
  - Customer review submissions with instant rating updates
- **Search & Multi-Facet Filtering**:
  - Debounced search across titles, descriptions, categories, and SKUs
  - Multi-filtering by Category, Price Range, Sizes, Colors, In-Stock, and Sale items
  - Sorting: Newest, Price (Low/High), Rating, and Most Popular
  - Grid column layout switches (3 vs 4 columns)
- **Cart & WhatsApp Ordering**:
  - Slide-over right drawer + dedicated Cart page
  - Free shipping progress bar calculation
  - Real-time coupon application (`AURA10`, `LUXE20`, `VIP50`)
  - **"Order via WhatsApp"**: Auto-generates formatted WhatsApp message containing client details, products, size, color, quantity, subtotal, and concierge delivery instructions.
  - Floating WhatsApp concierge button throughout the public website.
- **Checkout & Fulfillment**:
  - Complete client delivery fields (Name, Phone, Email, Address, City, Postal Code, Notes)
  - Payment choices: Cash on Delivery (COD), Direct Bank Wire, Credit/Debit Card
  - Order placement decrements live product stock in SQLite
  - Celebratory Order Success page with confetti
  - **"Print / Download Luxury Invoice"** formatted printable document
- **Order Tracking**:
  - Real-time milestone tracker by Order ID or Customer Phone (Order Registered -> Confirmed -> Tailored & Packaged -> In Transit -> Delivered).
- **Patron Portal & Policies**:
  - Account Suite (Wishlist manager, past order lookup)
  - Editorial About Us page, FAQ accordion, Contact salon with working inquiry form and Google Maps embed
  - Shipping, Returns & Exchanges, Privacy, and Terms policy pages

---

### 2. Secure Administrative Dashboard (`/admin`)
- **Authentication**: JWT authentication with bcrypt password hashing and route protection.
- **Default Master Admin Credentials**:
  - **Email**: `admin@atelier.com`
  - **Password**: `admin123`
- **Password Recovery**: Integrated forgot/reset password token workflow and in-app password changer.
- **Dashboard Overview**:
  - Financial KPIs: Total Lifetime Sales, Monthly Revenue, Today's Sales, Average Order Value
  - Orders status breakdown: New, Confirmed, Processing, Shipped, Delivered, Cancelled, Returned
  - Interactive SVG revenue trajectory chart & order distribution progress bars
  - Low-stock warning alert banner
  - Top performing best-seller designs ranking
- **Product Management**:
  - Add, Edit, Delete, Duplicate garments
  - Multi-image upload manager with drag-and-drop & URL inputs
  - Real-time reflection on customer boutique
- **Order Management**:
  - Inspect client information, delivery address, items, and sizes
  - Update status with custom timestamped courier notes
- **Inventory Control**:
  - Real-time stock monitor with quick inline increment/decrement (+ / -) adjustments
  - Low-stock (< 8 units) and Out-of-stock filters
- **Client Directory**:
  - Patron profiles, lifetime spend, and purchase history modal
- **Voucher & Coupon Management**:
  - Create percentage or fixed amount discounts, minimum orders, max usages, and expiry dates
- **Concierge Inquiries**:
  - Review messages sent via the contact form, mark read, reply via email or WhatsApp
- **Atelier Settings**:
  - Live configuration of store name, logo, phone, WhatsApp number, email, address, delivery fees, free shipping threshold, and social links

---

## 🚀 How to Run

### Production Mode (All-in-One Express Server):
```bash
# Start backend which serves both API and built React client on port 5000:
npm start
```
Then visit: `http://localhost:5000`

### Development Mode:
```bash
# Runs both backend API (port 5000) and Vite frontend (port 5173) concurrently:
npm run dev
```

---

## 🔒 Security & Architecture
- **Database**: SQLite with Write-Ahead Logging (`WAL` mode) for concurrent read performance.
- **Storage**: Persistent database stored at `server/ecommerce.db`.
- **Uploads**: Multer disk storage in `server/uploads/` with 10MB image validation.
- **Authentication**: JSON Web Tokens (7-day validity) and bcrypt salt rounds.
- **Graceful Error Handling**: Global Express error middleware ensuring 24/7 uptime stability.
