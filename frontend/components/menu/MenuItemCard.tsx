'use client';

/**
 * Menu Item Card Component - Tactile Cyber-Brutalism Design
 */

import { useCart } from '@/contexts/CartContext';
import { formatPrice, getCategoryLabel, cn } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  // Generate a placeholder image gradient based on category
  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'snacks':
        return 'from-amber-500/20 to-orange-600/20';
      case 'drinks':
        return 'from-cyan-500/20 to-blue-600/20';
      case 'meals':
        return 'from-green-500/20 to-emerald-600/20';
      default:
        return 'from-slate-500/20 to-slate-600/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'snacks':
        return 'cookie';
      case 'drinks':
        return 'local_cafe';
      case 'meals':
        return 'restaurant';
      default:
        return 'fastfood';
    }
  };

  return (
    <div
      className={cn(
        'bg-surface-container-low rounded-[2rem] p-4 extruded-card border border-white/5 group transition-all duration-300 hover:-translate-y-1',
        !item.isAvailable && 'opacity-60'
      )}
    >
      {/* Image Area */}
      <div className="relative h-48 mb-6 overflow-hidden rounded-2xl">
        {/* Gradient Background with Icon */}
        <div
          className={cn(
            'w-full h-full bg-gradient-to-br flex items-center justify-center',
            getCategoryGradient(item.category)
          )}
        >
          <span className="material-symbols-outlined text-6xl text-slate-600 transition-transform duration-500 group-hover:scale-110">
            {getCategoryIcon(item.category)}
          </span>
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
          {item.isAvailable ? (
            <>
              <span
                className="w-2 h-2 bg-tertiary rounded-full"
                style={{ boxShadow: '0 0 8px #abffcb' }}
              ></span>
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface">
                Available
              </span>
            </>
          ) : (
            <>
              <span
                className="w-2 h-2 bg-error rounded-full"
                style={{ boxShadow: '0 0 8px #ffb4ab' }}
              ></span>
              <span className="text-[10px] font-label uppercase tracking-widest text-error">
                Unavailable
              </span>
            </>
          )}
        </div>

        {/* Quantity Badge (if in cart) */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-cyan-400 text-on-primary w-8 h-8 rounded-full flex items-center justify-center font-headline font-bold text-sm shadow-[0_0_15px_rgba(0,229,255,0.5)]">
            {quantity}
          </div>
        )}

        {/* Unavailable Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
            <span className="bg-slate-950 px-4 py-2 rounded-lg border border-red-500/30 text-error text-[10px] font-headline font-bold uppercase tracking-[0.3em]">
              Processing...
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2 pb-2">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-headline font-bold tracking-tight text-on-surface">
            {item.name}
          </h3>
          <span className="text-cyan-400 font-headline font-bold">
            {formatPrice(item.price)}
          </span>
        </div>

        <p className="text-slate-500 text-xs font-body mb-6 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Tags */}
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-surface-container-highest text-[9px] font-label uppercase text-slate-400 rounded">
              {getCategoryLabel(item.category)}
            </span>
          </div>

          {/* Add Button / Quantity Controls */}
          {item.isAvailable ? (
            quantity > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-10 h-10 rounded-xl bg-surface-container-high border-t border-white/10 shadow-lg flex items-center justify-center text-slate-400 push-switch hover:bg-surface-variant hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="w-8 text-center font-headline font-bold text-cyan-400">
                  {quantity}
                </span>
                <button
                  onClick={() => addItem(item)}
                  className="w-10 h-10 rounded-xl bg-surface-container-high border-t border-white/10 shadow-lg flex items-center justify-center text-cyan-400 push-switch hover:bg-surface-variant transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => addItem(item)}
                className="w-12 h-12 rounded-xl bg-surface-container-high border-t border-white/10 shadow-lg flex items-center justify-center text-cyan-400 push-switch hover:bg-surface-variant transition-all"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            )
          ) : (
            <button
              disabled
              className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-white/5 flex items-center justify-center text-slate-700 cursor-not-allowed"
            >
              <span className="material-symbols-outlined">lock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
