import axios from 'axios';
import type { Attendance, Transaction } from '@prisma/client';
import { format } from 'date-fns';
const API_URL = '/api/employee';

export async function updateAttendance(
  employeeId: number,
  month: Date,
  attendance: Attendance[]
) {
  const formattedMonth = format(new Date(month), 'yyyy-MM'); // ✅ safe format

  const res = await axios.post('/api/employee', {
    action: 'update_attendence',
    employeeId,
    month: formattedMonth, // correct format
    attendance,
  });

  return {
    attendance: res.data.attendance,
    finalSalary: res.data.finalSalary,
    finalSalaryToPay: res.data.finalSalaryToPay,
    presents: res.data.presentDays,
    absents: res.data.absents,
    halfdays: res.data.halfDays,
    workingdays:res.data.workingDays
  };
}

export async function addTransaction(
  employeeId: number,
  month: Date,
  tx: Omit<Transaction, 'id'>
) {
  const res = await axios.post(API_URL, {
    action: 'update',
    employeeId,
    month: month.toISOString().slice(0, 7),
    transactions: [tx],
  });

  const rawTx = res.data.employee.transaction[0];

  if (!rawTx?.id) {
    console.warn('⚠️ New transaction missing ID:', rawTx);
  }

  return {
    transaction: {
      ...rawTx,
      id: Number(rawTx.id),
      date: new Date(rawTx.date),
    },
    balance: res.data.employee.updatedBalance,
    salary: res.data.employee.finalSalary,
    deductions: res.data.employee.totalDeduction,
  };
}


export async function deleteTransaction(employeeId: number, transactionId: number) {
  console.log('Deleting transaction', { employeeId, transactionId });
  const res = await axios.post(API_URL, {
    action: 'delete_transaction',
    employeeId,
    transactionId,
  });

  const data = res.data;

  return {
    updatedBalance: data.updatedBalance,
    updatedSalary: data.updatedSalary,
    totalDeduction: data.totalDeduction,
  };
}


