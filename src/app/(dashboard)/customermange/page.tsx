'use client';
import { Suspense, useState } from 'react';
import CustomerList from '@/components/ui/CustomerList';

export default function CustomerManagementPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="w-screen max-w-4xl h-[520px] shadow-md rounded-lg flex flex-col overflow-hidden">
  {/* Fixed Header */}
  <div className=" p-6 border-b shrink-0">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
      Customer Management
    </h1>
    <input
      type="text"
      placeholder="Search customers"
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="border px-3 py-2 rounded w-full"
    />
  </div>

  {/* Scrollable list */}
  <div className="flex-1 overflow-y-auto p-6">
    <Suspense fallback={<div className="text-gray-500">Loading customers...</div>}>
      <CustomerList search={search} />
    </Suspense>
  </div>
</div>

  );
}

