'use client';

/**
 * Signup Page - Tactile Cyber-Brutalism Design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';

export default function SignupPage() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const result = await signup(name, email, password);
    if (!result.success) {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              <span className="material-symbols-outlined text-3xl text-background">restaurant</span>
            </div>
            <span className="font-headline font-bold text-3xl text-on-surface">
              Smart<span className="text-cyan-400">Canteen</span>
            </span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-surface-container-low rounded-3xl p-8 extruded-card border border-white/5">
          <h1 className="text-2xl font-headline font-bold text-on-surface text-center mb-2">
            Create Account
          </h1>
          <p className="text-sm text-on-surface-variant text-center mb-8">
            Join SmartCanteen today
          </p>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">person</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">lock</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-headline font-bold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
