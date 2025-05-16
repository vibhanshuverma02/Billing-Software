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

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Employee not found" };

  const {  workingDays } = calculateDays(month);

  const attendance = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } },
  });

  const { calculatedSalary, presentDays, absents, halfDays } =
    calculateSalary(attendance, employee.baseSalary, workingDays);

  const existingTxns = await prisma.transaction.findMany({
    where: { employeeId, date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } },
  });

  const newTransactions = await filterNewTransactions(existingTxns, transactions);
  const allTxns = [...existingTxns, ...newTransactions];
console.log("new tran",newTransactions)
  const previousMonth = getPreviousMonth(month);
  const previousBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId, month: previousMonth },
    orderBy: { id: 'desc' },
  });

  const previousCarryForward = previousBalance?.newCarryForward || 0;

  const { totalDeductions, advanceAmount, otherDeductions } = calculateDeductions(allTxns, previousCarryForward);

  const rawNetPayable = calculatedSalary - totalDeductions;
  const netPayable = manualOverride ?? Math.max(0, rawNetPayable);

  const newCarryForward = await updateCarryForward(employeeId, month, rawNetPayable);

  await prisma.employee.update({
    where: { id: employeeId },
    data: { currentBalance: newCarryForward },
  });

  await prisma.monthlyBalance.create({
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
  });

  const createdTransactions = await Promise.all(
    newTransactions.map((t:Transaction) =>
      prisma.transaction.create({
        data: {
          employeeId,
          type: t.type,
          amount: t.amount,
          description: t.description ?? null,
          date: new Date(t.date),
        },
      })
    )
  );
console.log("total deduction:",totalDeductions)
  return {
    finalSalary: netPayable,
    updatedBalance: previousCarryForward,
    totalDeductions,
    advanceAmount,
    otherDeductions,
    transaction: createdTransactions,
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
  // Validate employee
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Employee not found" };

  if (!month) return { error: "Month is required" };
  console.log(month)
const start = new Date(`${month}-01T00:00:00.000Z`);
const end = new Date(start);
end.setMonth(end.getMonth() + 1);
end.setDate(0);
end.setHours(23, 59, 59, 999); // Ensure end includes the whole day

  if (start > new Date()) {
    return { error: "Cannot calculate salary for a future month" };
  }

  const {  workingDays } = calculateDays(month);

  const previousMonth = getPreviousMonth(month);

  const lastMonthBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId, month: previousMonth },
    orderBy: { id: 'desc' },
  });

  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;

  // Fetch existing attendance & transactions
  const existingAttendance= await 
    prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
    })


 const transactions =  await prisma.transaction.findMany({ where: { employeeId: employee.id, date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) } } })
  console.log("transactions" ,transactions)

  // Merge attendance
  const attendanceMap = new Map<string, { status: string }>();
  for (const a of existingAttendance) {
    attendanceMap.set(a.date.toISOString().split("T")[0], { status: a.status });
  }
  for (const a of attendance) {
    attendanceMap.set(new Date(a.date).toISOString().split("T")[0], { status: a.status });
  }

  // Upsert attendance
  const upserts = Array.from(attendanceMap.entries()).map(([dateStr, { status }]) =>
    prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(dateStr) } },
      update: { status : status as AttendanceStatus },
      create: { employeeId, date: new Date(dateStr), status : status as AttendanceStatus  },
    })
  );
  await Promise.all(upserts);

  // Calculate Salary
  const attendanceList: AttendanceModel[] = Array.from(attendanceMap.entries()).map(([dateStr, { status }]) => ({
  id: 0, // Dummy ID, since calculation doesn't use it
  employeeId,
  date: new Date(dateStr),
  status: status as AttendanceStatus,
}));
// console.log(attendanceList);
  const { calculatedSalary, presentDays, absents, halfDays } = calculateSalary(attendanceList, employee.baseSalary, workingDays);

  // Calculate Deductions
  const { totalDeductions, advanceAmount, otherDeductions } = calculateDeductions(transactions, previousCarryForward);

  const rawNetPayable = calculatedSalary - totalDeductions;
console.log(rawNetPayable)
  // ✅ Update Monthly Balance using helper
  const newCarryForward = await updateCarryForward(employeeId, month, rawNetPayable);

  const finalSalaryToPay = Math.max(0, rawNetPayable);

  const finalAttendance = Array.from(attendanceMap.entries()).map(([date, { status }]) => ({
    date,
    status,
  }));

  const fullAttendance = await prisma.attendance.findMany({
    where: { employeeId },
  });
