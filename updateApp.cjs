const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
content = content.replace(
  "import { Package, Search, PlusCircle, AlertTriangle, Calendar, Clock, RefreshCw, LogOut, Database, History, TrendingUp, Filter, ShoppingCart, Activity, CheckCircle2, MoreVertical, X } from 'lucide-react';",
  "import { Package, Search, PlusCircle, AlertTriangle, Calendar, Clock, RefreshCw, LogOut, Database, History, TrendingUp, Filter, ShoppingCart, Activity, CheckCircle2, MoreVertical, X, User } from 'lucide-react';\nimport Auth from './components/Auth';\nimport Profile from './components/Profile';"
);

// Add state for auth
content = content.replace(
  "export default function App() {",
  "export default function App() {\n  const [token, setToken] = useState(() => localStorage.getItem('token') || '');\n  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));\n\n  const handleLogin = (newToken, newUser) => {\n    localStorage.setItem('token', newToken);\n    localStorage.setItem('user', JSON.stringify(newUser));\n    setToken(newToken);\n    setUser(newUser);\n  };\n\n  const handleLogout = () => {\n    localStorage.removeItem('token');\n    localStorage.removeItem('user');\n    setToken('');\n    setUser(null);\n  };\n\n  const authHeaders = { 'Authorization': `Bearer ${token}` };"
);

// Inject headers into fetch calls
content = content.replace(
  /fetch\('\/api\/db-status'\)/g,
  "fetch('/api/db-status', { headers: token ? authHeaders : {} })"
);

content = content.replace(
  /fetch\('\/api\/products'\)/g,
  "fetch('/api/products', { headers: authHeaders })"
);

content = content.replace(
  /fetch\('\/api\/sales'\)/g,
  "fetch('/api/sales', { headers: authHeaders })"
);

content = content.replace(
  /fetch\('\/api\/products', {/g,
  "fetch('/api/products', {\n      headers: { ...authHeaders, 'Content-Type': 'application/json' },"
);

content = content.replace(
  /fetch\('\/api\/sales', {/g,
  "fetch('/api/sales', {\n      headers: { ...authHeaders, 'Content-Type': 'application/json' },"
);

content = content.replace(
  /fetch\(`\/api\/products\/\$\{id\}`,\s*\{/g,
  "fetch(`/api/products/${id}`, {\n      headers: { ...authHeaders, 'Content-Type': 'application/json' },"
);

// We need to return Auth component if not logged in
// Find the first return statement of App component.
// It's after `useEffect`.
content = content.replace(
  "return (",
  "if (!token || !user) {\n    return <Auth onLogin={handleLogin} dbStatus={dbStatus} />;\n  }\n\n  return ("
);

// Add Log Out button to header and Profile tab
content = content.replace(
  "          <span className=\"font-display font-medium tracking-tight text-slate-900 text-base md:text-lg\">\n            Smart Inventory\n          </span>\n        </div>",
  "          <span className=\"font-display font-medium tracking-tight text-slate-900 text-base md:text-lg\">\n            Smart Inventory\n          </span>\n        </div>\n\n        <div className=\"flex items-center gap-3\">\n          <button onClick={() => setActiveTab('profile')} className=\"text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800\">\n            <User className=\"w-4 h-4\" /> {user.email}\n          </button>\n          <button onClick={handleLogout} className=\"text-xs font-semibold text-slate-500 flex items-center gap-1 hover:text-slate-800\">\n            <LogOut className=\"w-4 h-4\" /> Logout\n          </button>\n        </div>"
);

// Add Profile tab to navigation
content = content.replace(
  "<button\n            onClick={() => setActiveTab('sales-log')}",
  "<button\n            onClick={() => setActiveTab('profile')}\n            className={`px-4 py-2.5 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}\n          >\n            <User className=\"w-4 h-4\" />\n            <span className=\"hidden sm:inline\">Profile</span>\n          </button>\n          <button\n            onClick={() => setActiveTab('sales-log')}"
);

// Render Profile component
content = content.replace(
  "{/* TAB 3: TODAY'S SALES TRANSACTION LOGS */}",
  "{activeTab === 'profile' && <Profile user={user} token={token} />}\n\n                {/* TAB 3: TODAY'S SALES TRANSACTION LOGS */}"
);

// Fix headers string replacements just in case they matched differently
content = content.replace(
  "headers: {\n        'Content-Type': 'application/json'\n      },",
  "headers: {\n        'Content-Type': 'application/json',\n        ...authHeaders\n      },"
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated for auth');
