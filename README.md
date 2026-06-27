# Smart Inventory & Expiry Management Suite (India Shopkeeper Edition)

A high-performance stock management, checkout billing point-of-sale, and shelf expiry date warning system built custom-tailored for small local businesses and shopkeepers.

## 🏗️ Technical Architecture Layout
```text
smart-inventory/
├── backend/
│   ├── config/
│   │   └── db.js           ← MongoDB Atlas connection setup & Flat File handlers
│   ├── models/
│   │   ├── Product.js      ← Mongoose Schema for Products
│   │   └── Sale.js         ← Mongoose Schema for POS Sales receipts
│   ├── routes/
│   │   ├── products.js     ← GET, POST and stock quantity updates 
│   │   └── sales.js        ← Sync stock deducting store transactions logs
│   ├── server.js           ← Express backend API pipeline
│   └── package.json        ← Backend modular setup configuration
│
├── frontend/
│   ├── index.html          ← Main dashboard markup skeleton
│   ├── style.css           ← Transitions and scrollbar tweaks
│   └── app.js              ← Modular client API integrations
│
├── data/                   ← Auto-created JSON Flat-File Failover storage directory
│   ├── products.json
│   └── sales.json
│
├── .gitignore              ← Build outputs & node_modules list
└── README.md               ← End-user execution instructions (Current)
```

---

## 💾 Core Specifications & Features

### 1. Resilient Hybrid Offline Failover Engine
If MongoDB Atlas is offline, unreachable, or is missing an active connection string variable, **the application will not crash**. Instead, the server instantly shifts all read/write inventory operations to structured flat JSON file tables stored locally under `data/products.json` and `data/sales.json`.

### 2. Localization
Formatted dynamically via `en-IN` specifications representing Indian Rupees (**₹**) across cost lines, profit calculations, POS checkout estimates, and daily summaries.

### 3. Expiry Geometric Color Badges
- 🟥 **Expired / Expires Today**: Expired stock (Red styling).
- 🟧 **Expiring Soon**: Expires within 7 days (Amber warning style).
- 🟩 **Safe Levels**: Safe shelf lifespan (Green badge).

---

## 🚀 Execution Instructions

### Installation

Install both the root frontend and backend dependencies:
```bash
npm install
```

### Run Locally (Development server)

To boot up the unified Express-Vite Fullstack dev server on port `3000`:
```bash
npm run dev
```

### Compile & Build for Production

Build both the client-side bundle elements and bundle server transpilation with `esbuild`:
```bash
npm run build
```

Then launch the self-contained production bundle:
```bash
npm run start
```
