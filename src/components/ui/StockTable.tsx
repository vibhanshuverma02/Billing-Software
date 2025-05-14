'use client';

import useSWR  from 'swr';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHeader, TableRow } from './table';  // Assuming ShadCN has table components

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function StockTable({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR(`/api/stock?username=${username}`, fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading stock</div>;

  return (
<div className="mt-4 border rounded overflow-hidden">
      <Table className="w-full table-fixed">
        {/* Fixed Header (outside scroll container) */}
        <TableHeader>
          <TableRow className="bg-black text-white">
            <TableCell className="p-2 font-bold">Item</TableCell>
            <TableCell className="p-2 font-bold">HSN</TableCell>
            <TableCell className="p-2 font-bold">Rate</TableCell>
            <TableCell className="p-2 font-bold">BarcodeNo</TableCell>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable Body (only tbody scrolls) */}
      <div className="overflow-y-auto max-h-96">
        <Table className="w-full table-fixed ">
          <TableBody>
            {data?.stockItems?.map((item: any) => (
              <TableRow key={item.id} className='bg-black-100'>
                <TableCell className="p-2">{item.itemName}</TableCell>
                <TableCell className="p-2">{item.hsn}</TableCell>
                <TableCell className="p-2">{item.rate}</TableCell>
                <TableCell className="p-2">{item.barcode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
