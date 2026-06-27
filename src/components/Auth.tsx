import React, { useState } from 'react';
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
      
      {/* LEFT COLUMN: BRANDING & INTERACTIVE ANIMATION (60% width) */}
      <div className="hidden lg:flex lg:w-[60%] bg-[#0a0f1c] relative overflow-hidden items-center justify-center p-12 xl:p-20 border-r border-slate-800">
        
        {/* Animated Abstract Background Grid & Glows */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e511_1px,transparent_1px),linear-gradient(to_bottom,#4f46e511_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 to-teal-500/10 rounded-full blur-3xl"
          />
        </div>

        {/* Floating Mock UI Elements for "Life" */}
        <motion.div 
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-20 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl z-0 w-64 hidden xl:block"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">+24.5%</span>
          </div>
          <p className="text-slate-400 text-xs mb-1">Today's Profit</p>
          <h4 className="text-white font-display font-bold text-xl">₹12,450</h4>
        </motion.div>

        <motion.div 
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-20 bottom-32 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl z-0 w-64 hidden xl:block"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Low Stock Alert</p>
          </div>
          <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
            <span className="text-slate-300 text-sm">Fortune Oil 1L</span>
            <span className="text-amber-400 font-mono font-bold">2 left</span>
          </div>
        </motion.div>

        {/* Branding Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 relative text-white max-w-xl w-full"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
            <Package className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-display font-extrabold mb-6 tracking-tight leading-[1.1]">
            Run your store like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">pro.</span>
          </h1>
          
          <p className="text-slate-300 text-lg mb-10 leading-relaxed font-light max-w-lg">
            Say goodbye to messy notebooks and guesswork. Smart Inventory tracks what sells, warns you before things expire, and protects your data—so you can focus on growing your business.
          </p>
          
          {/* Animated Features List */}
          <div className="space-y-6">
            {[
              { icon: Package, title: 'Never run out of stock', text: 'Get instantly notified before popular items hit zero.' },
              { icon: TrendingUp, title: 'See your real profits', text: 'Know exactly how much money you made today, down to the rupee.' },
              { icon: ShieldCheck, title: 'Your data is locked down', text: 'Bank-level security ensures nobody else sees your inventory.' },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.15) }}
                className="flex items-start gap-4 text-slate-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50 shadow-inner group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-colors shrink-0">
                  <feature.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-[15px] mb-1">{feature.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
              {isLogin ? 'Welcome back' : 'Create an account'}
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
                  placeholder="admin"
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
