// Fallback modular app interactions with Express API endpoints
let productsLocal = [];

async function initDashboard() {
  await getProducts();
  await getDBStatus();
  setupListeners();
}

async function getDBStatus() {
  try {
    const res = await fetch('/api/db-status');
    const data = await res.json();
    const badge = document.getElementById('db-status-badge');
    if (badge) {
      badge.innerText = data.connected ? "MONGODB ATLAS LIVE" : "OFFLINE LOCAL DATABASE";
      badge.className = data.connected 
        ? "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-mono font-semibold"
        : "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200 text-xs font-mono font-semibold";
    }
  } catch (err) {
    console.warn("DB status healthcheck error", err);
  }
}

async function getProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    productsLocal = data;
    renderInventoryTable();
    calculateStats();
    populatePOSDropdown();
  } catch (err) {
    console.error("Failed fetching inventory dataset", err);
  }
}

function renderInventoryTable() {
  const tbody = document.getElementById('tbl-inventory-body');
  const searchInput = document.getElementById('txt-search').value.toLowerCase();
  const filterVal = document.getElementById('sel-filter').value;

  if(!tbody) return;
  tbody.innerHTML = '';

  const today = new Date("2026-06-27");

  const filtered = productsLocal.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchInput) || p.category.toLowerCase().includes(searchInput);
    if (!matchesSearch) return false;

    // Check expiry
    const expiry = new Date(p.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let isExpired = diffDays <= 0;
    let isExpiringSoon = diffDays > 0 && diffDays <= 7;
    let isLowStock = p.quantity < p.lowStockThreshold;

    if (filterVal === "All items") return true;
    if (filterVal === "Expired details") return isExpired;
    if (filterVal === "Expiring soon") return isExpiringSoon;
    if (filterVal === "Low stocks") return isLowStock;
    if (filterVal === "Status: OK") return !isExpired && !isExpiringSoon && !isLowStock;
    
    return true;
  });

  if(filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No inventory matches search filters</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const expiry = new Date(p.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let expiryLabel = `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-105 font-semibold text-[10px]">Safe</span>`;
    if (diffDays <= 0) {
      expiryLabel = `<span class="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-105 font-bold text-[10px]">Expired</span>`;
    } else if (diffDays <= 7) {
      expiryLabel = `<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-105 font-semibold text-[10px]">Expires in ${diffDays}d</span>`;
    }

    const row = document.createElement('tr');
    row.className = p.quantity <= 0 ? "bg-red-50/20" : "";
    row.innerHTML = `
      <td class="p-3 font-semibold text-slate-900">${p.name}</td>
      <td class="p-3"><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">${p.category}</span></td>
      <td class="p-3 text-right font-mono font-medium">${p.quantity}</td>
      <td class="p-3 text-right font-mono text-slate-500">₹${p.buyPrice.toFixed(2)}</td>
      <td class="p-3 text-right font-mono font-semibold text-slate-900">₹${p.sellPrice.toFixed(2)}</td>
      <td class="p-3 font-mono">${p.expiryDate} ${expiryLabel}</td>
      <td class="p-3 text-center">
        <button onclick="shortcutSell('${p._id}')" ${p.quantity <= 0 ? 'disabled' : ''} class="px-2 py-1 border rounded bg-white hover:bg-slate-900 text-slate-800 hover:text-white transition text-[11px] disabled:opacity-50">Sell</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function calculateStats() {
  const totalEl = document.getElementById('metric-total-items');
  const expiredEl = document.getElementById('metric-expired-items');
  const lowStockEl = document.getElementById('metric-low-stocks');

  if(totalEl) totalEl.innerText = productsLocal.length;

  const today = new Date("2026-06-27");
  let expiredCount = 0;
  let lowQty = 0;

  productsLocal.forEach(p => {
    const expiry = new Date(p.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) expiredCount++;
    if (p.quantity < p.lowStockThreshold) lowQty++;
  });

  if(expiredEl) {
    expiredEl.innerText = expiredCount;
    if (expiredCount > 0) {
      document.getElementById('critical-alert-banner').classList.remove('hidden');
    }
  }
  if(lowStockEl) lowStockEl.innerText = lowQty;
}

function populatePOSDropdown() {
  const sel = document.getElementById('pos-sel-product');
  if(!sel) return;
  sel.innerHTML = '<option value="">-- Click to select active shelf item --</option>';
  productsLocal.forEach(p => {
    if(p.quantity > 0) {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.innerText = `${p.name} (Stock: ${p.quantity} | Sell: ₹${p.sellPrice})`;
      sel.appendChild(opt);
    }
  });
}

function shortcutSell(id) {
  switchTab('tab-pos-billing');
  const select = document.getElementById('pos-sel-product');
  if (select) {
    select.value = id;
    triggerEstimates();
  }
}

function triggerEstimates() {
  const selId = document.getElementById('pos-sel-product').value;
  const qtyInput = Number(document.getElementById('pos-val-qty').value) || 1;
  const widget = document.getElementById('pos-estimates-widget');

  const p = productsLocal.find(x => x._id === selId);
  if (!p || !widget) {
    if(widget) widget.className = "hidden";
    return;
  }

  widget.classList.remove('hidden');
  document.getElementById('est-instock').innerText = `${p.quantity} units available`;
  
  const total = p.sellPrice * qtyInput;
  const profit = (p.sellPrice - p.buyPrice) * qtyInput;
  
  document.getElementById('est-total').innerText = "₹" + total.toFixed(2);
  document.getElementById('est-profit').innerText = "₹" + profit.toFixed(2);
}

function switchTab(id) {
  const tabNew = document.getElementById('tab-new-entry');
  const tabPos = document.getElementById('tab-pos-billing');
  const btnNew = document.getElementById('btn-tab-new');
  const btnPos = document.getElementById('btn-tab-pos');

  if(id === "tab-new-entry") {
    tabNew.classList.remove('hidden');
    tabPos.classList.add('hidden');
    btnNew.className = "flex-1 py-3 text-xs font-semibold text-slate-900 border-b-2 border-slate-900 bg-white";
    btnPos.className = "flex-1 py-3 text-xs font-semibold text-slate-550 border-b-2 border-transparent";
  } else {
    tabNew.classList.add('hidden');
    tabPos.classList.remove('hidden');
    btnPos.className = "flex-1 py-3 text-xs font-semibold text-slate-900 border-b-2 border-slate-900 bg-white";
    btnNew.className = "flex-1 py-3 text-xs font-semibold text-slate-550 border-b-2 border-transparent";
  }
}

function setupListeners() {
  document.getElementById('txt-search').addEventListener('input', renderInventoryTable);
  document.getElementById('sel-filter').addEventListener('change', renderInventoryTable);
  document.getElementById('pos-sel-product').addEventListener('change', triggerEstimates);
  document.getElementById('pos-val-qty').addEventListener('input', triggerEstimates);

  // Submit new product
  document.getElementById('frm-add-product').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('add-val-name').value,
      category: document.getElementById('add-val-category').value,
      buyPrice: Number(document.getElementById('add-val-buy').value),
      sellPrice: Number(document.getElementById('add-val-sell').value),
      quantity: Number(document.getElementById('add-val-qty').value),
      lowStockThreshold: Number(document.getElementById('add-val-threshold').value),
      expiryDate: document.getElementById('add-val-expiry').value
    };

    const res = await fetch('/api/products', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Product batch added successfully to local engine!");
      document.getElementById('frm-add-product').reset();
      getProducts();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  });

  // Submit sale trans
  document.getElementById('frm-pos-sale').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      productId: document.getElementById('pos-sel-product').value,
      qtySold: Number(document.getElementById('pos-val-qty').value)
    };

    const res = await fetch('/api/sales', {
      method: "POST",
      headers: { "Content-Type" : "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Customer sale recorded successfully!");
      document.getElementById('frm-pos-sale').reset();
      document.getElementById('pos-estimates-widget').className = "hidden";
      getProducts();
    } else {
      const err = await res.json();
      alert("Billing Error: " + err.error);
    }
  });
}

// Spark up
window.onload = initDashboard;