console.log("final",calculatedSalary);
console.log("---",totalDeductions);
console.log("finalsalarytopay",finalSalaryToPay);
console.log("A", absents,"b", presentDays,"h" ,halfDays,)

  return {
    finalsalary: calculatedSalary,
    finalSalaryToPay,
    attendance: finalAttendance,
    fullAttendance,
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
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Employee not found" };

  const existingTransaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!existingTransaction || existingTransaction.employeeId !== employeeId) {
    return { error: "Transaction not found" };
  }

  const transactionDate = new Date(existingTransaction.date);
  const month = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;

  // Delete the transaction
  await prisma.transaction.delete({ where: { id: transactionId } });

  // Get attendance for the month
  const existingAttendance = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: new Date(`${month}-01`), lt: new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 1) } },
  });

  // Calculate days
  const { workingDays } = calculateDays(month);

  // Calculate salary
  const { calculatedSalary } = calculateSalary(existingAttendance , employee.baseSalary, workingDays);

  // Get remaining transactions for this month
  const remainingTransactions = await prisma.transaction.findMany({
    where: { employeeId, date: { gte: new Date(`${month}-01`), lt: new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 1) } },
  });

  // Get previous carry forward (last month's balance)
  const lastMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const lastMonthBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId, month: lastMonthKey },
    orderBy: { id: 'desc' },
  });

  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;

  // Calculate deductions
  const { totalDeductions } = calculateDeductions(remainingTransactions as Transaction[], previousCarryForward);

  // Net Payable = salary - deductions
  const netPayable = calculatedSalary - totalDeductions;

  // Update carry forward for current month
  const newCarryForward = await updateCarryForward(employeeId, month, netPayable);

  // Update monthly balance (create new record)
  await prisma.monthlyBalance.create({
    data: {
      employeeId,
      month,
      carryForward: previousCarryForward,
      salaryEarned: calculatedSalary,
      totalDeductions,
      netPayable,
      amountPaid: netPayable,
      newCarryForward,
    },
  });

  // Update employee's current balance
  await prisma.employee.update({
    where: { id: employeeId },
    data: { currentBalance: newCarryForward },
  });
  return {
    updatedBalance: previousCarryForward,
    updatedSalary: netPayable,
    totalDeduction: totalDeductions,
  };
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ✅ Ensure content-type is JSON
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content-type" }, { status: 400 });
    }

    const body = await req.json();

    //For now using a hardcoded username, ideally from session
    const username = session.user.username;

// const username = "vibhanshu"
    const {
      action,
      employeeId,
      month,
      transactions = [],
      attendance = [],
      manualOverride,
      employeeData,
      date, updates,
      transactionId
    } = body;

    if (action === 'dashboard_bulk_update'){
      const targetDate = new Date(date);
      const attendanceResult: AttendanceResult[] = [];
  for (const { name, status } of updates) {
    // 1. Find employee by name
    const employee = await prisma.employee.findFirst({
      where: { name },
    });

    if (!employee) {
      console.warn(`⚠️ Employee not found: ${name}`);
      continue;
    }

    // 2. Upsert attendance (insert or update)
    await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: targetDate,
        },
      },
      update: {
        status: status as AttendanceStatus,
      },
      create: {
        employeeId: employee.id,
        date: targetDate,
        status: status as AttendanceStatus,
      },
    });
    // const attendence = await  prisma.attendance.findMany({
    //   where: {
    //     employeeId: employee.id,
        
    //   },
     
    // });
   
   attendanceResult.push({
  name,
  employeeId: employee.id,
  status,                  // ✅ This fixes the type error
  updatedStatus: status,
  attendance,
});
  }

  return NextResponse.json({ success: true, data: attendanceResult });
   
  }
  


    if (action === "create") {
      if (
        !employeeData ||
        !employeeData.name ||
        !employeeData.joiningDate ||
        employeeData.baseSalary === undefined ||
        employeeData.currentBalance === undefined
      ) {
        return NextResponse.json({ error: "Missing required employee data" }, { status: 400 });
      }

      // Inject username if not present
      if (!employeeData.username) {
        employeeData.username = username;
      }

      // ✅ Validate data
      const parsed = CreateEmployeeSchema.safeParse(employeeData);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.errors }, { status: 400 });
      }

      const result = await createEmployee(parsed.data);
      return NextResponse.json({ message: "Employee created successfully", employee: result }, { status: 201 });
    }

    if (action === 'update') {
      if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID is required for update' }, { status: 400 });
      }
  
      const result = await updateEmployee(employeeId, transactions, month , manualOverride);
  
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
  
      return NextResponse.json(
        {
          message: 'Employee updated successfully',
          employee: {
            finalSalary: result.finalSalary,
            updatedBalance: result.updatedBalance,
            totalDeduction: result.totalDeductions,
            transaction: result.transaction,
            attendence: result.attendance
          },
      
        },
        { status: 200 }
      );
      
    }
 if (action === "delete_transaction") {
  if (!employeeId || !transactionId) {
    return NextResponse.json({ error: 'Employee ID and Transaction ID are required' }, { status: 400 });
  }

  const result = await deleteTransaction(employeeId, transactionId);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(
    {
      message: 'Transaction deleted successfully',
      updatedBalance: result.updatedBalance,
      updatedSalary: result.updatedSalary,
      totalDeduction: result.totalDeduction,
    },
    { status: 200 }
  );
}


    if (action == 'update_attendence'){
      if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID is required for update' }, { status: 400 });
      }
  
      const result = await  update_attendance(employeeId, month,attendance);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json(
        {
          message: 'Employee updated successfully',
          
            finalSalary:  result.finalsalary ,
            attendance : result.attendance,
            finalSalaryToPay: result.finalSalaryToPay ,
            fullattendance: result.fullAttendance,
            workingDays: result.workingDays,
            presentDays:result.presentDays,
            absents:result.absents,
            halfDays:result.halfDays

        
      
        },
        { status: 200 }
      );
  
    }
  
    return NextResponse.json({ error: 'Invalid action or missing data' }, { status: 400 });
  }
  catch (err) {
    console.error("POST /employee error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
