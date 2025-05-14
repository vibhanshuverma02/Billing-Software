import { prisma } from '@/config/db';
import { authOptions } from '../auth/[...nextauth]/options';
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { CreateEmployeeInput, CreateEmployeeSchema } from "@/schema/employeeschema";
import { AttendanceStatus } from '@prisma/client';
// import { EvalDevToolModulePlugin } from 'webpack';
// import { resourceUsage } from 'process';
type Transaction = {
  id: number;
  employeeId: number;
  amount: number;
  type: 'SALARY' | 'ADVANCE' | 'DEDUCTION' | 'OTHER';
  description?: string| null;
  date: Date;
};

type AttendanceResult = {
  employeeId: number;
  name: string;
  status: string;
 updatedStatus: string,
  attendance:unknown


};
export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user?.username) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const { searchParams } = new URL(req.url);
  // const username = session.user.username;
  const username = 'vibhanshu';
  const name = searchParams.get("name");
  const month = searchParams.get("month"); // Format: YYYY-MM
 // const employeeId = searchParams.get("id");
  if (!name) {
    return NextResponse.json({ error: "Missing employee name" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: { username, name },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!month) {
      return NextResponse.json({ employee });
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Prevent future months
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    if (start.getFullYear() > currentYear || (start.getFullYear() === currentYear && start.getMonth() > currentMonth)) {
      return NextResponse.json({ error: "Cannot calculate salary for a future month" }, { status: 400 });
    }

    const [attendance, transactions] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: start, lt: end },
        },
      }),
      prisma.transaction.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: start, lt: end },
        },
      }),
    ]);
console.log("att",attendance)
    // Attendance salary calculation
   // Get total days and Sundays in the month
const totalDays = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
const sundays = Array.from({ length: totalDays })
  .map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
  .filter((d) => d.getDay() === 0).length;

  const previousMonth = (() => {
    const [year, monthStr] = month.split("-");
    let prevMonth = parseInt(monthStr, 10) - 1;
    let prevYear = parseInt(year, 10);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
  })();
  console.log(previousMonth);

  const lastMonthBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId :employee.id , month: previousMonth },
    orderBy: {
      id: 'desc',
    },
  });
  console.log("Fetched last month balance: ", lastMonthBalance);  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;
  console.log("previousCarryForward",previousCarryForward)

// Calculate working days (excluding Sundays)
const workingDays = totalDays - sundays;

// From attendance records
const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
const absents = attendance.filter((a) => a.status === "ABSENT").length;

// Present days = all working days - absents - halfDays (0.5 for each half day)
const presentDays = workingDays - absents - 0.5 * halfDays;

// Daily salary
const salaryPerDay = employee.baseSalary / workingDays;
console.log("pr",presentDays , "half" , halfDays , "abse",absents)
// Final salary before deductions
const calculatedSalary = Math.round(salaryPerDay * presentDays);
console.log("salary earned", calculatedSalary);

    // Sum of deductions this month
    const advanceAmount = transactions
      .filter((t) => t.type === "ADVANCE")
      .reduce((sum, t) => sum + t.amount, 0);

    const otherDeductions = transactions
      .filter((t) => t.type === "DEDUCTION" || t.type === "OTHER")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDeductions = advanceAmount + otherDeductions + previousCarryForward;

    
    const rawNetPayable = calculatedSalary - totalDeductions ;
    console.log("rawNetPayable", rawNetPayable);
   
  let newCarryForward = 0;
  if (rawNetPayable < 0) {
    newCarryForward = Math.abs(rawNetPayable);
    console.log(newCarryForward)
    console.log("newCarryForward",newCarryForward )
   
  }

  const currentMonthBalance = await prisma.monthlyBalance.findFirst({
    where: {
      employeeId: employee.id,
      month: month, // 🔥 current month, not previous
    },
    orderBy: {
      id: 'desc',
    },
  });
  
  if (currentMonthBalance) {
    await prisma.monthlyBalance.update({
      where: { id: currentMonthBalance.id },
      data: {
        newCarryForward: newCarryForward, // ✅ this month's carry forward
      },
    });
  }
  
    const finalSalaryToPay = Math.max(0, rawNetPayable);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { currentBalance: previousCarryForward },
    });
    employee.currentBalance = previousCarryForward;
    console.log("currentbase",employee.currentBalance);
    
    return NextResponse.json({
      employee,
      attendance,
      transactions,
      workingDays,
      absents,
      halfDays,
      presentDays,
      calculatedSalary,
      totalDeductions,
      //emiThisMonth,
      finalSalaryToPay,
      //carryForward,
      loanRemaining: employee.loanRemaining,
      currentBalance:employee.currentBalance,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
async function calculateMonthlyBalance(
  employeeId: number,
  month: string,
  baseSalary: number,
  calculatedSalary:number,
  transactions: Transaction[],
  
  manualOverride?: number
) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);

  const previousMonth = (() => {
    const [year, monthStr] = month.split("-");
    let prevMonth = parseInt(monthStr, 10) - 1;
    let prevYear = parseInt(year, 10);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
  })();

  const lastMonthBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId, month: previousMonth },
    orderBy: {
      id: 'desc',
    },
  });
   console.log("lastMonthBalance" , lastMonthBalance);
  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;
  console.log("previousCarryForward",previousCarryForward)

  const advanceAmount = transactions
    .filter((t) => t.type === "ADVANCE")
    .reduce((sum, t) => sum + t.amount, 0);

  const otherDeductions = transactions
    .filter((t) => t.type === "DEDUCTION" || t.type === "OTHER")
    .reduce((sum, t) => sum + t.amount, 0);
    

  const totalDeductions = advanceAmount + otherDeductions;
   console .log( "!", totalDeductions);
 
  // 👇 Attendance already counted separately
 
  const rawNetPayable = calculatedSalary - totalDeductions ;
  console.log("rawNetPayable" , rawNetPayable);
  let netPayable = manualOverride ?? rawNetPayable;

  let newCarryForward = 0;
  if (netPayable < 0) {
    newCarryForward = Math.abs(netPayable);
    console.log(newCarryForward)
    console.log("newCarryForward",newCarryForward )
    netPayable = 0;
  }

  return {
    salaryEarned: calculatedSalary,
    totalDeductions,
    previousCarryForward,
    netPayable,
    newCarryForward,
  };
}

