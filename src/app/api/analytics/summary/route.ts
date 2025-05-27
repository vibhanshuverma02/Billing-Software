import { prisma } from '@/config/db';
import {
  startOfWeek, endOfWeek, subWeeks, parseISO, isValid
} from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

function normalizeToUTCStart(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
}
function normalizeToUTCEnd(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const username = session.user.username;
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    const now = new Date();
    let startDate: Date, endDate: Date;

    if (type === 'thisWeek') {
      startDate = normalizeToUTCStart(startOfWeek(now, { weekStartsOn: 1 }));
      endDate = normalizeToUTCEnd(endOfWeek(now, { weekStartsOn: 1 }));
    } else if (type === 'prevWeek') {
      const prev = subWeeks(now, 1);
      startDate = normalizeToUTCStart(startOfWeek(prev, { weekStartsOn: 1 }));
      endDate = normalizeToUTCEnd(endOfWeek(prev, { weekStartsOn: 1 }));
    } else if (type === 'custom') {
      if (!start || !end) return NextResponse.json({ error: 'Missing custom dates' }, { status: 400 });
      const parsedStart = parseISO(start);
      const parsedEnd = parseISO(end);
      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      startDate = normalizeToUTCStart(parsedStart);
      endDate = normalizeToUTCEnd(parsedEnd);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // RAW SQL - summary + daily sales + salesperson count
    const [summaryResult, dailyResult, salespersonResult] = await Promise.all([
      prisma.$queryRaw<{ total: string; count: number }[]>`
        SELECT 
          COALESCE(SUM("totalAmount"), 0)::TEXT AS total,
          COUNT(*) AS count
        FROM "invoices"
        WHERE "username" = ${username}
          AND "invoiceDate" BETWEEN ${startDate} AND ${endDate}
      `,
      prisma.$queryRaw<{ date: string; total: string }[]>`
        SELECT 
          TO_CHAR("invoiceDate", 'YYYY-MM-DD') AS date,
          SUM("totalAmount")::TEXT AS total
        FROM "invoices"
        WHERE "username" = ${username}
          AND "invoiceDate" BETWEEN ${startDate} AND ${endDate}
        GROUP BY date
        ORDER BY date ASC
      `,
      prisma.$queryRaw<{ date: string; salesperson: string; count: number }[]>`
        SELECT 
          TO_CHAR("invoiceDate", 'YYYY-MM-DD') AS date,
          COALESCE("sellesperson", 'Unknown') AS salesperson,
          COUNT(*) AS count
        FROM "invoices"
        WHERE "username" = ${username}
          AND "invoiceDate" BETWEEN ${startDate} AND ${endDate}
        GROUP BY date, salesperson
        ORDER BY date ASC
      `
    ]);

   const totalSales = Number(summaryResult[0]?.total || 0);
const invoiceCount = Number(summaryResult[0]?.count || 0);


    const dailySales: Record<string, number> = {};
    dailyResult.forEach(row => {
      dailySales[row.date] = Number(row.total);
    });

  return NextResponse.json({
  totalSales,
  invoiceCount,
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  dailySales,
  invoicesBySalesperson: salespersonResult.map(row => ({
    date: row.date,
    salesperson: row.salesperson,
    count: Number(row.count), // Ensure count is a number
  })),
});


  } catch (err) {
    console.error('Summary API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
