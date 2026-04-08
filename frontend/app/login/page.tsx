'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    router.push('/');

    setIsLoading(false);
  };

  return (
    <main className="auth-scene">
      <div className="auth-backdrop" />
      <section className="auth-popup" aria-label="Login form">
        <Link href="/" className="auth-close" aria-label="Close login popup">
          x
        </Link>

        <div className="auth-header">
          <p className="auth-brand">Deque</p>
          <h1 className="auth-title">Log in</h1>
          <p className="auth-subtitle">
            Welcome back. Sign in to continue your orders and queue tracking.
          </p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            className="auth-input"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="auth-input"
          />

          <div className="auth-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>

            <Link href="/signup" className="auth-link-inline">
              Create account
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer-text">
          New here?{' '}
          <Link href="/signup" className="auth-link-inline">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
