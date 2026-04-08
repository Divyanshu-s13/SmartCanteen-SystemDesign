'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Spinner } from '@/components/ui';
import { formatPrice, getCategoryLabel } from '@/lib/utils';
import { menuApi } from '@/services/api';
import type { MenuItem } from '@/types';

export default function MenuPage() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const { itemCount, totalPrice, addItem, getItemQuantity, updateQuantity } = useCart();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'all' | 'popular' | 'snacks' | 'drinks' | 'meals'>('all');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const categories: Array<'all' | 'popular' | 'snacks' | 'drinks' | 'meals'> = ['all', 'popular', 'snacks', 'drinks', 'meals'];

  const imageByKeyword: Array<{ keywords: string[]; image: string }> = [
    {
      keywords: ['pizza', 'margherita', 'pepperoni'],
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['burger', 'hamburger'],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['sushi', 'maki'],
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['pasta', 'spaghetti', 'alfredo'],
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['noodle', 'ramen'],
      image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['sandwich', 'sub', 'wrap'],
      image: 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['salad', 'vegan'],
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['fries', 'snack', 'nacho'],
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['dessert', 'cake', 'brownie', 'ice cream'],
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['coffee', 'tea'],
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    },
    {
      keywords: ['juice', 'drink', 'smoothie', 'shake'],
      image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
    },
  ];

  const categoryFallbackImages: Record<string, string> = {
    meals: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
    snacks: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
    drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
  };

  const popularKeywords = [
    'burger',
    'pizza',
    'sandwich',
    'nacho',
    'fries',
    'pasta',
    'soft drink',
    'drink',
    'shake',
    'dessert',
    'chicken',
  ];

  const isMostPopular = (item: MenuItem) => {
    const text = `${item.name} ${item.description}`.toLowerCase();
    return popularKeywords.some((keyword) => text.includes(keyword));
  };

  const getMenuImage = (item: MenuItem) => {
    if (item.imageUrl) {
      return item.imageUrl;
    }

    const name = item.name.toLowerCase();
    const match = imageByKeyword.find(({ keywords }) =>
      keywords.some((keyword) => name.includes(keyword))
    );

    if (match) {
      return match.image;
    }

    return categoryFallbackImages[item.category] ?? categoryFallbackImages.meals;
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadMenu = async () => {
      setMenuLoading(true);
      const response = await menuApi.getAll();
      if (response.success && response.data) {
        setItems(response.data);
      }
      setMenuLoading(false);
    };

    if (isAuthenticated) {
      loadMenu();
    }
  }, [isAuthenticated]);

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') {
      return true;
    }
    if (activeCategory === 'popular') {
      return isMostPopular(item);
    }
    return item.category === activeCategory;
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest">
            Loading System...
          </span>
        </div>
      </div>
    );
  }

  if (menuLoading) {
    return (
      <div className="min-h-screen bg-[#ece9e3] text-[#2d312f]">
        <div className="pt-28 flex flex-col items-center justify-center gap-4">
          <Spinner size="lg" />
          <span className="font-headline tracking-[0.16em] text-xs uppercase text-[#8f402c]">
            Loading menu...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece9e3] text-[#2d312f]">
      <main className="menuv2-shell pt-8 pb-24 px-5 md:px-10">
        <header className="menuv2-head">
          <h1>Best Our Menu</h1>

          <div className="menuv2-filters" role="tablist" aria-label="Menu categories">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`menuv2-filter ${activeCategory === category ? 'menuv2-filter-active' : ''}`}
              >
                {category === 'popular' ? 'Most Popular' : category}
              </button>
            ))}
          </div>
        </header>

        <section className="menuv2-list" aria-label="Menu items">
          {filteredItems.map((item, index) => {
            const quantity = getItemQuantity(item.id);
            const image = getMenuImage(item);

            return (
              <article key={item.id} className="menuv2-row">
                <div className={`menuv2-row-inner ${index % 2 === 1 ? 'menuv2-row-reverse' : ''}`}>
                  <div className="menuv2-image-wrap">
                    <img src={image} alt={item.name} className="menuv2-image" />
                  </div>

                  <div className="menuv2-content-wrap">
                    <div className="menuv2-content">
                      <p className="menuv2-category">{getCategoryLabel(item.category)}</p>
                      <h2>{item.name}</h2>
                      <p className="menuv2-desc">{item.description}</p>
                      <p className="menuv2-price">{formatPrice(item.price)}</p>
                    </div>

                    {item.isAvailable ? (
                      quantity > 0 ? (
                        <div className="menuv2-qty">
                          <button onClick={() => updateQuantity(item.id, quantity - 1)}>-</button>
                          <span>{quantity}</span>
                          <button onClick={() => addItem(item)}>+</button>
                        </div>
                      ) : (
                        <button className="menuv2-arrow" onClick={() => addItem(item)} aria-label={`Add ${item.name}`}>
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      )
                    ) : (
                      <button className="menuv2-arrow menuv2-arrow-disabled" disabled>
                        <span className="material-symbols-outlined">lock</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="menuv2-empty">
              <p>No items available in this category right now.</p>
            </div>
          )}
        </section>

        {itemCount > 0 && (
          <div className="menuv2-cartbar">
            <div>
              <p>{itemCount} items in cart</p>
              <h3>{formatPrice(totalPrice)}</h3>
            </div>
            <Link href="/cart" className="menuv2-checkout">
              Checkout
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
