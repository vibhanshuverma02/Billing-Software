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
    <div className="w-full max-w-4xl mx-auto shadow-md rounded-lg flex flex-col overflow-hidden h-[90vh] sm:h-[600px]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b ">
        <h1 className="text-xl sm:text-2xl font-bold  mb-3 sm:mb-4">
          Dealer Management
        </h1>

        {/* Category Dropdown */}
        <select
          value={selectedCategory ?? ''}
          onChange={e => setSelectedCategory(Number(e.target.value))}
         className="border border-black bg-white text-black px-3 py-2 rounded w-full focus:outline-none focus:ring-0 focus:border-gray-700 transition-colors"
>
          <option value="" className="text-black">
            Select a category
          </option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id} className="text-black">
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dealer List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 ">
        {selectedCategory ? (
          <DealerList categoryId={selectedCategory} />
        ) : (
          <p className="text-gray-500 text-center mt-10">
            Please select a category to view dealers.
          </p>
        )}
      </div>
    </div>
  );
}
