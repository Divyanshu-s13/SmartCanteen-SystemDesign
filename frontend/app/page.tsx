'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, type MouseEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { navigateWithTransition } from '../lib/navigation';

export default function HomePage() {
  const { isAuthenticated, isLoading, login, signup } = useAuth();
  const router = useRouter();

  const [isBowlPopping, setIsBowlPopping] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  useEffect(() => {
    if (!isBowlPopping) return;

    const timeoutId = window.setTimeout(() => {
      setIsBowlPopping(false);
    }, 380);

    return () => window.clearTimeout(timeoutId);
  }, [isBowlPopping]);

  useEffect(() => {
    if (!authModal) return;

    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuthModal(null);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [authModal]);

  useEffect(() => {
    const onAuthOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: 'login' | 'signup'; redirectAfterAuth?: string | null }>;
      const type = customEvent.detail?.type ?? 'login';
      const nextRedirect = customEvent.detail?.redirectAfterAuth ?? null;

      setRedirectAfterAuth(nextRedirect);
      setAuthError('');
      setAuthModal(type);
    };

    window.addEventListener('deque-auth-open', onAuthOpen as EventListener);
    return () => window.removeEventListener('deque-auth-open', onAuthOpen as EventListener);
  }, []);

  const openAuthModal = (type: 'login' | 'signup') => {
    setAuthError('');
    setAuthModal(type);
  };

  const closeAuthModal = () => {
    if (authLoading) return;
    setAuthModal(null);
  };

  const handleMenuClick = () => {
    if (isAuthenticated) {
      navigateWithTransition(() => router.push('/menu'));
      return;
    }

    setRedirectAfterAuth('/menu');
    openAuthModal('login');
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const result = await login(loginEmail, loginPassword);

    if (!result.success) {
      setAuthError(result.message);
      setAuthLoading(false);
      return;
    }

    if (!rememberMe) {
      setLoginPassword('');
    }

    setAuthModal(null);
    setAuthLoading(false);

    if (redirectAfterAuth) {
      navigateWithTransition(() => router.push(redirectAfterAuth));
      setRedirectAfterAuth(null);
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');

    if (signupPassword !== signupConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    const result = await signup(signupName, signupEmail, signupPassword);

    if (!result.success) {
      setAuthError(result.message);
      setAuthLoading(false);
      return;
    }

    setAuthModal(null);
    setAuthLoading(false);
  };

  const triggerBowlPop = () => {
    setIsBowlPopping(false);
    window.requestAnimationFrame(() => setIsBowlPopping(true));
  };

  const handleBowlClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    const activationRadius = Math.min(rect.width, rect.height) * 0.24;

    if (distanceFromCenter <= activationRadius) {
      triggerBowlPop();
    }
  };

  const handleBowlKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerBowlPop();
    }
  };

  const menuTiles = [
    {
      title: 'Pizza',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=520&q=80',
    },
    {
      title: 'Burgers',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=520&q=80',
    },
    {
      title: 'Sushi',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=520&q=80',
    },
    {
      title: 'Vegan',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=520&q=80',
    },
    {
      title: 'Desserts',
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=520&q=80',
    },
    {
      title: 'Drinks',
      image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=520&q=80',
    },
  ];

  const cravingItems = Array.from({ length: 6 }, () => 'What are you craving today?');

  return (
    <div className="eat-shell">
      <main className="eat-frame">
        <section className="eat-hero" aria-label="Hero">
          <h1 className="eat-title">
            <span className="eat-title-top">ORDER</span>
            <span className="eat-title-bottom">&amp; GO</span>
          </h1>

          <div
            className={`eat-bowl-wrap eat-bowl-wrap-clickable ${isBowlPopping ? 'eat-bowl-pop' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Pop bowl effect"
            onClick={handleBowlClick}
            onKeyDown={handleBowlKeyDown}
          >
            <img
              className="eat-bowl"
              src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1300&q=80"
              alt="Fresh salad bowl"
            />
            <span className="eat-bowl-center-hit" aria-hidden="true" />
          </div>

          <p className="eat-hero-copy">
            We appreciate your trust greatly. Our clients choose us and our products.
          </p>
        </section>

        <section className="eat-question" aria-label="What are you craving today marquee">
          <div className="eat-question-lane">
            <div className="eat-marquee-track">
              {[...cravingItems, ...cravingItems].map((item, index) => (
                <span className="eat-marquee-item" key={`${item}-${index}`}>
                  {item}
                  <span className="eat-marquee-sep" aria-hidden="true">*</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="eat-strip">
          <p className="eat-strip-title">WE&apos;VE GOT IT ALL!</p>
        </section>

        <section id="categories" className="eat-grid" aria-label="Categories">
          {menuTiles.map((tile) => (
            <button
              type="button"
              className="eat-tile eat-tile-btn"
              key={tile.title}
              onClick={handleMenuClick}
            >
              <img src={tile.image} alt={tile.title} className="eat-tile-image" />
              <span className="eat-tile-label">{tile.title}</span>
            </button>
          ))}
        </section>
      </main>

      {authModal && (
        <div className="auth-overlay" onClick={closeAuthModal}>
          <section className="auth-popup eat-modal-popup" aria-label="Authentication popup" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="auth-close eat-modal-close" onClick={closeAuthModal} aria-label="Close popup">
              x
            </button>

            <div className="auth-header">
              <p className="auth-brand">Deque</p>
              <h2 className="auth-title">{authModal === 'login' ? 'Log in' : 'Sign up'}</h2>
              <p className="auth-subtitle">
                {authModal === 'login'
                  ? 'Welcome back. Continue your order journey.'
                  : 'Create your account and start ordering in seconds.'}
              </p>
            </div>

            {authError && <p className="auth-error">{authError}</p>}

            {authModal === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="E-mail"
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Password"
                  required
                  className="auth-input"
                />
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>
                <button type="submit" className="auth-submit" disabled={authLoading || isLoading}>
                  {authLoading || isLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="auth-footer-text">
                  New here?{' '}
                  <button type="button" className="auth-link-inline" onClick={() => setAuthModal('signup')}>
                    Sign up
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="auth-form">
                <input
                  type="text"
                  value={signupName}
                  onChange={(event) => setSignupName(event.target.value)}
                  placeholder="Full name"
                  required
                  className="auth-input"
                />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  placeholder="E-mail"
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder="Password"
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(event) => setSignupConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required
                  className="auth-input"
                />
                <button type="submit" className="auth-submit" disabled={authLoading || isLoading}>
                  {authLoading || isLoading ? 'Creating account...' : 'Create Account'}
                </button>
                <p className="auth-footer-text">
                  Already have an account?{' '}
                  <button type="button" className="auth-link-inline" onClick={() => setAuthModal('login')}>
                    Sign in
                  </button>
                </p>
              </form>
            )}

            <p className="auth-terms">
              By continuing, you agree to our <Link href="#">Terms</Link> and <Link href="#">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
