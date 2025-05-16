import { prisma } from '@/config/db';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { CreateEmployeeInput, CreateEmployeeSchema } from "@/schema/employeeschema";
import { AttendanceStatus } from '@prisma/client';
import { Attendance as  AttendanceModel , Transaction } from "@prisma/client";

import {
  getPreviousMonth,
  calculateDays,
  calculateSalary,
  calculateDeductions,
  updateCarryForward,
  filterNewTransactions
} from "@/helpers/employe";
// import { EvalDevToolModulePlugin } from 'webpack';
// import { resourceUsage } from 'process';


type AttendanceResult = {
  employeeId: number;
  name: string;
  status: string;
 updatedStatus: string,
  attendance:unknown


};
export async function GET(req: NextRequest) {
  console.time('🔄 API /api/employee total');

  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = session.user.username;
  const name = searchParams.get('name');
  const month = searchParams.get('month');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
  const skip = (page - 1) * pageSize;

  if (!name) {
    return NextResponse.json({ error: 'Missing employee name' }, { status: 400 });
  }

  try {
    console.time('👤 Fetch employee');
const employee = await prisma.employee.findFirst({
  where: {
    username,
    name: {
      equals: name,
      mode: 'insensitive',  // <-- makes this case-insensitive
    },
  },
});
    console.timeEnd('👤 Fetch employee');

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!month) {
      return NextResponse.json({ employee });
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const today = new Date();

    if (start > today) {
      return NextResponse.json({ error: 'Cannot calculate salary for a future month' }, { status: 400 });
    }

    const previousMonth = getPreviousMonth(month);
    const { workingDays } = calculateDays(month);

    console.time('📦 Parallel DB calls');
    const [attendance, transactions, totalTransactions, lastMonthBalance, currentMonthBalance] =
      await Promise.all([
        prisma.attendance.findMany({
          where: { employeeId: employee.id, date: { gte: start, lt: end } },
        }),
        prisma.transaction.findMany({
          where: { employeeId: employee.id, date: { gte: start, lt: end } },
          orderBy: { date: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.transaction.count({
          where: { employeeId: employee.id, date: { gte: start, lt: end } },
        }),
        prisma.monthlyBalance.findFirst({
          where: { employeeId: employee.id, month: previousMonth },
          orderBy: { id: 'desc' },
        }),
        prisma.monthlyBalance.findFirst({
          where: { employeeId: employee.id, month },
          orderBy: { id: 'desc' },
        }),
      ]);
    console.timeEnd('📦 Parallel DB calls');

    const previousCarryForward = lastMonthBalance?.newCarryForward || 0;

    console.time('🧮 Calculate salary');
    const { calculatedSalary, presentDays, absents, halfDays } = calculateSalary(
      attendance,
      employee.baseSalary,
      workingDays
    );

    const { totalDeductions } = calculateDeductions(transactions, previousCarryForward);
    const rawNetPayable = calculatedSalary - totalDeductions;
    const finalSalaryToPay = Math.max(0, rawNetPayable);
    console.timeEnd('🧮 Calculate salary');

    // Carry forward calculation
    const newCarryForward = await updateCarryForward(employee.id, month, rawNetPayable);

    console.time('💾 Update DB if needed');

    if (!currentMonthBalance) {
  await prisma.monthlyBalance.create({
    data: {
      employeeId: employee.id,
      month,
      newCarryForward,
      carryForward: previousCarryForward, // or 0 if unknown
      salaryEarned: calculatedSalary,
      totalDeductions: totalDeductions,
      netPayable: finalSalaryToPay,
      amountPaid: 0, // set as per your logic
    },
  });
} else if (currentMonthBalance.newCarryForward !== newCarryForward) {
  await prisma.monthlyBalance.update({
    where: { id: currentMonthBalance.id },
    data: { newCarryForward },
  });
}


    if (employee.currentBalance !== previousCarryForward) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { currentBalance: previousCarryForward },
      });
      employee.currentBalance = previousCarryForward; // reflect in response
    }

    console.timeEnd('💾 Update DB if needed');

    console.timeEnd('🔄 API /api/employee total');

    return NextResponse.json({
      employee,
      attendance,
      transactions,
      totalTransactions,
      page,
      pageSize,
      workingDays,
      absents,
      halfDays,
      presentDays,
      calculatedSalary,
      totalDeductions,
      finalSalaryToPay,
      loanRemaining: employee.loanRemaining,
      currentBalance: employee.currentBalance,
    });
  } catch (err) {
    console.error('❌ /api/employee error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


async function createEmployee(employeeData: CreateEmployeeInput) {
  // Convert `loanStartMonth` to string if present, else omit
  const loanStartMonth =
    employeeData.loanStartMonth != null ? String(employeeData.loanStartMonth) : undefined;

  const employee = await prisma.employee.create({
    data: {
      ...employeeData,
      loanStartMonth,
    },
  });

  return employee;
}


async function updateEmployee(
  employeeId: number,
  transactions: Transaction[],
  month: string,
  manualOverride?: number
) {
  if (!month) return { error: "Month is required" };

  const start = new Date(`${month}-01T00:00:00.000Z`);
  if (start > new Date()) return { error: "Cannot calculate salary for a future month" };

  const [employee, attendance, existingTxns, previousBalance] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.attendance.findMany({
      where: { 
        employeeId, 
        date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } 
      },
    }),
    prisma.transaction.findMany({
      where: { 
        employeeId, 
        date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } 
      },
    }),
    prisma.monthlyBalance.findFirst({
      where: { employeeId, month: getPreviousMonth(month) },
      orderBy: { id: 'desc' },
    }),
  ]);

  if (!employee) return { error: "Employee not found" };

  const { workingDays } = calculateDays(month);
  const { calculatedSalary, presentDays, absents, halfDays } = calculateSalary(attendance, employee.baseSalary, workingDays);

  const newTransactions = await filterNewTransactions(existingTxns, transactions);
  const allTxns = [...existingTxns, ...newTransactions];

  const previousCarryForward = previousBalance?.newCarryForward || 0;

  const { totalDeductions, advanceAmount, otherDeductions } = calculateDeductions(allTxns, previousCarryForward);

  const rawNetPayable = calculatedSalary - totalDeductions;
  const netPayable = manualOverride ?? Math.max(0, rawNetPayable);

  // First, get newCarryForward by calling updateCarryForward
  const newCarryForward = await updateCarryForward(employeeId, month, rawNetPayable);

  // Then, batch update in a transaction
  const results = await prisma.$transaction([
    prisma.employee.update({
      where: { id: employeeId },
      data: { currentBalance: newCarryForward },
    }),
    prisma.monthlyBalance.create({
      data: {
        employeeId,
        month,
        carryForward: previousCarryForward,
        salaryEarned: calculatedSalary,
        totalDeductions,
        netPayable,
        amountPaid: manualOverride ?? netPayable,
        newCarryForward,
      },
    }),
    ...newTransactions.map((t) =>
      prisma.transaction.create({
        data: {
          employeeId,
          type: t.type,
          amount: t.amount,
          description: t.description ?? null,
          date: new Date(t.date),
        },
      })
    ),
  ]);

  return {
    finalSalary: netPayable,
    updatedBalance: previousCarryForward,
    totalDeductions,
    advanceAmount,
    otherDeductions,
    transaction: newTransactions,
    attendance,
    presentDays,
    absents,
    halfDays,
    workingDays,
    newCarryForward,
  };
}


