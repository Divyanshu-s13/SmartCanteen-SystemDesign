'use client';

/**
 * Menu List Component - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { menuApi } from '@/services/api';
import { MenuItemCard } from './MenuItemCard';
import { Spinner } from '@/components/ui';
import type { MenuItem } from '@/types';

interface MenuListProps {
  category?: string;
}

export function MenuList({ category }: MenuListProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    const response = await menuApi.getAll();
    if (response.success && response.data) {
      setItems(response.data);
    }
    setIsLoading(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest mt-4">
          Loading Inventory...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative group max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400">
          search
        </span>
        <input
          type="search"
          placeholder="Scan system for nutrients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container-lowest border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-cyan-400/50 font-label tracking-tight outline-none placeholder:text-slate-500 neumorphic-inset"
        />
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
          {/* Empty Filler Slot */}
          <div className="bg-surface-container-lowest/50 rounded-[2rem] p-8 border border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center min-h-[280px]">
            <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">
              fastfood
            </span>
            <p className="text-slate-600 font-headline font-medium text-sm tracking-widest uppercase">
              New Recipes Syncing...
            </p>
            <p className="text-slate-700 text-xs mt-2">Next refresh soon</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">
            search_off
          </span>
          <p className="text-slate-500 font-headline text-lg tracking-widest uppercase">
            {searchTerm ? 'No items found matching your search.' : 'No menu items available.'}
          </p>
        </div>
      )}
    </div>
  );
}
