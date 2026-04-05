'use client';

/**
 * Login Page - Tactile Cyber-Brutalism Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <span className="text-4xl font-bold tracking-tighter text-cyan-400 font-headline drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              SmartCanteen
            </span>
            <span className="text-[10px] font-label uppercase tracking-[0.3em] text-slate-500">
              Kinetic Command Center
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-low rounded-3xl p-8 extruded-card border border-white/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
              System Access
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-label uppercase tracking-widest">
              Authenticate to Continue
            </p>
          </div>

          {error && (
            <div className="bg-error-container/20 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@system.io"
                  required
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface font-body placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-400/50 outline-none neumorphic-inset transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-slate-400 mb-2">
                Access Code
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 text-on-surface font-body placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-400/50 outline-none neumorphic-inset transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-bold text-sm tracking-[0.2em] uppercase extruded-card hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">login</span>
                  Initialize Session
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New operator?{' '}
            <Link
              href="/signup"
              className="text-cyan-400 hover:text-cyan-300 font-headline font-bold uppercase tracking-wider"
            >
              Request Access
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-outline-variant/20">
            <p className="text-[10px] font-label uppercase tracking-widest text-slate-600 text-center mb-4">
              Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@smartcanteen.com');
                  setPassword('admin123');
                }}
                className="bg-surface-container-high hover:bg-surface-variant px-4 py-3 rounded-xl text-left transition-all group"
              >
                <p className="text-[10px] font-label uppercase tracking-widest text-slate-500 group-hover:text-cyan-400">
                  Admin
                </p>
                <p className="text-xs text-slate-400 truncate">admin@smartcanteen.com</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('john@student.edu');
                  setPassword('student123');
                }}
                className="bg-surface-container-high hover:bg-surface-variant px-4 py-3 rounded-xl text-left transition-all group"
              >
                <p className="text-[10px] font-label uppercase tracking-widest text-slate-500 group-hover:text-cyan-400">
                  Student
                </p>
                <p className="text-xs text-slate-400 truncate">john@student.edu</p>
              </button>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <p className="text-center mt-6 text-[10px] font-label uppercase tracking-widest text-slate-700">
          System v2.0 • Node_Alpha-1
        </p>
      </div>
    </div>
  );
}
