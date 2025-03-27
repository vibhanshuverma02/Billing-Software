import { prisma } from '@/config/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

// ✅ GET API - Check if customer exists
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerName = searchParams.get('customerName');
    const mobileNo = searchParams.get('customermobileNo');

    if (!customerName && !mobileNo) {
      return NextResponse.json({ message: 'Missing customerName or mobileNo' }, { status: 400 });
    }

    const username = session.user.username;
    // const username = "kukreja"

    // ✅ Query for customer
    const customer = await prisma.customer.findFirst({
      where: {
        AND: [
          { username: username },
          {  customerName: customerName ?? undefined },   // ✅ Use fallback to undefined
          { mobileNo: mobileNo ?? undefined }            // ✅ Use fallback to undefined
        ]
      }
    });

    if (!customer) {
      return NextResponse.json({ message: 'New Customer' }, { status: 201 });
    }

    return NextResponse.json({
      message: 'Customer already exist move to exisiting invoice',
      customer
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
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
      paidAmount
    } = body;

    if (
      !customerName || 
      !mobileNo || 
      typeof Grandtotal !== 'number' || 
      typeof paidAmount !== 'number'
    ) {
      return NextResponse.json({ message: 'Missing required fields or invalid format' }, { status: 400 });
    }

    const username = session.user.username;

    // ✅ Check if the customer already exists
    let customer = await prisma.customer.findFirst({
      where: {
        AND: [
          { username },
          { customerName },
          { mobileNo }
        ]
      }
    });

    // ✅ Create new customer if not found
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          username,
          customerName,
          mobileNo,
          address: address || '',
          balance: 0,
          pdfUrl:"D"
          
 
        }
      });
    }

    // ✅ Calculate balance and payment status
    const balanceDue = Grandtotal - paidAmount;
    const paymentStatus = 
      balanceDue === 0 ? 'Paid' : 
      (paidAmount > 0 ? 'Partial' : 'Due');

    // ✅ Use Prisma Transaction for atomic operations
    const [newInvoice] = await prisma.$transaction([  
      prisma.invoice.create({
        data: {
          username,
          customerId: customer.id,
          customerName,
          invoiceNo: `INV-${Date.now()}-${uuidv4().split('-')[0]}`,
          totalAmount: Grandtotal,
          paidAmount,
          balanceDue,
          paymentStatus,
          
          
        }
      }),

      prisma.customer.update({
        where: { id: customer.id },
        data: {
          balance: {
            increment: balanceDue,
          }
        }
      })
    ]);

    return NextResponse.json({
      message: 'Invoice created successfully',
      customer,
      invoice: newInvoice,
      balanceDue,
      paymentStatus
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
  // ✅ PUT handler to update pdfURL using customerId

  
export async function PUT(request: Request) {
  try {
    const { customerId, pdfURL } = await request.json();

    if (!customerId || !pdfURL) {
      return Response.json(
        { success: false, message: 'Customer ID and pdfURL are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return Response.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id:customerId},
      data: { pdfUrl: pdfURL },
    });

    return Response.json(
      { success: true, message: 'PDF URL updated successfully', data: updatedCustomer },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating PDF URL:', error);
    return Response.json(
      { success: false, message: 'Failed to update PDF URL' },
      { status: 500 }
    );
  }
}

