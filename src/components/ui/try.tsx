'use client';

import { useReducer, useMemo, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Attendance, Transaction } from '@prisma/client';
import { employeeReducer, initialState } from '@/lib/statereducer';
import AttendanceCalendar from './AttendanceCalendar';
import AddTransaction from './AddTranscation';
import TransactionTable from './Transactiontable';
import {
  updateAttendance as apiUpdateAttendance,
  deleteTransaction,
} from '@/lib/employeeApi';

interface Props {
  employee: {
    id: number;
    name: string;
    phone: string;
    baseSalary: number;
    currentBalance: number;
  };
  month: Date;
  onMonthChange: (date: Date) => void;
  attendance: Attendance[];
  transactions: Transaction[];
  calculatedSalary: number;
  totaldeductions: number;
  finalSalaryToPay: number;
  loanRemaining: number;
  workingdays: number;
  presents: number;
  absents: number;
  halfdays: number;
  loading: boolean;
}

export default function EmployeeCard(props: Props) {
  const [state, dispatch] = useReducer(
    employeeReducer,
    initialState({
      attendance: props.attendance,
      transactions: props.transactions,
      employee: props.employee,
      calculatedSalary: props.calculatedSalary,
      totaldeductions: props.totaldeductions,
      finalSalaryToPay: props.finalSalaryToPay,
      month: props.month,
      workingdays: props.workingdays,
      presents: props.presents,
      absents: props.absents,
      halfdays: props.halfdays,
    })
  );

  const [loadingAction, setLoadingAction] = useState<'attendance' | 'add_tx' | 'delete_tx' | null>(null);
  const isLoading = props.loading || loadingAction !== null;

  useEffect(() => {
    dispatch({
      type: 'SET_INITIAL_DATA',
      payload: {
        attendance: props.attendance,
        transactions: props.transactions,
        balance: props.employee.currentBalance,
        salary: props.finalSalaryToPay,
        deductions: props.totaldeductions,
        calculatedSalary: props.calculatedSalary,
        presents: props.presents,
        absents: props.absents,
        halfdays: props.halfdays,
        workingdays: props.workingdays,
      },
    });
  }, [props]);

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      if (!tx?.date) return false;
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === state.month.getFullYear() &&
        txDate.getMonth() === state.month.getMonth()
      );
    });
  }, [state.transactions, state.month]);

  const handleSaveAttendance = async () => {
    setLoadingAction('attendance');
    try {
      const safeMonth = new Date(state.month);
      const res = await apiUpdateAttendance(props.employee.id, safeMonth, state.attendance);

      dispatch({
        type: 'SAVE_ATTENDANCE_SUCCESS',
        payload: {
          attendance: res.attendance,
          salary: res.finalSalaryToPay,
          finalSalary: res.finalSalary,
          presents: res.presents,
          absents: res.absents,
          halfdays: res.halfdays,
          workingdays: res.workingdays,
        },
      });

      toast.success('✅ Attendance updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('❌ Failed to update attendance');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    setLoadingAction('delete_tx');
    try {
      const res = await deleteTransaction(props.employee.id, txId);

      dispatch({
        type: 'DELETE_TRANSACTION',
        payload: {
          id: txId,
          balance: res.updatedBalance,
          salary: res.updatedSalary,
          deductions: res.totalDeduction,
        },
      });

      toast.success('🗑️ Transaction deleted!');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('❌ Failed to delete transaction');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative max-w-md w-full">
      {/* Main content - blurred during loading */}
      <div
        style={{
          filter: isLoading ? 'blur(8px)' : 'none',
          pointerEvents: isLoading ? 'none' : 'auto',
          transition: 'filter 0.3s ease',
        }}
        className="p-4 border rounded-lg shadow-md flex flex-col gap-6 bg-black text-white"
      >
        {/* 👤 Employee Details */}
        <div>
          <h2 className="text-xl font-bold mb-2">👤 Employee Details</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
              {props.employee.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{props.employee.name}</p>
              <p className="text-sm text-gray-400">📞 {props.employee.phone}</p>
              <p className="text-sm text-gray-400">🧾 Previous Balance: ₹{state.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 📉 Loan & EMI */}
        <div>
          <h2 className="text-xl font-bold mb-2">📉 Loan & EMI</h2>
          <p className="text-sm text-gray-400">💳 Loan Remaining: ₹{props.loanRemaining}</p>
        </div>

        {/* 📊 Attendance Summary */}
        <div>
          <h2 className="text-xl font-bold mb-2">📊 Attendance Summary</h2>
          <p className="text-sm text-gray-400">📅 Working Days: {state.workingdays}</p>
          <p className="text-sm text-gray-400">✅ Presents: {state.presents}</p>
          <p className="text-sm text-gray-400">🌓 Half Days: {state.halfdays}</p>
          <p className="text-sm text-gray-400">❌ Absents: {state.absents}</p>
        </div>

        {/* 📅 Attendance Calendar */}
        <AttendanceCalendar
          attendance={state.attendance}
          month={state.month}
          changed={state.changed}
          onChange={(date, status) =>
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { date, status } })
          }
          onSave={handleSaveAttendance}
          onMonthChange={(newMonth) => {
            dispatch({ type: 'SET_MONTH', payload: newMonth });
            props.onMonthChange(newMonth);
          }}
          loading={loadingAction === 'attendance'}
        />

        {/* 💸 Salaries & Deductions */}
        <div>
          <h2 className="text-xl font-bold mb-2">💸 Salaries & Deductions</h2>
          <p className="text-sm text-gray-400">💰 Base Salary: ₹{props.employee.baseSalary}</p>
          <p className="text-sm text-gray-400">🧾 Month Salary: ₹{state.calculatedSalary}</p>
          <p className="text-sm text-gray-400">➖ Deductions: ₹{state.deductions}</p>
          <p className="text-sm text-gray-400">💸 Final Payable: ₹{state.salary}</p>
        </div>

        {/* Transaction Table */}
        <TransactionTable
          transactions={filteredTransactions}
          onDelete={handleDeleteTransaction}
        />

        {/* Add Transaction */}
        <AddTransaction
          employeeId={props.employee.id}
          selectedMonthDate={state.month}
          onAdd={({ transaction, balance, salary, deductions }) =>
            dispatch({
              type: 'ADD_TRANSACTION',
              payload: {
                transaction: {
                  ...transaction,
                  date: new Date(transaction.date),
                },
                balance,
                salary,
                deductions,
              },
            })
          }
        />
      </div>

      {/* Sharp overlay loading text */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            pointerEvents: 'auto',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}
