'use client';

import { format } from 'date-fns';
import type { Transaction } from '@prisma/client';

interface Props {
  transactions: Transaction[];
  onDelete: (txId: number) => void;
}

export default function TransactionTable({ transactions, onDelete }: Props) {
  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-2">📑 Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions found for this month.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left whitespace-nowrap">Date</th>
                <th className="p-2 text-left whitespace-nowrap">Type</th>
                <th className="p-2 text-left whitespace-nowrap">Amount</th>
                <th className="p-2 text-left whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const rawDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;
                const isValid = !isNaN(rawDate.getTime());
                const displayDate = isValid ? format(rawDate, 'dd/MM/yyyy') : 'Invalid Date';

                return (
                  <tr key={`${tx.id}-${tx.date}`} className="even:bg-gray-50">
                    <td className="p-2 whitespace-nowrap">{displayDate}</td>
                    <td className="p-2 whitespace-nowrap">{tx.type}</td>
                    <td className="p-2 whitespace-nowrap">₹{tx.amount}</td>
                    <td className="p-2 whitespace-nowrap">
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
