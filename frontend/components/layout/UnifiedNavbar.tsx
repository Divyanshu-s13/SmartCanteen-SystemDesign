'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { navigateWithTransition } from '../../lib/navigation';

export function UnifiedNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';

  const activePage: 'home' | 'menu' | 'order' = pathname === '/menu'
    ? 'menu'
    : pathname === '/orders'
      ? 'order'
      : 'home';
  
  const handleMenuClick = () => {
    if (isAuthenticated) {
      navigateWithTransition(() => router.push('/menu'));
      return;
    }

    router.push('/login');
  };

  const handleAuthClick = (type: 'login' | 'signup') => {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('deque-auth-open', {
        detail: {
          type,
          redirectAfterAuth: null,
        },
      }));
      return;
    }

    router.push(type === 'login' ? '/login' : '/signup');
  };

  const handleOrderClick = () => {
    if (isAuthenticated) {
      navigateWithTransition(() => router.push('/orders'));
      return;
    }

    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('deque-auth-open', {
        detail: {
          type: 'signup',
          redirectAfterAuth: '/orders',
        },
      }));
      return;
    }

    router.push('/signup');
  };

  const handleAdminClick = () => {
    if (isAuthenticated && isAdmin) {
      navigateWithTransition(() => router.push('/admin'));
    }
  };

  const homeClass = activePage === 'home' ? 'eat-link eat-link-active' : 'eat-link';
  const menuClass = activePage === 'menu' ? 'eat-link eat-link-btn eat-link-active' : 'eat-link eat-link-btn';
  const orderClass = activePage === 'order' ? 'eat-link eat-link-btn eat-link-active' : 'eat-link eat-link-btn';
  const profileName = user?.name?.split(' ')[0] || 'Profile';

  return (
    <header className="eat-nav">
      <Link href="/" className="eat-brand">
        Deque
      </Link>

      <nav className="eat-links" aria-label="Primary">
        <Link href="/" className={homeClass}>
          Home
        </Link>
        <button 
          type="button" 
          className={menuClass}
          onClick={handleMenuClick}
        >
          Menu
        </button>
        <button 
          type="button" 
          className={orderClass}
          onClick={handleOrderClick}
        >
          Order
        </button>
        <Link href="/queue" className="eat-link">Contact Us</Link>
      </nav>

      <div className="eat-auth-actions">
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <button type="button" className="eat-auth-btn eat-auth-btn-primary" onClick={handleAdminClick}>
                Admin
              </button>
            )}
            <button
              type="button"
              className="eat-profile-chip"
              aria-label={`Signed in as ${user?.name || 'user'}`}
              onClick={isAdmin ? handleAdminClick : undefined}
            >
              <span className="eat-profile-avatar">{profileName.charAt(0).toUpperCase()}</span>
              <span className="eat-profile-name">{profileName}</span>
            </button>
            <button type="button" className="eat-auth-btn eat-auth-btn-secondary" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="eat-auth-btn eat-auth-btn-secondary" onClick={() => handleAuthClick('login')}>
              Sign In
            </button>
            <button type="button" className="eat-auth-btn eat-auth-btn-primary" onClick={() => handleAuthClick('signup')}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
