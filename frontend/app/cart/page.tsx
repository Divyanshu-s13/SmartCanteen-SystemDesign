'use client';

/**
 * Cart Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { orderApi, paymentApi } from '@/services/api';
import { Navbar } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { formatPrice, getPaymentMethodLabel } from '@/lib/utils';
import type { PaymentMethod, PaymentMethodInfo } from '@/types';

export default function CartPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { items, totalPrice, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    const response = await paymentApi.getMethods();
    if (response.success && response.data) {
      setPaymentMethods(response.data);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError('');

    const orderData = {
      items: items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      })),
    };

    const response = await orderApi.create(orderData);

    if (response.success && response.data) {
      setOrderId(response.data.id);
      setShowPaymentModal(true);
    } else {
      setError(response.message);
    }

    setIsProcessing(false);
  };

  const handlePayment = async () => {
    if (!orderId) return;

    setIsProcessing(true);
    setError('');

    let details: Record<string, any> = {};
    if (selectedMethod === 'upi') {
      details = { upiId: paymentDetails.upiId || 'user@upi' };
    } else if (selectedMethod === 'card') {
      details = {
        cardNumber: paymentDetails.cardNumber || '4111111111111111',
        expiryMonth: paymentDetails.expiryMonth || '12',
        expiryYear: paymentDetails.expiryYear || '25',
        cvv: paymentDetails.cvv || '123',
      };
    } else if (selectedMethod === 'wallet') {
      details = {
        walletId: paymentDetails.walletId || 'wallet123',
        pin: paymentDetails.pin || '1234',
      };
    }

    const response = await paymentApi.process({
      orderId,
      method: selectedMethod,
      paymentDetails: details,
    });

    if (response.success) {
      clearCart();
      setShowPaymentModal(false);
      router.push(`/orders?new=${orderId}`);
    } else {
      setError(response.message);
    }

    setIsProcessing(false);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/menu"
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 push-switch"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              Your Cart
            </h1>
            <p className="text-sm text-on-surface-variant font-label uppercase tracking-widest">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {items.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="bg-surface-container-low rounded-2xl p-5 extruded-card border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-headline font-bold text-on-surface text-lg">
                        {item.menuItem.name}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {formatPrice(item.menuItem.price)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center push-switch"
                        >
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">remove</span>
                        </button>
                        <span className="w-10 text-center font-headline font-bold text-cyan-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center push-switch"
                        >
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">add</span>
                        </button>
                      </div>

                      {/* Item Total */}
                      <span className="w-24 text-right font-headline font-bold text-on-surface">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg push-switch"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 sticky top-24">
                <h3 className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-headline">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Delivery</span>
                    <span className="font-headline text-tertiary">Free</span>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-headline font-bold text-on-surface">Total</span>
                    <span className="text-2xl font-headline font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">payment</span>
                      Place Order & Pay
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-12 text-center extruded-card border border-white/5">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">shopping_cart</span>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
              Your cart is empty
            </h3>
            <p className="text-on-surface-variant mb-6">
              Add some delicious items from the menu
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
            >
              <span className="material-symbols-outlined">restaurant_menu</span>
              Browse Menu
            </Link>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          ></div>
          
          <div className="relative bg-surface-container-low rounded-2xl p-8 max-w-md w-full mx-4 extruded-card border border-white/10">
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">Complete Payment</h2>
            <p className="text-on-surface-variant text-sm mb-6">Choose your payment method</p>

            <div className="text-center mb-6 py-4 bg-surface-container rounded-xl">
              <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">Amount to Pay</p>
              <p className="text-3xl font-headline font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                {formatPrice(totalPrice)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl text-center transition-all push-switch ${
                      selectedMethod === method.id
                        ? 'bg-cyan-400/20 border-2 border-cyan-400 text-cyan-400'
                        : 'bg-surface-container border-2 border-transparent text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-1">
                      {method.id === 'upi' ? 'qr_code_2' : method.id === 'card' ? 'credit_card' : 'account_balance_wallet'}
                    </span>
                    <span className="block font-headline font-bold text-xs">
                      {getPaymentMethodLabel(method.id)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {selectedMethod === 'upi' && (
              <div className="mb-6">
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={paymentDetails.upiId || ''}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                />
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentDetails.cardNumber || ''}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">MM</label>
                    <input
                      type="text"
                      placeholder="12"
                      value={paymentDetails.expiryMonth || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryMonth: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">YY</label>
                    <input
                      type="text"
                      placeholder="25"
                      value={paymentDetails.expiryYear || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryYear: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      value={paymentDetails.cvv || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'wallet' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                    Wallet ID
                  </label>
                  <input
                    type="text"
                    placeholder="wallet123"
                    value={paymentDetails.walletId || ''}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, walletId: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                    PIN
                  </label>
                  <input
                    type="password"
                    placeholder="****"
                    maxLength={4}
                    value={paymentDetails.pin || ''}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, pin: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-headline font-bold rounded-xl push-switch disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Spinner size="sm" />
                ) : (
                  <>Pay {formatPrice(totalPrice)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
