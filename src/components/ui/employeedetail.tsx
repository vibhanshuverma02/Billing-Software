'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmployeeCard from '@/components/ui/employeecard';
import { format } from 'date-fns';

export default function EmployeeSearchPage() {
  const [inputUser, setInputUser] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Use Date directly instead of string
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => new Date());

  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    if (!searchUser) return;
    setLoading(true);
    try {
      const formattedMonth = format(selectedMonthDate, 'yyyy-MM');

      const res = await axios.get('/api/employee/', {
        params: { name: searchUser, month: formattedMonth },
      });

      const employee = res.data.employee;

      setData({
        employee,
        currentsalary: res.data.calculatedSalary,
        finalsalary: res.data.finalSalaryToPay,
        attendance: res.data.attendance || [],
        transactions: res.data.transactions || [],
        workingdays: res.data.workingDays,
        absents: res.data.absents,
        halfdays: res.data.halfDays,
        present: res.data.presentDays,
        totaldeductions: res.data.totalDeductions,
        finalSalaryToPay: res.data.finalSalaryToPay,
        carryForward: res.data.carryForward,
        loanRemaining: res.data.loanRemaining,
        currentBalance: res.data.currentBalance,
      });
    } catch (err) {
      console.error("Failed to fetch employee data", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Fetch when month or searchUser changes
  useEffect(() => {
    fetchData();
  }, [searchUser, selectedMonthDate]);

  // ✅ handleMonthChange now sets Date directly
  const handleMonthChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedMonthDate(date);
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
        calculatedSalary={data.currentsalary}
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