async function updateEmployee(
  employeeId: number,
  transactions: Transaction[],
  month: string,
  manualOverride: number | undefined
) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return { error: "Employee not found" };
  }

  if (!month) {
    return { error: "Month is required" };
  }

  const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Last day of the selected month

  const today = new Date();
  if (start > today) {
    return { error: "Cannot calculate salary for a future month" };
  }


  const totalDays = end.getDate();
  const sundays = Array.from({ length: totalDays })
  .map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
  .filter((d) => d.getDay() === 0).length;

  const existingAttendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: { gte: start, lt: end },
    },
  });

  type Attendance = {
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | string;  // Add other possible statuses if needed
};

const absents = existingAttendance.filter((a: Attendance) => a.status === "ABSENT").length;
console.log("A", absents);

const halfDays = existingAttendance.filter((a: Attendance) => a.status === "HALF_DAY").length;
console.log("h", halfDays);

const workingDays = totalDays - sundays;
const presentDays = workingDays - absents - (halfDays * 0.5);
console.log("P", presentDays);

 
  
  const salaryPerDay = employee.baseSalary / workingDays;
  const calculatedSalary = Math.round(salaryPerDay * presentDays);
  

 console.log( "x",calculatedSalary)
  const existingTxns = await prisma.transaction.findMany({
    where: {
      employeeId,
      date: {
        gte: start,
        lt: new Date(start.getFullYear(), start.getMonth() + 1, 1),
      },
    },
  });

  const newTransactions = transactions.filter((t: Transaction) =>
    !existingTxns.some((et) =>
      et.type === t.type &&
      et.amount === t.amount &&
      et.description === t.description &&
      new Date(et.date).toISOString() === new Date(t.date).toISOString()
    )
  );

  const allTxns = [...existingTxns, ...newTransactions];

  const {
    
    totalDeductions,
    previousCarryForward,
    netPayable,
    newCarryForward,
  } = await calculateMonthlyBalance(
    employeeId,
    month,
    employee.baseSalary,
    calculatedSalary,
    allTxns,
    manualOverride
  );

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

  await prisma.employee.update({
    where: { id: employeeId },
    data: { currentBalance: newCarryForward },
  });
  employee.currentBalance= newCarryForward;
  console.log( "currentbase after transcation:",employee. currentBalance)
  const createdTransactions = [];
  for (const t of newTransactions) {
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) continue;

   const newtranscation = await prisma.transaction.create({
      data: {
        employeeId,
        type: t.type,
        amount: t.amount,
        description: t.description ?? null,
        date: transactionDate,
      },
    });
    createdTransactions.push(newtranscation); 
  }
 
  

  return {
    finalSalary: netPayable,
    updatedBalance: previousCarryForward,
    totalDeductions: totalDeductions,
    transaction: createdTransactions,
    attendance: existingAttendance
  };
}
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
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

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // last day of month

  if (start > new Date()) {
    return { error: "Cannot calculate salary for a future month" };
  }

  const totalDays = end.getDate();
  const sundays = Array.from({ length: totalDays })
    .map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
    .filter((d) => d.getDay() === 0).length;

    const previousMonth = (() => {
      const [year, monthStr] = month.split("-");
      let prevMonth = parseInt(monthStr, 10) - 1;
      let prevYear = parseInt(year, 10);
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      return `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
    })();
    console.log(previousMonth);
  
    const lastMonthBalance = await prisma.monthlyBalance.findFirst({
      where: { employeeId :employee.id , month: previousMonth },
      orderBy: {
        id: 'desc',
      },
    });
    console.log("Fetched last month balance: ", lastMonthBalance);  const previousCarryForward = lastMonthBalance?.newCarryForward || 0;
    console.log("previousCarryForward",previousCarryForward)
  
  // Fetch existing attendance for the month
  const [existingAttendance, transactions] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: start, lt: end },
      },
    }),
    prisma.transaction.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: start, lt: end },
      },
    }),
  ]);


  // Merge existing and new attendance (new overwrites existing)
  const attendanceMap = new Map<string, { status: string }>();
  for (const a of existingAttendance) {
    attendanceMap.set(formatDate(a.date), { status: a.status  as AttendanceStatus,
     });
  }
  for (const a of attendance) {
    attendanceMap.set(formatDate(new Date(a.date)), { status: a.status  as AttendanceStatus,
    });
  }

  // Upsert all attendance entries in parallel
  const upserts = Array.from(attendanceMap.entries()).map(([dateStr, { status }]) => {
    const date = new Date(dateStr);
    return prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId, date },
      },
      update: { status: status as AttendanceStatus },
      create: {
        employeeId,
        date,
        status: status as AttendanceStatus,
      },
    });
  });

  await Promise.all(upserts);

  // Salary calculation
  const allAttendance = Array.from(attendanceMap.values());
  const workingDays = totalDays - sundays;
  const absents = allAttendance.filter((a) => a.status === "ABSENT").length;
  const halfDays = allAttendance.filter((a) => a.status === "HALF_DAY").length;
  const presentDays = workingDays - absents - halfDays * 0.5;
  const salaryPerDay = employee.baseSalary / workingDays;
  const calculatedSalary = Math.round(salaryPerDay * presentDays);

  const finalAttendance = Array.from(attendanceMap.entries()).map(([date, { status }]) => ({
    date,
    status,
  }));

  const fullAttendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id
    }
  });
  console.log( "fullAttendance"   , fullAttendance)
   // Sum of deductions this month
   const advanceAmount = transactions
   .filter((t) => t.type === "ADVANCE")
   .reduce((sum, t) => sum + t.amount, 0);

 const otherDeductions = transactions
   .filter((t) => t.type === "DEDUCTION" || t.type === "OTHER")
   .reduce((sum, t) => sum + t.amount, 0);

 const totalDeductions = advanceAmount + otherDeductions + previousCarryForward;


 const rawNetPayable = calculatedSalary - totalDeductions ;
 
 let newCarryForward = 0;
  if (rawNetPayable < 0) {
    newCarryForward = Math.abs(rawNetPayable);
    console.log(newCarryForward)
    console.log("newCarryForward",newCarryForward )
   
  }

  const currentMonthBalance = await prisma.monthlyBalance.findFirst({
    where: {
      employeeId: employee.id,
      month: month, // 🔥 current month, not previous
    },
    orderBy: {
      id: 'desc',
    },
  });
  
  if (currentMonthBalance) {
    await prisma.monthlyBalance.update({
      where: { id: currentMonthBalance.id },
      data: {
        newCarryForward: newCarryForward, // ✅ this month's carry forward
      },
    });
  }
  
 
 const finalSalaryToPay = Math.max(0, rawNetPayable);
 await prisma.employee.update({
   where: { id: employee.id },
   data: { currentBalance: previousCarryForward },
 });
 employee.currentBalance = previousCarryForward;
 
  return {
    finalsalary: calculatedSalary,
    finalSalaryToPay:finalSalaryToPay,
    attendance: finalAttendance,
    fullAttendance: fullAttendance,
    absents: absents,
    halfDays:halfDays,
    presentDays: presentDays
  };
}
async function deleteTransaction(
  employeeId: number,
  transactionId: number
) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return { error: "Employee not found" };
  }

  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existingTransaction || existingTransaction.employeeId !== employeeId) {
    return { error: "Transaction not found" };
  }

  const transactionDate = new Date(existingTransaction.date);

  // Delete the transaction
  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  // Determine the month from the transaction date
  const month = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);

  const totalDays = end.getDate();
  const sundays = Array.from({ length: totalDays })
    .map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
    .filter((d) => d.getDay() === 0).length;

  const existingAttendance = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: start, lt: end },
    },
  });

  const absents = existingAttendance.filter((a) => a.status === "ABSENT").length;
  const halfDays = existingAttendance.filter((a) => a.status === "HALF_DAY").length;

  const workingDays = totalDays - sundays;
  const presentDays = workingDays - absents - (halfDays * 0.5);

  const salaryPerDay = employee.baseSalary / workingDays;
  const calculatedSalary = Math.round(salaryPerDay * presentDays);

  // Get remaining transactions after deletion
  const remainingTransactions = await prisma.transaction.findMany({
    where: {
      employeeId,
      date: { gte: start, lt: new Date(start.getFullYear(), start.getMonth() + 1, 1) },
    },
  });

  const {
   
    totalDeductions,
    previousCarryForward,
    netPayable,
    newCarryForward,
  } = await calculateMonthlyBalance(
    employeeId,
    month,
    employee.baseSalary,
    calculatedSalary,
    remainingTransactions,
    undefined // No manual override for deletion
  );

  // Update Monthly Balance (optional)
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

    // For now using a hardcoded username, ideally from session
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
            fullattendance: result.fullAttendance
        
      
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
