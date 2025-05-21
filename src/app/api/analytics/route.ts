import { prisma } from '@/config/db';
import { startOfWeek, endOfWeek, subWeeks, parseISO, eachDayOfInterval, format, isValid } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';

// Normalize dates to UTC start/end of day
function normalizeToUTCStart(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
}

function normalizeToUTCEnd(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
}

export async function GET(req: NextRequest) {
  try {
    // Mock username, replace with real session extraction
    const username = "vibhanshu";

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!type) {
      return NextResponse.json({ error: 'Missing required parameter: type' }, { status: 400 });
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (type === 'thisWeek') {
      const rawStart = startOfWeek(now, { weekStartsOn: 1 });
      const rawEnd = endOfWeek(now, { weekStartsOn: 1 });
      startDate = normalizeToUTCStart(rawStart);
      endDate = normalizeToUTCEnd(rawEnd);
    } else if (type === 'prevWeek') {
      const rawStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const rawEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      startDate = normalizeToUTCStart(rawStart);
      endDate = normalizeToUTCEnd(rawEnd);
    } else if (type === 'custom') {
      if (!start || !end) {
        return NextResponse.json({ error: 'Start and end dates required for custom type' }, { status: 400 });
      }

      const parsedStart = parseISO(start);
      const parsedEnd = parseISO(end);

      if (!isValid(parsedStart) || !isValid(parsedEnd)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }

      if (parsedStart > parsedEnd) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
      }

      startDate = normalizeToUTCStart(parsedStart);
      endDate = normalizeToUTCEnd(parsedEnd);
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    // Run raw SQL to get daily totals grouped by date (PostgreSQL syntax)
    const dailySalesRaw = await prisma.$queryRaw<
      { date: string; total: string }[]
    >`
      SELECT
        TO_CHAR("invoiceDate"::DATE, 'YYYY-MM-DD') AS date,
        SUM("totalAmount")::text AS total
      FROM "invoices"
      WHERE "username" = ${username}
        AND "invoiceDate" BETWEEN ${startDate} AND ${endDate}
      GROUP BY date
      ORDER BY date ASC;
    `;

    // Get total sales and invoice count with aggregate
    const aggregateResult = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      _count: { _all: true },
      where: {
        username,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Prepare dailySales object with zeros for all days in range
    const dailySales: Record<string, number> = {};
    for (const date of eachDayOfInterval({ start: startDate, end: endDate })) {
      dailySales[format(date, 'yyyy-MM-dd')] = 0;
    }

    // Fill dailySales with actual totals from query result
    for (const record of dailySalesRaw) {
      dailySales[record.date] = Number(record.total);
    }

    return NextResponse.json({
      totalSales: aggregateResult._sum.totalAmount || 0,
      invoiceCount: aggregateResult._count._all || 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dailySales,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
