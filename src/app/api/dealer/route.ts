import { prisma } from '@/config/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options'; // Adjust path based on your project
import { generatePdfBase64FromImage } from '@/helpers/image-pdf';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
   try {
    const session = await getServerSession(authOptions);
     const userId = session?.user?.id;
    //     const userId = "cm8qfm5xm0000fiu4oeum23fv";

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
if (action === 'export') {
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));

  if (!year || !month) {
    return NextResponse.json({ message: 'Missing year or month' }, { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const dealers = await prisma.dealer.findMany({
    where: {
      userId,
    },
    select: {
      name: true,
      address: true,
      bills: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          chequeNo: true,
          uniqueNo: true,
          totalAmount: true,
          less: true,
          date: true,
        },
      },
      payments: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
          chequeNo: true,
          uniqueNo: true,
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Bills');

  const BillColumns = [
    { header: 'Bill No', key: 'BillNo', width: 5},
    { header: 'Bill Date', key: 'BillDate', width: 20 },
     { header: 'chequeNo', key: 'chequeNo', width: 20},
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Paid Amount', key: 'amount', width: 15 },
  ];

  let grandTotal = 0;
  let grandPaidTotal = 0;

  for (const dealer of dealers) {
    if (dealer.bills.length === 0) continue;

    const customerHeaderRow = sheet.addRow([`Customer Name: ${dealer.name}`]);
    customerHeaderRow.font = { bold: true, size: 12 };

    const headerRow = sheet.addRow(BillColumns.map(col => col.header));
    headerRow.font = { bold: true };
    headerRow.border = { bottom: { style: 'thin' } };

    let dealerPaidTotal = 0;
    let dealerBillTotal = 0;

    dealer.bills.forEach(bill => {
      const paidAmount = dealer.payments
        .filter(p => p.chequeNo === bill.chequeNo && p.uniqueNo === bill.uniqueNo)
        .reduce((sum, p) => sum + p.amount, 0);

      dealerPaidTotal += paidAmount;
      dealerBillTotal += bill.totalAmount;

      sheet.addRow([
        bill.uniqueNo,
        bill.date.toISOString().split('T')[0],
        bill.chequeNo,
        bill.totalAmount,
        paidAmount,
      ]);
    });

    grandTotal += dealerBillTotal;
    grandPaidTotal += dealerPaidTotal;

    const totalRow = sheet.addRow([
      `Total Balance for ${dealer.name}:`,
      '',    // Bill No (empty)
      '',        // Bill Date (empty)
             // Cheque No (empty)
      dealerBillTotal,
      dealerPaidTotal,
    ]);
    totalRow.font = { bold: true };

    sheet.addRow([]);
  }

  const grandTotalRow = sheet.addRow(['Grand Total:', '','', grandTotal, grandPaidTotal]);
  grandTotalRow.font = { bold: true, size: 14 };
  grandTotalRow.alignment = { horizontal: 'right' };
  grandTotalRow.border = { top: { style: 'thick' } };

  // Indian number formatting
  grandTotalRow.getCell(4).numFmt = '#,##,##0';
  grandTotalRow.getCell(5).numFmt = '#,##,##0';

  // Auto adjust column widths
  sheet.columns.forEach(column => {
    if (!column) return;

    let maxLength = 0;
    column.eachCell?.({ includeEmpty: false }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength + 5;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="Purchase-${year}-${month}.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}

    // ➡ Other endpoints logic (unchanged) ⬇
    const categoryIdParam = searchParams.get('categoryId');
    const dealerID = searchParams.get('dealerId');

    if (!categoryIdParam) {
      const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });
      return NextResponse.json({ categories });
    }

    const categoryId = parseInt(categoryIdParam);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: 'Invalid category ID' }, { status: 400 });
    }

    if (!dealerID) {
      const dealers = await prisma.dealer.findMany({
        where: { userId, categoryId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          address: true,
        },
      });

      return NextResponse.json({ dealers });
    }

    const dealer = await prisma.dealer.findFirst({
      where: { userId, categoryId, id: Number(dealerID) },
      select: {
        id: true,
        name: true,
        contact: true,
        address: true,
        payments: {
          select: {
            id: true,
            amount: true,
            date: true,
            chequeNo: true,
            uniqueNo: true,
          },
        },
        bills: {
          select: {
            id: true,
            chequeNo: true,
            uniqueNo: true,
            totalAmount: true,
            less: true,
            pdfBase64: true,
            date: true,
          },
        },
      },
    });

    if (!dealer) {
      return NextResponse.json({ message: 'Dealer not found' }, { status: 404 });
    }

    return NextResponse.json({ dealer });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { name, contact, address, categoryName, billData } = body;

      // 1. Create category
      if (categoryName && !name && !contact && !address && !billData) {
        const existingCategory = await prisma.category.findFirst({
          where: { userId, name: categoryName },
        });

        if (existingCategory) {
          return NextResponse.json({ message: 'Category already exists' }, { status: 400 });
        }

        const newCategory = await prisma.category.create({
          data: {
            name: categoryName,
            user: { connect: { id: userId } },
          },
        });

        return NextResponse.json({ message: 'Category created', category: newCategory });
      }

      // 2. Create dealer
      if (name && contact && address && categoryName && !billData) {
        const existingDealer = await prisma.dealer.findFirst({
          where: { name, contact, address },
        });

        if (existingDealer) {
          return NextResponse.json({ message: 'Dealer already exists' }, { status: 400 });
        }

        let category = await prisma.category.findFirst({
          where: { userId, name: categoryName },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              user: { connect: { id: userId } },
            },
          });
        }

        const newDealer = await prisma.dealer.create({
          data: {
            name,
            contact,
            address,
            category: { connect: { id: category.id } },
            user: { connect: { id: userId } },
          },
        });

        return NextResponse.json({ message: 'Dealer created', dealer: newDealer });
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const json = formData.get('json') as string;
      const file = formData.get('file') as File | null;
      const body = JSON.parse(json || '{}');
      const { name, categoryName, billData } = body;

      if (name && categoryName && billData && file) {
        const {
          date,
          uniqueNo,
          chequeNo,
          totalAmount,
          less,
        } = billData;

        const dealer = await prisma.dealer.findFirst({
          where: { name, userId },
        });

        if (!dealer) {
          return NextResponse.json({ message: 'Dealer not found for bill' }, { status: 404 });
        }

        const category = await prisma.category.findFirst({
          where: { name: categoryName, userId },
        });

        if (!category) {
          return NextResponse.json({ message: 'Category not found for bill' }, { status: 404 });
        }

        const billDate = new Date(date);
        const calculatedAmount = totalAmount - less;

        const existingBill = await prisma.bill.findUnique({
          where: {
            chequeNo_uniqueNo: {
              chequeNo,
              uniqueNo,
            },
          },
        });

        if (existingBill) {
          return NextResponse.json({ message: 'Bill already exists' }, { status: 400 });
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        const pdfBase64 = await generatePdfBase64FromImage(imageBuffer);

        const newBill = await prisma.bill.create({
          data: {
            date: billDate,
            uniqueNo,
            chequeNo,
            totalAmount,
            less,
            pdfBase64,
            dealer: { connect: { id: dealer.id } },
            category: { connect: { id: category.id } },
          },
        });

        const newPayment = await prisma.payment.create({
          data: {
            amount: calculatedAmount,
            date: billDate,
            dealer: { connect: { id: dealer.id } },
            bill: {
              connect: {
                chequeNo_uniqueNo: {
                  chequeNo,
                  uniqueNo,
                },
              },
            },
          },
        });

        return NextResponse.json({
          message: 'Bill and Payment created successfully',
          bill: newBill,
          payment: newPayment,
        });
      }
    }

    // If none of the above match
    return NextResponse.json({ message: 'Invalid data or request type' }, { status: 400 });

  } catch (error) {
    console.error('Error occurred:', error);
    return NextResponse.json({ message: 'Server error', error: String(error) }, { status: 500 });
  }
}
