'use client';

import { format, parseISO } from 'date-fns';
import type { Transaction } from '@prisma/client';

interface Props {
  transactions: Transaction[];
  onDelete: (txId: number) => void;
}

export default function TransactionTable({ transactions, onDelete }: Props) {
  return (
    <div className="mt-4">
      <h3 className="text-md font-semibold">📑 Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-400">No transactions found for this month.</p>
      ) : (
        <table className="w-full table-auto border border-black-300 mt-2">
          <thead>
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={`${tx.id}-${tx.date}`}>
                <td className="p-2">{format(parseISO(tx.date.toString()), 'dd/MM/yyyy')}</td>
                <td className="p-2">{tx.type}</td>
                <td className="p-2">₹{tx.amount}</td>
                <td className="p-2">
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
