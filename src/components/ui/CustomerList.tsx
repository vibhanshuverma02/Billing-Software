'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

type Customer = {
  id: number;
  username: string;
  customerName: string;
  mobileNo: string;
  address: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function CustomerList({ search }: { search: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchCustomers = async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/customer/invoices', {
        params: { page: pageNum, limit: 10 },
      });

      const data = res.data.data;
      if (data.length < 10) setHasMore(false);

      setCustomers(prev =>
        reset
          ? data
          : [...prev, ...data.filter((d: Customer) => !prev.some(p => p.id === d.id))]
      );
      
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page);
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchCustomers(1, true);
  }, [search]);

  const filtered = customers.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {filtered.map(c => (
        <Link key={c.id} href={`/customer/${c.id}`}>
          <div className="p-4 border rounded shadow-sm cursor-pointer">
            <p className="font-semibold">{c.customerName}</p>
            <p>{c.mobileNo}</p>
          </div>
        </Link>
      ))}

      {filtered.length > 0 && hasMore && (
        <div className="col-span-2 text-center mt-6">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
