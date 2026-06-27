import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Package, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Sale } from '../types';

interface AdminHubProps {
  token: string;
  products: Product[];
  sales: Sale[];
}

export default function AdminHub({ token, products, sales }: AdminHubProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchUsers();
  }, [token]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.qtySold * sale.sellPrice), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">Admin Control Center</h2>
          <p className="text-indigo-200 text-sm opacity-90">Global view across all multi-tenant accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 text-sm font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-500" /> Total Users
          </div>
          <div className="text-3xl font-bold text-slate-900">{loading ? '...' : users.length}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 text-sm font-semibold uppercase tracking-wider">
            <Package className="w-4 h-4 text-emerald-500" /> Global Items
          </div>
          <div className="text-3xl font-bold text-slate-900">{products.length}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 text-sm font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Global Revenue
          </div>
          <div className="text-3xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 text-sm font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-green-500" /> Global Profit
          </div>
          <div className="text-3xl font-bold text-slate-900">₹{totalProfit.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Registered Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Account Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </motion.div>
  );
}
