'use client';

import useSWR from 'swr';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from './table';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

type StockItem = {
  id: string | number;
  itemName: string;
  hsn: string;
  rate: number;
  barcode: string;
};

export default function StockTable({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<{ stockItems: StockItem[] }>(
    `/api/stock?username=${username}`,
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading stock</div>;

  return (
    <div className="mt-4 border rounded overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-black text-white">
              <TableCell className="p-2 font-bold">Item</TableCell>
              <TableCell className="p-2 font-bold">HSN</TableCell>
              <TableCell className="p-2 font-bold">Rate</TableCell>
              <TableCell className="p-2 font-bold">BarcodeNo</TableCell>
            </TableRow>
          </TableHeader>
        </Table>

        <div className="overflow-y-auto max-h-96">
          <Table className="w-full table-fixed">
            <TableBody>
              {data?.stockItems?.map((item) => (
                <TableRow key={item.id} className="bg-black-100">
                  <TableCell className="p-2 break-words whitespace-normal">{item.itemName}</TableCell>
                  <TableCell className="p-2">{item.hsn}</TableCell>
                  <TableCell className="p-2">{item.rate}</TableCell>
                  <TableCell className="p-2 break-words">{item.barcode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Stack View */}
      <div className="block sm:hidden space-y-4 p-4 max-h-[30rem] overflow-y-auto">
        {data?.stockItems?.map((item) => (
          <div
            key={item.id}
            className="border rounded-md p-3  shadow-sm"
          >
            <p><span className="font-semibold">Item:</span> {item.itemName}</p>
            <p><span className="font-semibold">HSN:</span> {item.hsn}</p>
            <p><span className="font-semibold">Rate:</span> ₹{item.rate}</p>
            <p><span className="font-semibold">Barcode:</span> {item.barcode}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
