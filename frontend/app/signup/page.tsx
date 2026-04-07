'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

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
    <main className="auth-scene">
      <div className="auth-backdrop" />
      <section className="auth-popup" aria-label="Signup form">
        <Link href="/" className="auth-close" aria-label="Close signup popup">
          x
        </Link>

        <div className="auth-header">
          <p className="auth-brand">Deque</p>
          <h1 className="auth-title">Sign up</h1>
          <p className="auth-subtitle">
            Create your account to order faster and track the queue in real time.
          </p>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="auth-input"
          />

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

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            className="auth-input"
          />

          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link href="/login" className="auth-link-inline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
