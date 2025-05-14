'use client';

import { useEffect, useState } from 'react';
import DealerList from '@/components/ui/DealerList';

export default function DealerManagementPage() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/dealer');
      const data = await res.json();
      setCategories(data.categories || []);
    };

    fetchCategories();
  }, []);

  return (
    <div className="w-screen max-w-4xl shadow-md rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Dealer Management
        </h1>

        {/* Category Dropdown */}
      <select
  value={selectedCategory ?? ''}
  onChange={e => setSelectedCategory(Number(e.target.value))}
  className="border border-black bg-white text-black px-3 py-2 rounded w-full focus:outline-none focus:ring-0 focus:border-gray-700 transition-colors"
>
  <option value="" className="text-black">Select a category</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id} className="text-black">
      {cat.name}
    </option>
  ))}
</select>


      </div>

      {/* Dealer List */}
      <div className="flex-1 overflow-y-auto p-6 ">
        {selectedCategory ? (
          <DealerList categoryId={selectedCategory} />
        ) : (
          <p className="text-gray-500">Please select a category to view dealers.</p>
        )}
      </div>
    </div>
  );
}
