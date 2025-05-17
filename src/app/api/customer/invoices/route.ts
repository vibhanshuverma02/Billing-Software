import {prisma} from '@/config/db';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getServerSession } from "next-auth";
import { NextResponse } from 'next/server';

  
  export async function GET(request: Request) {
    try {
       const session = await getServerSession(authOptions);
        if (!session || !session.user?.username) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      const { searchParams } = new URL(request.url);
      const username = session.user.username;
      const customerIdParam = searchParams.get('customerId');
      const pageParam = searchParams.get('page');
      const limitParam = searchParams.get('limit');
  
      // 👤 Fetch single customer detail
      if (customerIdParam) {
        const customerId = Number(customerIdParam);
  
        const invoices = await prisma.invoice.findMany({
          where: { customerId },
          orderBy: { invoiceDate: 'asc' },
        });
  
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            customerName: true,
            mobileNo: true,
            address: true,
            balance: true,
            status: true,
          },
        });
  
        const paymenthistory = await prisma.customerPaymentHistory.findMany({
          where: { customerId },
          orderBy: { paidAt: 'asc' },
        });
  
        return Response.json({
          customer,
          invoices,
          balance: customer?.balance ?? 0,
          paymenthistory,
        });
      }
  
      // 📋 Fetch paginated customers
      const page = parseInt(pageParam || '1');
      const limit = parseInt(limitParam || '20');
  
     const customers = await prisma.customer.findMany({
  where: {
    username: username,
    NOT: {
      customerName: "NA",
      mobileNo: "0000000000"
    }
  },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

  
      const totalCount = await prisma.customer.count(
        {
          where: {username:username}
        }
      );
  
      return Response.json({
        data: customers,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return Response.json(
        { success: false, message: 'Error fetching customer data' },
        { status: 500 }
      );
    }
  }
  
  export async function POST(req: Request) {
    try {
      const { customerId, amount } = await req.json();
  
      if (!customerId || !amount) {
        return Response.json(
          { success: false, message: "Missing customerId or amount" },
          { status: 400 }
        );
      }
  
      const customer = await prisma.customer.findUnique({
        where: { id: Number(customerId) },
      });
  
      if (!customer) {
        return Response.json(
          { success: false, message: "Customer not found" },
          { status: 404 }
        );
      }
  
      let remainingAmount = amount;
      const updatedInvoices = [];
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          customerId: Number(customerId),
          balanceDue: { gt: 0 },
        },
        orderBy: {
          invoiceDate: "asc",
        },
      });
  
      for (const invoice of unpaidInvoices) {
        if (remainingAmount <= 0) break;
        const balance = invoice.balanceDue - invoice.previousDue;
        const toPay = Math.min(balance, remainingAmount);
        remainingAmount -= toPay;
      
        const newPaidAmount = invoice.paidAmount + invoice.previousDue+ toPay;
        let newBalance = invoice.supertotal-newPaidAmount ;
      
        // 🛡️ Negative balance fix
        newBalance = Math.max(0, newBalance);
      
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            paymentStatus: newBalance <= 0 ? 'paid' : 'due',
          },
        });
      
        updatedInvoices.push(updatedInvoice);
      }
      
  
      // Update customer's overall balance
      const newBalance = Math.max(0, (customer.balance || 0) - amount);
  
      await prisma.customer.update({
        where: { id: Number(customerId) },
        data: {
          balance: newBalance,
        },
      });
  
      // Only ONE record in history, no per-invoice tracking
      const paymentHistory =  await prisma.customerPaymentHistory.create({
        data: {
          customerId: Number(customerId),
          amountPaid: amount,
          remainingDue: newBalance,
          paidAt: new Date(),
        },
      });
  
      return Response.json({
        success: true,
        message: "Payment applied successfully",
        balance: newBalance,
        updatedInvoices,
        paymentHistory: [paymentHistory]
      });
  
    } catch (error) {
      console.error("Payment processing error:", error);
      return Response.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
      );
    }
  }
  