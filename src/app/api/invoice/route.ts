import { prisma } from '@/config/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
// ✅ GET API - Check if customer exists
export async function GET(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
  
      const { searchParams } = new URL(req.url);
      const action = searchParams.get('action');
      const username = session.user.username;
    // const username = "vibhanshu";
      // ✅ Action 1: Download Excel of Invoices
      if (action === 'export') {
        const year = Number(searchParams.get('year'));
        const month = Number(searchParams.get('month'));
  
        if (!year || !month) {
          return NextResponse.json({ message: 'Missing year or month' }, { status: 400 });
        }
  
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
  const invoices = await prisma.invoice.findMany({
  where: {
    username: username,
    invoiceDate: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: { invoiceDate: 'desc' },
});

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Invoices');

// Define invoice row columns (no customerName here, grouped above)
const invoiceColumns = [
  { header: 'Invoice No', key: 'invoiceNo', width: 20 },
  { header: 'Invoice Date', key: 'invoiceDate', width: 20 },
  { header: 'Total Amount', key: 'totalAmount', width: 15 },
];

// Group invoices by customerName
const groupedInvoices: Record<string, typeof invoices> = {};
invoices.forEach(inv => {
  if (!groupedInvoices[inv.customerName]) {
    groupedInvoices[inv.customerName] = [];
  }
  groupedInvoices[inv.customerName].push(inv);
});
let grandTotal = 0;
// Start adding data to sheet
for (const [customerName, customerInvoices] of Object.entries(groupedInvoices)) {
  // Customer header row
  const customerHeaderRow = sheet.addRow([`Customer Name: ${customerName}`]);
  customerHeaderRow.font = { bold: true, size: 12 };

  // Add column headers for invoices
  const headerRow = sheet.addRow(invoiceColumns.map(col => col.header));
  headerRow.font = { bold: true };
  headerRow.border = {
    bottom: { style: 'thin' },
  };

  // Add invoice data rows
  customerInvoices.forEach(inv => {
    sheet.addRow([
      inv.invoiceNo,
      format(new Date(inv.invoiceDate), 'yyyy-MM-dd'),
      inv.totalAmount,
    ]);
  });

  // Calculate total balance for this customer
  const totalBalance = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  grandTotal += totalBalance;  // Add to Grand Total
  // Add total balance row
  const totalRow = sheet.addRow([`Total Balance for ${customerName}:`, '', totalBalance]);
  totalRow.font = { bold: true };

  // Add empty row for spacing
  sheet.addRow([]);
}

// 🟢 Grand Total Row at End
const grandTotalRow = sheet.addRow([`Grand Total:`, '', grandTotal]);
grandTotalRow.font = { bold: true, size: 14 };
grandTotalRow.alignment = { horizontal: 'right' };

// Apply border to Grand Total
grandTotalRow.border = {
  top: { style: 'thick' },
};
grandTotalRow.getCell(3).numFmt = '#,##,##0';
sheet.columns.forEach((column) => {
  if (!column) return; // Skip if column is undefined

  let maxLength = 0;

  column.eachCell?.({ includeEmpty: false }, (cell) => {
    const columnLength = cell.value ? cell.value.toString().length : 10;
    if (columnLength > maxLength) {
      maxLength = columnLength;
    }
  });

  column.width = maxLength + 5; // Add padding
});


const buffer = await workbook.xlsx.writeBuffer();

return new NextResponse(buffer, {
  status: 200,
  headers: {
    'Content-Disposition': `attachment; filename="Sales-GSTinvoice  ${year}-${month}.xlsx"`,
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
});


      }
  
      // ✅ Action 2: Customer Exists Check
      const customerName = searchParams.get('customerName');
      const mobileNo = searchParams.get('customermobileNo');
  
      if (!customerName && !mobileNo) {
        return NextResponse.json({ message: 'Missing customerName or mobileNo' }, { status: 400 });
      }
  
      const customer = await prisma.customer.findFirst({
        where: {
          AND: [
            { username: username },
            { customerName: customerName ?? undefined },
            { mobileNo: mobileNo ?? undefined },
          ],
        },
      });
  
      if (!customer) {
        return NextResponse.json(
          { message: 'New Customer', isNewCustomer: true },
          { status: 200 }
        );
      }
  
      return NextResponse.json({
        message: 'Customer already exist, move to existing invoice',
        customer,
      });
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }
// ✅ POST API - Create Customer and Invoice

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerName,
      mobileNo,
      address,
      Grandtotal,
      previous,
      paidAmount,
      SuperTotal,
      Refund,
    } = body;

    const parsedGrandtotal = parseFloat(Grandtotal);
    const parsedPreviousDue = parseFloat(previous);
    let parsedPaidAmount = parseFloat(paidAmount); // Will reduce this progressively

    if (
      !customerName ||
      !mobileNo ||
      isNaN(parsedGrandtotal) ||
      isNaN(parsedPreviousDue) ||
      isNaN(parsedPaidAmount)
    ) {
      return NextResponse.json(
        { message: 'Missing required fields or invalid format' },
        { status: 400 }
      );
    }

    const username = session.user.username;
    const isAnonymous = customerName === 'NA' && mobileNo === '0000000000';

    let customer = null;

    if (isAnonymous) {
      customer = await prisma.customer.findFirst({
        where: {
          username,
          customerName: 'NA',
          mobileNo: '0000000000',
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            username,
            customerName: 'NA',
            mobileNo: '0000000000',
            address: '',
            balance: 0,
          },
        });
      }
    } else {
      customer = await prisma.customer.findFirst({
        where: {
          AND: [{ username }, { customerName }, { mobileNo }],
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            username,
            customerName,
            mobileNo,
            address: address || '',
            balance: 0,
          },
        });
      }
    }

    const invoiceUpdates = [];

    // Apply paidAmount to previous unpaid invoices in FIFO order
    if (!isAnonymous && parsedPaidAmount > 0) {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          customerId: customer.id,
          balanceDue: { gt: 0 },
        },
        orderBy: {
          invoiceDate: 'asc',
        },
      });

      for (const oldInvoice of unpaidInvoices) {
        if (parsedPaidAmount <= 0) break;

        const due = oldInvoice.balanceDue;

        if (parsedPaidAmount >= due) {
          // Fully pay this invoice
          invoiceUpdates.push(
            prisma.invoice.update({
              where: { id: oldInvoice.id },
              data: {
                paidAmount: oldInvoice.paidAmount + due,
                balanceDue: 0,
                paymentStatus: 'paid',
              },
            })
          );
          parsedPaidAmount -= due;
        } else {
          // Partially pay this invoice
          invoiceUpdates.push(
            prisma.invoice.update({
              where: { id: oldInvoice.id },
              data: {
                paidAmount: oldInvoice.paidAmount + parsedPaidAmount,
                balanceDue: due - parsedPaidAmount,
                paymentStatus: 'due',
              },
            })
          );
          parsedPaidAmount = 0;
        }
      }
    }

    // Now calculate the balance for the current invoice based on remaining paidAmount
    let balanceDue = SuperTotal - paidAmount;
    if (balanceDue < 0) balanceDue = 0;
    const paymentStatus = balanceDue <= 0 ? 'paid' : 'due';

    // Build transaction
    const transactionOps = [
      prisma.invoice.create({
        data: {
          username,
          customerId: customer.id,
          customerName,
          invoiceNo: `INV-${Date.now()}-${uuidv4().split('-')[0]}`,
          totalAmount: parsedGrandtotal,
          previousDue: parsedPreviousDue,
          paidAmount: paidAmount,
          balanceDue,
          paymentStatus,
          supertotal: SuperTotal,
          refund: Refund,
        },
      }),

      // Only update customer balance if not anonymous
      ...(!isAnonymous
        ? [
            prisma.customer.update({
              where: { id: customer.id },
              data: { balance: balanceDue },
            }),
          ]
        : []),

      ...invoiceUpdates,
    ];

    const [newInvoice] = await prisma.$transaction(transactionOps);

    return NextResponse.json({
      message: 'Invoice created successfully',
      customer,
      invoice: newInvoice,
      balanceDue,
      paymentStatus,
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {  invoiceId, pdfBufferBase64 } = body;

    const pdfBuffer = Buffer.from(pdfBufferBase64, "base64");

    const updatedInvoice = await prisma.invoice.update({
      where: { id:  invoiceId },
      data: { pdfUrl: pdfBuffer },
    });

    return Response.json({ success: true, message: "PDF saved", data: updatedInvoice });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, message: "Error saving PDF" }, { status: 500 });
  }
}

