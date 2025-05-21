'use client';
import { Suspense, useState } from 'react';
import CustomerList from '@/components/ui/CustomerList';

export default function CustomerManagementPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="w-full max-w-4xl h-[90vh] sm:h-[520px] mx-auto shadow-md rounded-lg flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="p-4 sm:p-6 border-b shrink-0 ">
        <h1 className="text-xl sm:text-2xl font-bold  mb-3 sm:mb-4">
          Customer Management
        </h1>
        <input
          type="text"
          placeholder="Search customers"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full text-sm sm:text-base"
        />
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 ">
        <Suspense fallback={<div className="text-gray-500">Loading customers...</div>}>
          <CustomerList search={search} />
        </Suspense>
      </div>
    </div>
  );
}
