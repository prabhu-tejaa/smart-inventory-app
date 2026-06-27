import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Database, 
  Search, 
  PlusCircle, 
  IndianRupee, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  X, 
  ShoppingCart, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  Filter,
  RefreshCw,
  User,
  LogOut,
  Hexagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Sale, DBStatus } from './types';
import Auth from './components/Auth';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setIsAdminMode(false);
  };

  const authHeaders = { 'Authorization': `Bearer ${token}` };
  // --- STATE STORES ---
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dbStatus, setDbStatus] = useState<DBStatus>({
    connected: false,
    mode: "Local JSON Flat-File Failover",
    info: "Connecting..."
  });
  
  // App states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All items');
  const [activeTab, setActiveTab] = useState<'confirm-entry' | 'record-sale' | 'sales-log' | 'profile'>('confirm-entry');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('13:01:59');

  // Interactive Form States
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    buyPrice: '',
    sellPrice: '',
    quantity: '',
    expiryDate: '2026-07-04', // Default to 7 days from reference 2026-06-27
    lowStockThreshold: '5'
  });

  const [saleForm, setSaleForm] = useState({
    productId: '',
    qtySold: '1'
  });

  // Self-dismissing toast notifications
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // --- API OPERATIONS ---
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
      headers: { ...authHeaders, 'Content-Type': 'application/json' }, headers: authHeaders });
      if (!res.ok) throw new Error("Could not fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      triggerToast(err.message || "Failed to load inventory details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesLogs = async () => {
    try {
      const res = await fetch('/api/sales', {
      headers: { ...authHeaders, 'Content-Type': 'application/json' }, headers: authHeaders });
      if (!res.ok) throw new Error("Could not fetch sales logs");
      const data = await res.json();
      setSales(data);
    } catch (err: any) {
      triggerToast(err.message || "Failed to load shop sales logs.", "error");
    }
  };

  const fetchDBStatus = async () => {
    try {
      const res = await fetch('/api/db-status', { headers: token ? authHeaders : {} });
      if (!res.ok) throw new Error("Could not fetch DB health check");
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({
        connected: false,
        mode: "Local JSON Flat-File Failover",
        info: "Database integration offline. Working in fully resilient hybrid folder mode."
      });
    }
  };

  // Load backend details
  useEffect(() => {
    fetchDBStatus();
    if (token) {
      fetchInventory();
      fetchSalesLogs();
    }
  }, [token]);

  // Sync clock timestamp
  useEffect(() => {
    const now = new Date();
    // Simulate real-time ticking starting from mock time 13:01:59
    let seconds = 59;
    let minutes = 1;
    let hours = 13;
    const interval = setInterval(() => {
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
          if (hours >= 24) {
            hours = 0;
          }
        }
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      setLiveTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);
    if (!token || !user) {
    return <Auth onLogin={handleLogin} dbStatus={dbStatus} />;
  }

  return () => clearInterval(interval);
  }, []);

  // Indian Rupee formatting utility
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // --- MODEL HELPERS (Date: 2026-06-27) ---
  const todayDateStr = "2026-06-27";

  const getDaysRemaining = (expiryDateStr: string) => {
    const today = new Date("2026-06-27T00:00:00");
    const expiry = new Date(expiryDateStr + "T00:00:00");
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProductExpiryStatus = (expiryDateStr: string) => {
    const daysLeft = getDaysRemaining(expiryDateStr);
    if (daysLeft <= 0) return "Expired";
    if (daysLeft <= 7) return "Soon";
    return "OK";
  };

  // --- DYNAMIC DASHBOARD SEGMENTING ---
  const counts = useMemo(() => {
    let total = products.length;
    let expiredSoon = 0;
    let lowStock = 0;

    products.forEach(p => {
      const status = getProductExpiryStatus(p.expiryDate);
      if (status === "Expired" || status === "Soon") {
        expiredSoon++;
      }
      if (p.quantity < p.lowStockThreshold) {
        lowStock++;
      }
    });

    // Today's total profits
    const todaySales = sales.filter(s => {
      // Compare soldAt date with anchor "2026-06-27"
      if (!s.soldAt) return false;
      return s.soldAt.startsWith(todayDateStr);
    });
    const todayProfit = todaySales.reduce((acc, current) => acc + current.profit, 0);

    return { total, expiredSoon, lowStock, todayProfit };
  }, [products, sales]);

  // Filtering products for the central display table
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const keywordMatch = nameMatch || catMatch;

      if (!keywordMatch) return false;

      const expiryStat = getProductExpiryStatus(p.expiryDate);
      const isLowStock = p.quantity < p.lowStockThreshold;

      if (statusFilter === "All items") return true;
      if (statusFilter === "Expired details") return expiryStat === "Expired";
      if (statusFilter === "Expiring soon") return expiryStat === "Soon";
      if (statusFilter === "Low stocks") return isLowStock;
      if (statusFilter === "Status: OK") return expiryStat === "OK" && !isLowStock;

      return true;
    });
  }, [products, searchQuery, statusFilter]);

  // List of unique product categories for convenient autocomplete
  const categories = useMemo(() => {
    const cats = products.map(p => p.category.trim());
    return Array.from(new Set(cats)).filter(Boolean);
  }, [products]);

  // --- SALE ESTIMATION ENGINE (TAB 2) ---
  const activeSaleProduct = useMemo(() => {
    return products.find(p => p._id === saleForm.productId);
  }, [products, saleForm.productId]);

  const liveEstimates = useMemo(() => {
    if (!activeSaleProduct) return null;
    const qty = Number(saleForm.qtySold) || 0;
    const totalSaleValue = activeSaleProduct.sellPrice * qty;
    const totalCostValue = activeSaleProduct.buyPrice * qty;
    const estimatedProfitValue = (activeSaleProduct.sellPrice - activeSaleProduct.buyPrice) * qty;
    const markupPct = activeSaleProduct.buyPrice > 0 
      ? ((activeSaleProduct.sellPrice - activeSaleProduct.buyPrice) / activeSaleProduct.buyPrice) * 100 
      : 0;

    return {
      instock: activeSaleProduct.quantity,
      totalSaleValue,
      estimatedProfitValue,
      markupPct,
      valid: qty > 0 && qty <= activeSaleProduct.quantity
    };
  }, [activeSaleProduct, saleForm.qtySold]);

  // --- SUBMISSIONS HANDLERS ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, category, buyPrice, sellPrice, quantity, expiryDate, lowStockThreshold } = newProduct;

    if (!name.trim() || !category.trim() || !buyPrice || !sellPrice || !quantity || !expiryDate) {
      triggerToast("Please input all required parameters securely.", "error");
      return;
    }

    try {
      const res = await fetch('/api/products', {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          buyPrice: Number(buyPrice),
          sellPrice: Number(sellPrice),
          quantity: Number(quantity),
          expiryDate,
          lowStockThreshold: Number(lowStockThreshold || '5')
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit product inventory entry.");
      }

      triggerToast(`Product barcode "${data.name}" added successfully!`);
      // Reset form save for default dates
      setNewProduct({
        name: '',
        category: '',
        buyPrice: '',
        sellPrice: '',
        quantity: '',
        expiryDate: '2026-07-04',
        lowStockThreshold: '5'
      });
      fetchInventory();
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, qtySold } = saleForm;

    if (!productId) {
      triggerToast("Select a valid product item first.", "error");
      return;
    }
    const parsedQty = Number(qtySold);
    if (!parsedQty || parsedQty < 1) {
      triggerToast("Units sold must operate above 0.", "error");
      return;
    }

    try {
      const res = await fetch('/api/sales', {
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          qtySold: parsedQty
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Terminal failed checkout validation rules.");
      }

      triggerToast(`Txn Authorized! ${data.productName} (Qty: ${data.qtySold}) logged. Profit: ${formatINR(data.profit)}`, "success");
      
      // Auto-update lists
      fetchInventory();
      fetchSalesLogs();
      setSaleForm({ productId: '', qtySold: '1' });
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Instant POS trigger directly from rows
  const handleQuickSellTrigger = (prod: Product) => {
    setSaleForm({
      productId: prod._id,
      qtySold: '1'
    });
    setActiveTab('record-sale');
    triggerToast(`Populated checkout console for "${prod.name}"`, "info");
  };

  if (!token || !user) {
    return <Auth onLogin={handleLogin} dbStatus={dbStatus} />;
  }

  return (
    <div id="smart-inventory-app" className="min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Alert Banner Toast Overlay Stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-3.5 rounded-lg border shadow-lg pointer-events-auto flex gap-2.5 items-start ${
                toast.type === "success" 
                  ? "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]" 
                  : toast.type === "error"
                  ? "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"
                  : "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold font-display">System Notification</p>
                <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER BAR (Height: 60px as strictly requested) */}
      <header className="h-[60px] max-h-[60px] shrink-0 bg-white border-b border-[#e2e8f0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-display font-bold tracking-tight text-slate-900 text-lg md:text-xl">
            Smart Inventory
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button 
              onClick={() => setIsAdminMode(true)} 
              className="hidden sm:flex text-xs font-semibold px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors rounded-lg items-center gap-1 mr-2 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4" /> Admin Console
            </button>
          )}
          <button onClick={handleLogout} className="text-xs font-semibold text-slate-500 flex items-center gap-1 hover:text-slate-800">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

      </header>

      {/* MAIN CONTAINER / ADMIN TOGGLE */}
      {isAdminMode ? (
        <AdminDashboard 
          token={token} 
          onExit={() => setIsAdminMode(false)} 
          products={products} 
          sales={sales} 
          refreshData={() => { fetchInventory(); fetchSalesLogs(); }} 
        />
      ) : (
      <>
      <main className="flex-1 min-h-0 max-w-[1500px] w-full mx-auto p-4 md:p-6 flex flex-col gap-4 overflow-visible md:overflow-hidden">
        
        {/* MOBILE OVERLAY REMOVED FOR PROD */}

        {/* DYNAMIC EXPIRY & STOCK WARNING DRAWER Banner */}
        <AnimatePresence>
          {bannerVisible && (counts.expiredSoon > 0 || counts.lowStock > 0) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              id="warning-banner-drawer"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-amber-900 text-sm">Critical Inventory Action Needed</h3>
                    <p className="text-xs text-amber-800 mt-1">
                      Your store currently reports <span className="font-bold underline">{counts.expiredSoon} item(s)</span> expired/expiring soon, 
                      and <span className="font-bold underline">{counts.lowStock} item(s)</span> falling underneath safe stock levels. 
                      Keep shelves pristine to safeguard store margins.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button 
                    onClick={() => {
                      setStatusFilter("Expired details");
                      triggerToast("Filtered main view for expired cargo.", "info");
                    }} 
                    className="text-xs font-semibold px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors rounded-lg flex items-center gap-1"
                  >
                    View Expired
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => {
                      setStatusFilter("Low stocks");
                      triggerToast("Filtered main view for low stock lines.", "info");
                    }} 
                    className="text-xs font-semibold px-3 py-1.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 transition-colors rounded-lg"
                  >
                    View Low Stocks
                  </button>
                  <button 
                    onClick={() => setBannerVisible(false)}
                    className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-800 transition-colors"
                    title="Dismiss alert banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRICS GRID SUMMARY */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metric-cards">
          
          {/* Item count card */}
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Products</span>
              <div className="p-1 px-1.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono font-bold group-hover:scale-105 transition-transform">
                ITEMS
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-display font-medium text-2xl md:text-3xl tracking-tight text-slate-900">
                {counts.total}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Unique SKUs</span>
            </div>
            <div className="mt-2 text-[10.5px] text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 opacity-70" />
              <span>Full store lineup monitored</span>
            </div>
          </div>

          {/* Expiring Soon / Expired Card */}
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Expiry / Warns</span>
              <div className={`p-1 px-1.5 rounded text-[11px] font-mono font-bold ${
                counts.expiredSoon > 0 ? "bg-[#fff7ed] text-[#c2410c] animate-pulse" : "bg-green-50 text-green-700"
              }`}>
                {counts.expiredSoon > 0 ? "ATTN REQD" : "SAFE"}
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className={`font-display font-semibold text-2xl md:text-3xl tracking-tight ${
                counts.expiredSoon > 0 ? "text-[#c2410c] duration-100 shadow-amber-200" : "text-slate-900"
              }`}>
                {counts.expiredSoon}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Expired/Soon</span>
            </div>
            <div className={`mt-2 text-[10.5px] font-medium flex items-center gap-1 ${
              counts.expiredSoon > 0 ? "text-amber-600" : "text-slate-400"
            }`}>
              <AlertTriangle className="w-3 h-3 opacity-80" />
              <span>Expires within ≤ 7 days</span>
            </div>
          </div>

          {/* Low Stock Alerts Card */}
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Low Stock Alerts</span>
              <div className={`p-1 px-1.5 rounded text-[11px] font-mono font-bold ${
                counts.lowStock > 0 ? "bg-red-50 text-red-700 font-mono font-bold" : "bg-green-50 text-green-700"
              }`}>
                {counts.lowStock > 0 ? "LOW CORE" : "STOCKED"}
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className={`font-display font-semibold text-2xl md:text-3xl tracking-tight ${
                counts.lowStock > 0 ? "text-red-700" : "text-slate-900"
              }`}>
                {counts.lowStock}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Alert lines</span>
            </div>
            <div className={`mt-2 text-[10.5px] font-medium flex items-center gap-1 ${
              counts.lowStock > 0 ? "text-red-600" : "text-slate-400"
            }`}>
              <AlertTriangle className="w-3 h-3 opacity-80" />
              <span>Under safe stock threshold</span>
            </div>
          </div>

          {/* Today's Profit Indian Currency Localized Card */}
          <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-2xs hover:shadow-xs hover:border-[#10b981]/40 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Today's Profit</span>
              <div className="p-1 px-1.5 bg-[#f0fdf4] text-[#15803d] rounded text-[11px] font-mono font-bold group-hover:scale-105 transition-transform">
                MARGIN
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="font-mono font-semibold text-2xl md:text-3xl tracking-tight text-[#15803d]">
                {formatINR(counts.todayProfit)}
              </span>
            </div>
            <div className="mt-2 text-[10.5px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#15803d]" />
              <span className="font-mono">{todayDateStr} Net Returns</span>
            </div>
          </div>

        </section>

        {/* CORE GRID ARCHITECTURE: 2/3 and 1/3 splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
          
          {/* THE MAIN PRODUCTS INVENTORY PANEL (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 flex flex-col bg-white border border-[#e2e8f0] rounded-xl shadow-2xs overflow-hidden">
            
            {/* Control Bar for Table: Search query, category filter and state filters */}
            <div className="p-4 bg-slate-50 border-b border-[#e2e8f0] flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-72">
                <Search className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search item name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs border border-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-sans transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtering Controls */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto shrink-0 pb-1 md:pb-0">
                <span className="text-[11px] font-sans font-medium text-slate-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3" />
                  Show:
                </span>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-sans cursor-pointer"
                >
                  <option value="All items">📋 All shelf stock items</option>
                  <option value="Expired details">🚨 Expired items</option>
                  <option value="Expiring soon">⏳ Expiring inside 7d</option>
                  <option value="Low stocks">⚠️ Below low thresholds</option>
                  <option value="Status: OK">✅ Perfect OK Status</option>
                </select>
                
                <button 
                  onClick={fetchInventory}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                  title="Reload current inventory"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* LIVE DENSITY TABLE CONTAINER */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent" id="inventory-data-table-view">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-slate-50 text-[11px] font-display font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Item details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">In-Stock Qty</th>
                    <th className="py-3 px-4 text-right">Unit Buy Price</th>
                    <th className="py-3 px-4 text-right">Unit Sell Price</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                          <span className="text-xs font-mono">Calling store inventories logs safely...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <p className="font-display font-medium text-sm text-slate-500">No active products match current search or filters</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting the status filter dropdown or clearing the search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const expiryStat = getProductExpiryStatus(p.expiryDate);
                      const isLowStock = p.quantity < p.lowStockThreshold;
                      const isOutOfStock = p.quantity === 0;

                      // Decide row highlighters
                      let rowBgClass = "hover:bg-slate-50/50 transition-colors duration-150";
                      if (isOutOfStock) {
                        rowBgClass = "bg-[#fef2f2]/40 hover:bg-[#fef2f2]/60 transition-colors duration-150";
                      } else if (isLowStock) {
                        rowBgClass = "bg-amber-50/20 hover:bg-amber-50/40 transition-colors duration-150";
                      }

                      return (
                        <tr key={p._id} className={`${rowBgClass} border-b border-[#f1f5f9]`}>
                          
                          {/* Item parameters */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-display font-medium text-slate-900 text-sm">{p.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isOutOfStock ? (
                                  <span className="text-[10px] uppercase font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded">Out of Stock</span>
                                ) : isLowStock ? (
                                  <span className="text-[10px] uppercase font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">Stock Low (Thresh: {p.lowStockThreshold})</span>
                                ) : (
                                  <span className="text-[10px] uppercase font-mono text-slate-400">Stock OK</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category badge */}
                          <td className="py-3.5 px-4 font-sans text-slate-600 font-medium">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-sans">
                              {p.category}
                            </span>
                          </td>

                          {/* Quantity (JetBrains Mono) */}
                          <td className="py-3.5 px-4 text-right">
                            <span className={`font-mono font-medium text-sm ${
                              isOutOfStock ? "text-[#991b1b] font-bold" : isLowStock ? "text-[#c2410c] font-semibold" : "text-slate-950"
                            }`}>
                              {p.quantity} Units
                            </span>
                          </td>

                          {/* Buy Price of Item */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                            {formatINR(p.buyPrice)}
                          </td>

                          {/* Sell Price of Item */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-medium">
                            {formatINR(p.sellPrice)}
                          </td>

                          {/* Product Expiry Badge Color Geometry code */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-slate-700">{p.expiryDate}</span>
                              <div className="mt-1">
                                {expiryStat === "Expired" ? (
                                  <span className="inline-block text-[10px] font-bold uppercase font-display border px-1.5 py-0.2 rounded bg-[#fef2f2] text-[#991b1b] border-[#fee2e2]">
                                    Expired / Today
                                  </span>
                                ) : expiryStat === "Soon" ? (
                                  <span className="inline-block text-[10px] font-bold uppercase font-display border px-1.5 py-0.2 rounded bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]">
                                    Soon ({getDaysRemaining(p.expiryDate)}d left)
                                  </span>
                                ) : (
                                  <span className="inline-block text-[10px] font-semibold uppercase font-display border px-1.5 py-0.2 rounded bg-[#f0fdf4] text-[#15803d] border-[#dcfce7]">
                                    Safe ({getDaysRemaining(p.expiryDate)}d)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Transaction Quick Sell Shortcut Trigger */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleQuickSellTrigger(p)}
                              disabled={isOutOfStock}
                              className={`p-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 mx-auto ${
                                isOutOfStock 
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                  : "bg-white hover:bg-slate-900 text-slate-800 hover:text-white border-slate-200 hover:border-slate-900 shadow-2xs"
                              }`}
                              title={isOutOfStock ? "Cannot sell out of stock" : `Prompt quick checkout sale log`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Sell
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table summary Footer */}
            <div className="p-3 border-t border-[#e2e8f0] bg-slate-50 text-[10.5px] font-mono text-slate-400 flex items-center justify-between">
              <span>Showing {filteredProducts.length} items of {products.length} total register entries</span>
              <span className="hidden sm:inline">Click "Sell" shortcut to jump directly to billing tab</span>
            </div>

          </div>

          {/* INTERACTIVE COMMAND PANEL FOR RECORDING / ENTRIES (1 Col wide on desktop) */}
          <div className="flex flex-col bg-white border border-[#e2e8f0] rounded-xl shadow-2xs overflow-hidden">
            
            {/* Tabs Control strip */}
            <div className="flex border-b border-[#e2e8f0] bg-slate-50">
              <button
                onClick={() => setActiveTab('confirm-entry')}
                className={`flex-1 py-3 text-xs font-display font-medium border-b-2 tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'confirm-entry'
                    ? "border-slate-900 text-slate-950 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Item
              </button>
              
              <button
                onClick={() => setActiveTab('record-sale')}
                className={`flex-1 py-3 text-xs font-display font-medium border-b-2 tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'record-sale'
                    ? "border-slate-900 text-slate-950 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Retail POS
              </button>
              
              <button
                onClick={() => setActiveTab('sales-log')}
                className={`flex-1 py-3 text-xs font-display font-medium border-b-2 tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'sales-log'
                    ? "border-slate-900 text-slate-950 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Sales Log
              </button>

            </div>

            {/* TAB PANEL CONTENTS */}
            <div className="flex-1 p-4 overflow-y-auto min-h-0" id="interactive-command-tab-panel">
              <AnimatePresence mode="wait">
                
                {/* TAB 1: ADD PRODUCT BATCH ENTRY */}
                {activeTab === 'confirm-entry' && (
                  <motion.div
                    key="tab-add"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <form onSubmit={handleAddProduct} className="space-y-3">
                      <div>
                        <h4 className="text-sm font-display font-bold text-slate-900">Add Stock Entry</h4>
                      </div>

                      {/* Name & Category Split row */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Name of Product */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Product Name *</label>
                          <input 
                            type="text"
                            required
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="e.g. Mustard Oil"
                            className="w-full bg-white text-xs border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                          />
                        </div>

                        {/* Category of product */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Category *</label>
                          <input 
                            type="text"
                            required
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            placeholder="e.g. Oils, Dairy"
                            list="existing-categories"
                            className="w-full bg-white text-xs border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850"
                          />
                          <datalist id="existing-categories">
                            {categories.map((c, i) => (
                              <option key={i} value={c} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Pricing Split row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Buy Cost Price (₹) *</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-[11px] font-semibold text-slate-400">₹</span>
                            <input 
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={newProduct.buyPrice}
                              onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                              placeholder="120.00"
                              className="w-full bg-white text-xs border border-slate-200 p-1.5 pl-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Sale Retail Price (₹) *</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-[11px] font-semibold text-slate-400">₹</span>
                            <input 
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={newProduct.sellPrice}
                              onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                              placeholder="145.00"
                              className="w-full bg-white text-xs border border-slate-200 p-1.5 pl-6 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stock counts and threshold warning levels */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Quantity Total *</label>
                          <input 
                              type="number"
                              required
                              min="0"
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                              placeholder="50"
                              className="w-full bg-white text-xs border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                            />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-sans font-medium text-slate-600 block">Low Limit Threshold</label>
                          <input 
                            type="number"
                            min="1"
                            value={newProduct.lowStockThreshold}
                            onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: e.target.value })}
                            placeholder="5"
                            className="w-full bg-white text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                          />
                        </div>
                      </div>

                      {/* Expiry date input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-sans font-medium text-slate-600 block">Expiry Date *</label>
                        <input 
                          type="date"
                          required
                          value={newProduct.expiryDate}
                          onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                          className="w-full bg-white text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-semibold rounded-lg shadow-sm font-display cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Save Product to Shelf
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* TAB 2: LIVE POINT-OF-SALE TRANSACTION checkout estimator */}
                {activeTab === 'record-sale' && (
                  <motion.div
                    key="tab-sale"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <form onSubmit={handleRecordSale} className="space-y-4">
                      <div>
                        <h4 className="text-sm font-display font-bold text-slate-900">Record Store Sale</h4>
                        <p className="text-[11px] text-slate-500">Live point-of-sale transactional checkout slip estimator.</p>
                      </div>

                      {/* Product selector dropdown */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-sans font-medium text-slate-600 block">Select Product to Sell *</label>
                        <select
                          required
                          value={saleForm.productId}
                          onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                          className="w-full bg-white text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 cursor-pointer"
                        >
                          <option value="">-- Click to select active shelf item --</option>
                          {products.map((p) => {
                            const isOutOfStock = p.quantity <= 0;
                            return (
                              <option 
                                key={p._id} 
                                value={p._id}
                                disabled={isOutOfStock}
                              >
                                {p.name} {isOutOfStock ? "(OUT OF STOCK)" : `(Stock: ${p.quantity} | Sell: ₹${p.sellPrice})`}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-sans font-medium text-slate-600 block">Sale Quantity *</label>
                        <input 
                          type="number"
                          required
                          min="1"
                          value={saleForm.qtySold}
                          onChange={(e) => setSaleForm({ ...saleForm, qtySold: e.target.value })}
                          placeholder="1"
                          className="w-full bg-white text-xs border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-850 font-mono"
                        />
                      </div>

                      {/* Dynamic "Are-You-Sure" instant Receipt estimation calculator */}
                      <AnimatePresence>
                        {liveEstimates && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                          >
                            <p className="font-semibold text-slate-700 uppercase tracking-wide border-b border-dashed border-slate-200 pb-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                              Estimated Store Receipt Slips
                            </p>
                            
                            <div className="flex justify-between">
                              <span className="text-slate-400">Current Shelf Stock:</span>
                              <span className={`font-bold ${
                                liveEstimates.instock < 5 ? "text-red-650" : "text-slate-700"
                              }`}>
                                {liveEstimates.instock} Units remaining
                              </span>
                            </div>

                            <div className="flex justify-between text-xs">
                              <span className="text-slate-550 font-semibold text-slate-600">Total Purchase Value:</span>
                              <span className="font-bold text-slate-900">{formatINR(liveEstimates.totalSaleValue)}</span>
                            </div>

                            <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 font-sans">
                              <span className="text-slate-500 text-[10px]">Net Margin Profit Gain:</span>
                              <span className="font-mono font-bold text-xs text-[#15803d]">+{formatINR(liveEstimates.estimatedProfitValue)}</span>
                            </div>

                            <div className="flex justify-between font-sans">
                              <span className="text-slate-500 text-[10px]">Product Markup:</span>
                              <span className="font-mono font-bold text-[#15803d]">{liveEstimates.markupPct.toFixed(1)}% markup</span>
                            </div>

                            {/* Insufficient Stock error alerts panel in estimator */}
                            {!liveEstimates.valid && (
                              <div className="mt-2.5 p-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[10px] text-[#991b1b] flex items-center justify-center gap-1.5 font-sans font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Cannot sell more than available shelf stock!</span>
                              </div>
                            )}

                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={!liveEstimates || !liveEstimates.valid}
                        className={`w-full mt-2 py-2 px-4 rounded-lg shadow-sm font-display text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          liveEstimates && liveEstimates.valid
                            ? "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white"
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Confirm Billing & Deduct Stock
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* TAB 3: TODAY'S SALES TRANSACTION LOGS */}
                {activeTab === 'sales-log' && (
                  <motion.div
                    key="tab-logs"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-sm font-display font-bold text-slate-900">Today's Transactions log</h4>
                      <p className="text-[11px] text-slate-500">Log statement for sales generated on <span className="font-mono">{todayDateStr}</span>.</p>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {sales.filter(s => s.soldAt?.startsWith(todayDateStr)).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border border-slate-100 rounded-xl bg-slate-50/50">
                          <FileText className="w-7 h-7 mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-medium">No transactions registered today.</p>
                          <p className="text-[10px] mt-0.5">Use the "Retail POS" tab to record checkout slips instantly.</p>
                        </div>
                      ) : (
                        sales.filter(s => s.soldAt?.startsWith(todayDateStr)).map((sale) => {
                          const soldTime = new Date(sale.soldAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'UTC'
                          });

                          return (
                            <div 
                              key={sale._id}
                              className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-all font-mono text-[11px] bg-slate-50/50 flex flex-col gap-1.5"
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-sans font-bold text-slate-900 text-xs truncate max-w-[150px]" title={sale.productName}>
                                  {sale.productName}
                                </span>
                                <span className="text-[10px] bg-slate-250 border px-1.5 py-0.2 rounded text-slate-600 font-mono flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {soldTime}
                                </span>
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-550 pt-1 border-t border-dashed border-slate-200">
                                <span>Units Sold Quantity:</span>
                                <span className="font-bold text-slate-700">{sale.qtySold} pack(s)</span>
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-550">
                                <span>Unit Sales Pricing:</span>
                                <span className="font-mono">{formatINR(sale.sellPrice)}</span>
                              </div>

                              <div className="flex justify-between text-xs pt-1 border-t border-dashed border-slate-200 font-sans">
                                <span className="text-slate-605 font-medium">Net Net Profit Margin:</span>
                                <span className="font-mono font-bold text-[#15803d]">+{formatINR(sale.profit)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Historical summary footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                      <span>Total Registered: {sales.length} checkout sales</span>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>

        </div>

      </main>

      <footer className="shrink-0 bg-white border-t border-[#e2e8f0] py-3.5 text-center text-[11px] text-slate-400 font-sans flex flex-col md:flex-row md:items-center md:justify-center px-6 gap-2">
        <span className="font-sans">
          &copy; 2026 Smart Inventory App
        </span>
      </footer>
      </>
      )}
    </div>
  );
}
