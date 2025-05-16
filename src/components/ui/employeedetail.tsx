'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmployeeCard from '@/components/ui/try';
import { format } from 'date-fns';
import { Transaction } from '@prisma/client';
// ✅ Type Definitions
interface Employee {
  id: number;
  username: string;
  name: string;
  phone: string;
  photoPath: string;
  joiningDate: string;
  baseSalary: number;
  currentBalance: number;
  manualOverride: number | null;
  loanAmount: number | null;
  loanRemaining: number | null;
  loanStartMonth: string | null;
  emiAmount: number | null;
  createdAt: string;
  updatedAt: string;
}


interface EmployeeData {
  employee: Employee;
  attendance: [];
  transactions: [];
  workingdays: number;
  absents: number;
  halfdays: number;
  present: number;
  calculatedSalary: number;
  totaldeductions: number;
  finalSalaryToPay: number;
  carryForward: number ;
  loanRemaining: number ;
  currentBalance: number;
}
export default function EmployeeSearchPage() {
  const [inputUser, setInputUser] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeData | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());

  // Pagination with "Load More"
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // We keep transactions separately for append
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchData = async (append = false) => {
    if (!searchUser) return;
    setLoading(true);

    try {
      const formattedMonth = format(selectedMonthDate, 'yyyy-MM');
      const res = await axios.get('/api/employee/', {
        params: {
          name: searchUser,
          month: formattedMonth,
          page,
          pageSize,
        },
      });

      if (res.data.error === 'Employee not found') {
        alert('Employee does not find');
        setData(null);
        setTransactions([]);
        setTotalTransactions(0);
      } else {
        const employeeData: EmployeeData = {
          employee: res.data.employee,
          attendance: res.data.attendance || [],
          transactions: append
            ? [...transactions, ...res.data.transactions]
            : res.data.transactions || [],
          workingdays: res.data.workingDays,
          absents: res.data.absents,
          halfdays: res.data.halfDays,
          present: res.data.presentDays,
          calculatedSalary: res.data.calculatedSalary,
          totaldeductions: res.data.totalDeductions,
          finalSalaryToPay: res.data.finalSalaryToPay,
          carryForward: res.data.carryForward,
          loanRemaining: res.data.loanRemaining,
          currentBalance: res.data.currentBalance,
        };

        setData(employeeData);
        setTransactions(employeeData.transactions);
        setTotalTransactions(res.data.totalTransactions || 0);
      }
    } catch (err) {
      console.error('Failed to fetch employee data', err);
      setData(null);
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset page and transactions on user or month change
  useEffect(() => {
    setPage(1);
    setTransactions([]);
  }, [searchUser, selectedMonthDate]);

  // Fetch data on user, month or page change
  useEffect(() => {
    fetchData(page > 1); // append transactions only if page > 1
  }, [searchUser, selectedMonthDate, page]);

  const handleMonthChange = (date: Date | undefined) => {
    if (date) setSelectedMonthDate(date);
  };

  const handleLoadMore = () => {
    if (transactions.length < totalTransactions) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          placeholder="Enter username"
          className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={inputUser}
          onChange={(e) => setInputUser(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors w-full sm:w-auto"
          onClick={() => setSearchUser(inputUser.trim())}
          disabled={!inputUser.trim()}
        >
          Search
        </button>
      </div>

      {/* Searching text */}
      {loading && <p className="text-white font-semibold">Searching...</p>}

      {/* Employee Card */}
      {!loading && data && (
        <>
          <EmployeeCard
            employee={data.employee}
            month={selectedMonthDate}
            onMonthChange={handleMonthChange}
            attendance={data.attendance}
            calculatedSalary={data.calculatedSalary}
            workingdays={data.workingdays}
            absents={data.absents}
            halfdays={data.halfdays}
            presents={data.present}
            totaldeductions={data.totaldeductions}
            finalSalaryToPay={data.finalSalaryToPay}
            loanRemaining={data.loanRemaining}
            transactions={transactions}
            loading={loading}
          />

          {/* Load More Button */}
          {transactions.length < totalTransactions && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}