async function update_attendance(
  employeeId: number,
  month: string,
  attendance: { date: string; status: "PRESENT" | "ABSENT" | "HALF_DAY" }[]
) {
  if (!month) return { error: "Month is required" };
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  if (start > new Date()) return { error: "Cannot calculate salary for a future month" };

  // Fetch everything in parallel
  const [employee, lastMonthBalance, [existingAttendance, transactions]] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.monthlyBalance.findFirst({
      where: { employeeId, month: getPreviousMonth(month) },
      orderBy: { id: 'desc' },
    }),
    Promise.all([
      prisma.attendance.findMany({ where: { employeeId, date: { gte: start, lte: end } } }),
      prisma.transaction.findMany({ where: { employeeId, date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } } }),
    ])
  ]);

  if (!employee) return { error: "Employee not found" };

  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;
  const { workingDays } = calculateDays(month);

  // Merge attendance
  const attendanceMap = new Map<string, AttendanceStatus>();
  for (const a of existingAttendance) {
    attendanceMap.set(a.date.toISOString().split("T")[0], a.status as AttendanceStatus);
  }
  for (const a of attendance) {
    attendanceMap.set(new Date(a.date).toISOString().split("T")[0], a.status);
  }

  const upserts = Array.from(attendanceMap.entries()).map(([dateStr, status]) =>
    prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(dateStr) } },
      update: { status },
      create: { employeeId, date: new Date(dateStr), status },
    })
  );

  await Promise.all(upserts);

  // Convert to list for calculation
  const attendanceList = Array.from(attendanceMap.entries()).map(([dateStr, status]) => ({
    id: 0,
    employeeId,
    date: new Date(dateStr),
    status,
  }));

  const { calculatedSalary, presentDays, absents, halfDays } = calculateSalary(attendanceList, employee.baseSalary, workingDays);
  const { totalDeductions, advanceAmount, otherDeductions } = calculateDeductions(transactions, previousCarryForward);
  const rawNetPayable = calculatedSalary - totalDeductions;
  const finalSalaryToPay = Math.max(0, rawNetPayable);

  const newCarryForward = await updateCarryForward(employeeId, month, rawNetPayable);

  // Final response
  return {
    finalsalary: calculatedSalary,
    finalSalaryToPay,
    attendance: attendanceList,
    absents,
    halfDays,
    workingDays,
    presentDays,
    newCarryForward,
    advanceAmount,
    otherDeductions,
    totalDeductions,
  };
}
async function deleteTransaction(employeeId: number, transactionId: number) {
  // Parallel fetch of employee and transaction
  const [employee, existingTransaction] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.transaction.findUnique({ where: { id: transactionId } }),
  ]);

  if (!employee) return { error: "Employee not found" };
  if (!existingTransaction || existingTransaction.employeeId !== employeeId) {
    return { error: "Transaction not found" };
  }

  const transactionDate = new Date(existingTransaction.date);
  const year = transactionDate.getFullYear();
  const monthIndex = transactionDate.getMonth(); // 0-indexed
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const startOfMonth = new Date(year, monthIndex, 1);
  const startOfNextMonth = new Date(year, monthIndex + 1, 1);

  const prevMonthKey = `${year}-${String(monthIndex).padStart(2, '0')}`;
  const startOfPrevMonth = new Date(year, monthIndex - 1, 1);

  // Perform in parallel:
  const [
    _deleted,
    existingAttendance,
    remainingTransactions,
    lastMonthBalance
  ] = await Promise.all([
    prisma.transaction.delete({ where: { id: transactionId } }),

    prisma.attendance.findMany({
      where: { employeeId, date: { gte: startOfMonth, lt: startOfNextMonth } },
    }),

    prisma.transaction.findMany({
      where: { employeeId, date: { gte: startOfMonth, lt: startOfNextMonth } },
    }),

    prisma.monthlyBalance.findFirst({
      where: { employeeId, month: prevMonthKey },
      orderBy: { id: 'desc' },
    }),
  ]);

  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;

  const { workingDays } = calculateDays(monthKey);
  const { calculatedSalary } = calculateSalary(existingAttendance, employee.baseSalary, workingDays);
  const { totalDeductions } = calculateDeductions(remainingTransactions, previousCarryForward);
  const netPayable = calculatedSalary - totalDeductions;
  const newCarryForward = await updateCarryForward(employeeId, monthKey, netPayable);

  // Batch employee + monthlyBalance update in a transaction
  await prisma.$transaction([
    prisma.monthlyBalance.create({
      data: {
        employeeId,
        month: monthKey,
        carryForward: previousCarryForward,
        salaryEarned: calculatedSalary,
        totalDeductions,
        netPayable,
        amountPaid: netPayable,
        newCarryForward,
      },
    }),
    prisma.employee.update({
      where: { id: employeeId },
      data: { currentBalance: newCarryForward },
    }),
  ]);

  return {
    updatedBalance: newCarryForward,
    updatedSalary: netPayable,
    totalDeduction: totalDeductions,
  };
}


