import { Attendance, Transaction } from "@prisma/client";
import { prisma } from '@/config/db';

// Get previous month's string (YYYY-MM)
export function getPreviousMonth(month: string): string {
  const [year, monthStr] = month.split("-");
  let prevMonth = parseInt(monthStr, 10) - 1;
  let prevYear = parseInt(year, 10);
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
}

// Calculate working days & sundays
export function calculateDays(month: string): {
  totalDays: number;
  weekOffs: number;
  workingDays: number;
} {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const year = start.getFullYear();
  const mon = start.getMonth();

  const totalDays = new Date(year, mon + 1, 0).getDate();

  const wednesdays = Array.from({ length: totalDays })
    .map((_, i) => new Date(year, mon, i + 1))
    .filter((d) => d.getDay() === 3) // 3 = Wednesday
    .slice(0, 4); // Only first 4 Wednesdays are week-offs

  const weekOffs = wednesdays.length;
  const workingDays = totalDays - weekOffs;

  return { totalDays, weekOffs, workingDays };
}

// Calculate salary based on attendance


export function calculateSalary(
  attendance: Attendance[],
  baseSalary: number,
  workingday: number
) {
  const STANDARD_WORKING_DAYS = 30;
  const perDaySalary = baseSalary / STANDARD_WORKING_DAYS;

  const offDates = attendance
    .filter((a) => {
      const date = new Date(a.date);
      return date.getDay() === 3; // Wednesday
    })
    .slice(0, 4) // only first 4 Wednesdays
    .map((a) => a.date);

  let absents = 0;
  let halfDays = 0;

  for (const a of attendance) {
    const isWeekOff = offDates.includes(a.date);
    if (isWeekOff) continue; // skip salary deduction on week-offs

    if (a.status === 'ABSENT') absents++;
    else if (a.status === 'HALF_DAY') halfDays++;
  }

  const totalDeductions = absents + halfDays * 0.5;
  const calculatedSalary = Math.round(baseSalary - totalDeductions * perDaySalary);
  const presentDays = workingday - totalDeductions;

  return {
    calculatedSalary,
    presentDays,
    absents,
    halfDays,
  };
}


// Calculate deductions from transactions & previous carry forward
export function calculateDeductions(transactions: Transaction[], previousCarryForward: number) {
  const advanceAmount = transactions
    .filter((t) => t.type === "ADVANCE")
    .reduce((sum, t) => sum + t.amount, 0);

  const otherDeductions = transactions
    .filter((t) => t.type === "DEDUCTION" || t.type === "OTHER")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeductions = advanceAmount + otherDeductions + previousCarryForward;

  return { totalDeductions, advanceAmount, otherDeductions };
}

// Calculate balance & carry forward
export async function updateCarryForward(employeeId: number, month: string, rawNetPayable: number) {
  let newCarryForward = 0;
  if (rawNetPayable < 0) {
    newCarryForward = Math.abs(rawNetPayable);
  }

  const currentMonthBalance = await prisma.monthlyBalance.findFirst({
    where: { employeeId, month },
    orderBy: { id: 'desc' },
  });

  if (currentMonthBalance) {
    await prisma.monthlyBalance.update({
      where: { id: currentMonthBalance.id },
      data: { newCarryForward },
    });
  }

  return newCarryForward;
}
export async function filterNewTransactions(existing: Transaction[], incoming: Transaction[]) {
  return incoming.filter((t) =>
    !existing.some((et) =>
      et.type === t.type &&
      et.amount === t.amount &&
      et.description === t.description &&
      new Date(et.date).toISOString() === new Date(t.date).toISOString()
    )
  );
}
