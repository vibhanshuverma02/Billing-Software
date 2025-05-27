import { prisma } from '@/config/db';
import { NextRequest, NextResponse } from 'next/server';
import { parseISO, format, isValid } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.username;
    const url = new URL(req.url);
    const day = url.searchParams.get('day');
    const invoiceId = url.searchParams.get('id'); // optional invoice ID param

    if (invoiceId) {
      // Return base64 PDF URL for single invoice by id
      const invoice = await prisma.invoice.findFirst({
        where: { id: Number(invoiceId), username },
        select: { pdfUrl: true },
      });

     if (!invoice || !invoice.pdfUrl) {
  return NextResponse.json({ error: 'Invoice PDF not found' }, { status: 404 });
}

const buffer = Buffer.from(invoice.pdfUrl); // Uint8Array -> Buffer
const pdfBase64 = `data:application/pdf;base64,${buffer.toString('base64')}`;

return NextResponse.json({ url: pdfBase64 });

    }

    // If no invoiceId, return metadata for all invoices of the day (no pdf data)
    if (!day) {
      return NextResponse.json({ error: 'Missing day parameter' }, { status: 400 });
    }

    const parsedDay = parseISO(day);
    if (!isValid(parsedDay)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const startOfDay = new Date(parsedDay);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDay);
    endOfDay.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        username,
        invoiceDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        invoiceDate: true,
        totalAmount: true,
        sellesperson: true,
        // no pdfUrl here, so won't be sent
      },
      orderBy: {
        invoiceDate: 'asc',
      },
    });

    const formattedInvoices = invoices.map(inv => ({
      id: inv.id,
      time: format(inv.invoiceDate, 'hh:mm a'),
      total: Number(inv.totalAmount),
      salesperson: inv.sellesperson || 'Unknown',
      url: null, // No PDF URL in this response
    }));

    const total = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return NextResponse.json({
      invoices: formattedInvoices,
      total,
    });
  } catch (error) {
    console.error('Invoice Drilldown Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

