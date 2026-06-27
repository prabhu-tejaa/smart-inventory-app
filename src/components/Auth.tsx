import React, { useState, useEffect } from 'react';
import { Package, Lock, Mail, UserPlus, LogIn, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
  dbStatus: { connected: boolean; info: string; mode: string };
}

export default function Auth({ onLogin, dbStatus }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dbStatus.connected) {
      setError('Authentication requires an active database connection. Cannot authenticate in offline mode.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex">
      
      {/* LEFT COLUMN: MINIMALIST BRANDING (60% width) */}
      <div className="hidden lg:flex lg:w-[60%] bg-[#0a0f1c] relative overflow-hidden items-center justify-center p-12 border-r border-slate-800">
        
        {/* Animated Abstract Background Glows (Subtle) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl"
          />
        </div>

        {/* Minimal Static Text */}
        <div className="relative z-10 w-full max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-display font-bold mb-6 tracking-tight text-white leading-tight">
            Smart Inventory App,<br/>
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% auto" }}
              className="font-light bg-gradient-to-r from-slate-500 via-indigo-300 to-slate-500 bg-clip-text text-transparent inline-block"
            >
              track all your products.
            </motion.span>
          </h1>
        </div>
      </div>

      {/* RIGHT COLUMN: AUTHENTICATION FORM (40% width) */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        <div className="max-w-sm w-full">
          
          {/* Mobile-only branding header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900">Smart Inventory</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Secure Access Portal</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900 mb-2">
              {isLogin ? 'Access Workspace' : 'Create an account'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Enter your credentials to access your dashboard.' : 'Sign up to start managing your inventory.'}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-start gap-3 shadow-sm"
              >
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div layout>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email or Username</label>
              <div className="relative group">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-indigo-500" />
                <input 
                  type="text" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm font-medium text-slate-900"
                  placeholder="Enter email or username"
                />
              </div>
            </motion.div>

            <motion.div layout>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative group">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-indigo-500" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm font-medium text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 transition-colors group-focus-within:text-indigo-500" />
                    <input 
                      type="password" 
                      required 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm font-medium text-slate-900"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              layout
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] disabled:opacity-70 disabled:cursor-not-allowed mt-8 text-[15px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn className="w-5 h-5" /> Sign In to Workspace</>
              ) : (
                <><UserPlus className="w-5 h-5" /> Initialize Account</>
              )}
            </motion.button>
          </form>

          <motion.div layout className="mt-10 text-center text-sm text-slate-500 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {isLogin ? "Sign up here" : "Sign in here"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
