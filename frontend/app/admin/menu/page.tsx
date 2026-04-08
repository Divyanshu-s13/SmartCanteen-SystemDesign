'use client';

/**
 * Admin Menu Management Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { menuApi } from '@/services/api';
import { AdminWarmHeader } from '@/components/layout';
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
      <div className="min-h-screen flex items-center justify-center bg-[#ece9e3]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece9e3] text-[#2f3633]">
      <AdminWarmHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#313835]">
              Menu Management
            </h1>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6f7571]">
              Add, edit, or remove menu items
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-md bg-[#ee4a21] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d9441d]"
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
          <div className="overflow-hidden rounded-2xl border border-[#ddd3c7] bg-white">
            <table className="min-w-full">
              <thead className="bg-[#f7f4ee]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6db]">
                {items.map((item) => (
                  <tr key={item.id} className={cn(
                    'transition-colors hover:bg-[#fbf8f3]',
                    !item.isAvailable && 'opacity-50'
                  )}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[#313835]">
                          {item.name}
                        </p>
                        <p className="text-sm text-[#6f7571]">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-[#f5c2b3] bg-[#fff2ed] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#8a3c2d]">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#ee4a21]">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                          item.isAvailable 
                            ? 'border border-emerald-200 bg-emerald-50' 
                            : 'border border-[#ddd3c7] bg-[#f8f5ef]'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${
                          item.isAvailable ? 'text-emerald-600' : 'text-[#7a817c]'
                        }`}>
                          {item.isAvailable ? 'toggle_on' : 'toggle_off'}
                        </span>
                        <span className={`text-xs uppercase tracking-[0.2em] ${
                          item.isAvailable ? 'text-emerald-700' : 'text-[#7a817c]'
                        }`}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="rounded-lg border border-[#ddd3c7] bg-[#f8f5ef] p-2 hover:border-[#ee4a21]"
                        >
                          <span className="material-symbols-outlined text-[#5f6763]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 hover:bg-red-100"
                        >
                          <span className="material-symbols-outlined text-red-600">delete</span>
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
            className="absolute inset-0 bg-[#312820]/45 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[#ddd3c7] bg-white p-8">
            <h2 className="mb-6 text-2xl font-bold text-[#313835]">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-xl border border-[#ddd3c7] bg-[#faf7f1] px-4 py-3 text-[#313835] placeholder:text-[#9aa09d] focus:border-[#ee4a21] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#ddd3c7] bg-[#faf7f1] px-4 py-3 text-[#313835] placeholder:text-[#9aa09d] focus:border-[#ee4a21] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full rounded-xl border border-[#ddd3c7] bg-[#faf7f1] px-4 py-3 text-[#313835] placeholder:text-[#9aa09d] focus:border-[#ee4a21] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuCategory })}
                  className="w-full rounded-xl border border-[#ddd3c7] bg-[#faf7f1] px-4 py-3 text-[#313835] focus:border-[#ee4a21] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-[#d4cabd] bg-[#f8f5ef] px-6 py-3 font-semibold text-[#4f5854] hover:border-[#ee4a21] hover:text-[#8a3c2d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ee4a21] px-6 py-3 font-bold text-white transition hover:bg-[#d9441d] disabled:opacity-50"
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
