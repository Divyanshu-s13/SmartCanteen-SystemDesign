'use client';

/**
 * Admin Menu Management Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { menuApi } from '@/services/api';
import { Navbar } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { formatPrice, getCategoryLabel, cn } from '@/lib/utils';
import type { MenuItem, MenuCategory } from '@/types';

const categories = [
  { value: 'snacks', label: 'Snacks' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'meals', label: 'Meals' },
];

export default function AdminMenuPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'snacks' as MenuCategory,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && user?.role === 'admin') {
      loadMenu();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadMenu = async () => {
    setIsLoading(true);
    const response = await menuApi.getAll();
    if (response.success && response.data) {
      setItems(response.data);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'snacks',
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const data = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
    };

    let response;
    if (editingItem) {
      response = await menuApi.update(editingItem.id, data);
    } else {
      response = await menuApi.create(data);
    }

    if (response.success) {
      setShowModal(false);
      loadMenu();
    } else {
      setError(response.message);
    }

    setIsSubmitting(false);
  };

  const handleToggleAvailability = async (id: string) => {
    const response = await menuApi.toggleAvailability(id);
    if (response.success) {
      loadMenu();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const response = await menuApi.delete(id);
    if (response.success) {
      loadMenu();
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              Menu Management
            </h1>
            <p className="text-sm text-on-surface-variant font-label uppercase tracking-widest">
              Add, edit, or remove menu items
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Add Item
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl overflow-hidden extruded-card border border-white/5">
            <table className="min-w-full">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {items.map((item) => (
                  <tr key={item.id} className={cn(
                    'hover:bg-surface-container/50 transition-colors',
                    !item.isAvailable && 'opacity-50'
                  )}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-headline font-bold text-on-surface">
                          {item.name}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-label uppercase tracking-widest rounded-full border border-primary/30">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-headline font-bold text-cyan-400">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg push-switch ${
                          item.isAvailable 
                            ? 'bg-tertiary/10 border border-tertiary/30' 
                            : 'bg-surface-container border border-outline-variant/20'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${
                          item.isAvailable ? 'text-tertiary' : 'text-slate-600'
                        }`}>
                          {item.isAvailable ? 'toggle_on' : 'toggle_off'}
                        </span>
                        <span className={`text-xs font-label uppercase tracking-widest ${
                          item.isAvailable ? 'text-tertiary' : 'text-slate-600'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 bg-surface-container hover:bg-surface-container-high rounded-lg push-switch"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-error/10 hover:bg-error/20 rounded-lg push-switch"
                        >
                          <span className="material-symbols-outlined text-error">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          
          <div className="relative bg-surface-container-low rounded-2xl p-8 max-w-md w-full mx-4 extruded-card border border-white/10">
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuCategory })}
                  className="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/20 text-on-surface focus:outline-none focus:border-cyan-400/50 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-6 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-headline font-bold rounded-xl push-switch"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>{editingItem ? 'Update' : 'Add'} Item</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
