'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmployeeCard from '@/components/ui/employeecard';
import { format } from 'date-fns';

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
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const [data, setData] = useState<EmployeeData | null>(null);

  const fetchData = async () => {
    if (!searchUser) return;
    setLoading(true);

    try {
      const formattedMonth = format(selectedMonthDate, 'yyyy-MM');
      const res = await axios.get('/api/employee/', {
        params: { name: searchUser, month: formattedMonth },
      });

      const employeeData: EmployeeData = {
        employee: res.data.employee,
        attendance: res.data.attendance || [],
        transactions: res.data.transactions || [],
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
    } catch (err) {
      console.error('Failed to fetch employee data', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchUser, selectedMonthDate]);

  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      setSelectedMonthDate(date);
    }
  };

  return (
    <div className="p-6 space-y-4">
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
          onClick={() => setSearchUser(inputUser)}
        >
          Search
        </button>
      </div>

      {data && (
        <EmployeeCard
          employee={data.employee}
          month={selectedMonthDate}
          onMonthChange={handleMonthChange}
          onRefresh={fetchData}
          attendance={data.attendance}
          calculatedSalary={data.calculatedSalary}
          workingdays={data.workingdays}
          absents={data.absents}
          halfdays={data.halfdays}
          presents={data.present}
          totaldeductions={data.totaldeductions}
          finalSalaryToPay={data.finalSalaryToPay}
          carryForward={data.carryForward}
          loanRemaining={data.loanRemaining}
          currentBalance={data.currentBalance}
          transactions={data.transactions}
          loading={loading}
        />
      )}
    </div>
  );
}
