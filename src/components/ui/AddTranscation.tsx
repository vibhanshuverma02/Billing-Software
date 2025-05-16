'use client';
import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import type { Transaction, TransactionType } from '@prisma/client';
import { toast } from 'sonner';
interface Props {
  employeeId: number;
  selectedMonthDate: Date;
  onAdd: (payload: {
    transaction: Transaction;
    balance: number;
    salary: number;
    deductions: number;
  }) => void;
}

export default function AddTransaction({ employeeId, selectedMonthDate, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>('ADVANCE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userDate, setUserDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount) return alert('Amount is required');
  setLoading(true);
    const payload = {
      action: 'update',
      month: format(selectedMonthDate, 'yyyy-MM'),
      employeeId,
      transactions: [
        {
          type,
          amount: parseFloat(amount),
          description,
          date: userDate ? new Date(userDate).toISOString() : new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await axios.post('/api/employee', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const transaction: Transaction = res.data.employee.transaction[0];
      const balance: number = res.data.employee.updatedBalance;
      const salary: number = res.data.employee.finalSalary;
      const deductions: number = res.data.employee.totalDeduction;

      onAdd({ transaction, balance, salary, deductions });

      toast.success('Transaction added successfully');
      setAmount('');
      setDescription('');
      setUserDate('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add transaction');
    }
    finally {
    setLoading(false);
  }
  };

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-md font-semibold bg-black ">➕ Add Transaction</h3>

      <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="border  bg-black rounded px-2 py-1 w-full">
        
        <option value="SALARY">Salary</option>
        <option value="ADVANCE">Advance</option>
        <option value="DEDUCTION">Deduction</option>
        <option value="OTHER">Other</option>
      </select>

      <input
        type="date"
        value={userDate}
        onChange={(e) => setUserDate(e.target.value)}
        className="border rounded px-2 py-1 w-full"
      />

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="border rounded px-2 py-1 w-full"
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="border rounded px-2 py-1 w-full"
      />

     <button
  onClick={handleSubmit}
  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
  disabled={loading}
>
  {loading ? 'Submitting...' : 'Submit'}
</button>

    </div>
  );
}
