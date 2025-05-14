'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

type Dealer = {
  id: number;
  name: string;
  address: string;
};

export default function DealerList({ categoryId }: { categoryId: number }) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealers = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/dealer', {
          params: { categoryId },
        });
        setDealers(res.data.dealers || []);
      } catch (error) {
        console.error('Failed to fetch dealers', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchDealers();
    }
  }, [categoryId]);

  if (loading) {
    return <p className="text-gray-500">Loading dealers...</p>;
  }

  if (dealers.length === 0) {
    return <p className="text-gray-500">No dealers found for this category.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {dealers.map(dealer => (
        <Link key={dealer.id} href={`/trial/${categoryId}/${dealer.id}`}>
          <div className="p-4 border rounded shadow-sm cursor-pointer">
            <p className="font-semibold">{dealer.name}</p>
            <p className="text-sm text-gray-600">{dealer.address}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
