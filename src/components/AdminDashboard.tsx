import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Package, TrendingUp, Trash2, Edit2, 
  ArrowLeft, LayoutDashboard, ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Sale } from '../types';

interface AdminDashboardProps {
  token: string;
  onExit: () => void;
  products: Product[];
  sales: Sale[];
  refreshData: () => void;
}

export default function AdminDashboard({ token, onExit, products, sales, refreshData }: AdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users'>('users');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  
  // Edit User Form State
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
      else alert("Failed to delete user: " + (await res.json()).message);
    } catch (e) {
      console.error(e);
    }
  };

  const changeUserRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchUsers();
      else alert("Failed to update role");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/auth/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setNewUser({ email: '', password: '', role: 'user' });
        setShowAddUser(false);
        fetchUsers();
      } else {
        alert("Failed to create user: " + (await res.json()).message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/auth/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          email: editingUser.email,
          role: editingUser.role,
          ...(editingUser.password ? { password: editingUser.password } : {})
        })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Failed to update user: " + (await res.json()).message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refreshData();
      else alert("Failed to delete product");
    } catch (e) {
      console.error(e);
    }
  };

  const saveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editingProduct)
      });
      if (res.ok) {
        setEditingProduct(null);
        refreshData();
      } else {
        alert("Failed to update product");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSale = async (id: string) => {
    if (!window.confirm("Are you sure you want to void this sale?")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refreshData();
      else alert("Failed to delete sale");
    } catch (e) {
      console.error(e);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.qtySold * sale.sellPrice), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen w-full flex flex-col md:flex-row bg-slate-50 md:overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-[#0a0f1c] text-white flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Admin Console</h2>
            <p className="text-xs text-slate-400">Superuser Access</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto min-h-0">
          {[
            { id: 'users', icon: Users, label: 'Manage Users' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-auto md:w-full shrink-0 flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10 relative">
        <AnimatePresence mode="wait">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold text-slate-900">User Management</h1>
                <button 
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {showAddUser ? 'Cancel' : '+ Add User'}
                </button>
              </div>

              {showAddUser && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200 mb-6 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-2xl"></div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900"><Users className="w-5 h-5"/> Register New User</h3>
                  <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Email Address</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" required />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Password</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" required minLength={6} />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white">
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button type="submit" className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">Create User</button>
                    </div>
                  </form>
                </div>
              )}

              {editingUser && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200 mb-6 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-2xl"></div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900"><Edit2 className="w-5 h-5"/> Edit User</h3>
                  <form onSubmit={handleEditUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Email Address</label>
                      <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" required />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">New Password (Optional)</label>
                      <input type="password" placeholder="Leave blank to keep current" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" minLength={6} />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Role</label>
                      <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white">
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingUser(null)} className="w-1/2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                      <button type="submit" className="w-1/2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">Save</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Account Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                        <td className="px-6 py-4">
                          <select 
                            value={u.role}
                            onChange={(e) => changeUserRole(u._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 outline-none cursor-pointer ${
                              u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingUser(u)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteUser(u._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