export async function POST(req: NextRequest) {
  console.time("⏱️ Total POST /employee");

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.username) {
      console.timeEnd("⏱️ Total POST /employee");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!req.headers.get("content-type")?.includes("application/json")) {
      console.timeEnd("⏱️ Total POST /employee");
      return NextResponse.json({ error: "Invalid content-type" }, { status: 400 });
    }

    const body = await req.json();
    const username = session.user.username;

    const {
      action,
      employeeId,
      month,
      transactions = [],
      attendance = [],
      manualOverride,
      employeeData,
      date,
      updates,
      transactionId,
    } = body;

    if (action === 'dashboard_bulk_update') {
      console.time("🗂️ dashboard_bulk_update");

      const targetDate = new Date(date);
      const attendanceResult: AttendanceResult[] = [];

      const results = await Promise.all(
        updates.map(async ({ name, status }: { name: string; status: string }) => {
          const employee = await prisma.employee.findFirst({ where: { name } });

          if (!employee) {
            console.warn(`⚠️ Employee not found: ${name}`);
            return null;
          }

          await prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: employee.id,
                date: targetDate,
              },
            },
            update: { status: status as AttendanceStatus },
            create: { employeeId: employee.id, date: targetDate, status: status as AttendanceStatus },
          });

          return {
            name,
            employeeId: employee.id,
            status,
            updatedStatus: status,
            attendance,
          };
        })
      );

      for (const r of results) {
        if (r) attendanceResult.push(r);
      }

      console.timeEnd("🗂️ dashboard_bulk_update");
      console.timeEnd("⏱️ Total POST /employee");

      return NextResponse.json({ success: true, data: attendanceResult });
    }

    if (action === "create") {
      console.time("👤 create employee");

      if (
        !employeeData ||
        !employeeData.name ||
        !employeeData.joiningDate ||
        employeeData.baseSalary === undefined ||
        employeeData.currentBalance === undefined
      ) {
        console.timeEnd("👤 create employee");
        console.timeEnd("⏱️ Total POST /employee");
        return NextResponse.json({ error: "Missing required employee data" }, { status: 400 });
      }

      if (!employeeData.username) {
        employeeData.username = username;
      }

      const parsed = CreateEmployeeSchema.safeParse(employeeData);
      if (!parsed.success) {
        console.timeEnd("👤 create employee");
        console.timeEnd("⏱️ Total POST /employee");
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.errors }, { status: 400 });
      }

      const result = await createEmployee(parsed.data);
      console.timeEnd("👤 create employee");
      console.timeEnd("⏱️ Total POST /employee");

      return NextResponse.json({ message: "Employee created successfully", employee: result }, { status: 201 });
    }

    if (action === 'update') {
      console.time("🔄 update employee");

      if (!employeeId) {
        console.timeEnd("🔄 update employee");
        console.timeEnd("⏱️ Total POST /employee");
        return NextResponse.json({ error: 'Employee ID is required for update' }, { status: 400 });
      }

      const result = await updateEmployee(employeeId, transactions, month, manualOverride);

      console.timeEnd("🔄 update employee");
      console.timeEnd("⏱️ Total POST /employee");

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Employee updated successfully',
        employee: {
          finalSalary: result.finalSalary,
          updatedBalance: result.updatedBalance,
          totalDeduction: result.totalDeductions,
          transaction: result.transaction,
          attendence: result.attendance
        }
      }, { status: 200 });
    }

    if (action === "delete_transaction") {
      console.time("🗑️ delete transaction");

      if (!employeeId || !transactionId) {
        console.timeEnd("🗑️ delete transaction");
        console.timeEnd("⏱️ Total POST /employee");
        return NextResponse.json({ error: 'Employee ID and Transaction ID are required' }, { status: 400 });
      }

      const result = await deleteTransaction(employeeId, transactionId);

      console.timeEnd("🗑️ delete transaction");
      console.timeEnd("⏱️ Total POST /employee");

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Transaction deleted successfully',
        updatedBalance: result.updatedBalance,
        updatedSalary: result.updatedSalary,
        totalDeduction: result.totalDeduction,
      }, { status: 200 });
    }

    if (action === 'update_attendence') {
      console.time("📅 update_attendence");

      if (!employeeId) {
        console.timeEnd("📅 update_attendence");
        console.timeEnd("⏱️ Total POST /employee");
        return NextResponse.json({ error: 'Employee ID is required for update' }, { status: 400 });
      }

      const result = await update_attendance(employeeId, month, attendance);

      console.timeEnd("📅 update_attendence");
      console.timeEnd("⏱️ Total POST /employee");

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Employee updated successfully',
        finalSalary: result.finalsalary,
        attendance: result.attendance,
        finalSalaryToPay: result.finalSalaryToPay,
        fullattendance: result.attendance,
        workingDays: result.workingDays,
        presentDays: result.presentDays,
        absents: result.absents,
        halfDays: result.halfDays
      }, { status: 200 });
    }

    console.timeEnd("⏱️ Total POST /employee");
    return NextResponse.json({ error: 'Invalid action or missing data' }, { status: 400 });

  } catch (err) {
    console.error("❌ POST /employee error:", err);
    console.timeEnd("⏱️ Total POST /employee");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
