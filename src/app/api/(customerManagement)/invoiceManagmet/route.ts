import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/config/db';

export async function POST(req: Request) {
  try {
    const { pdfData, customerId , customerName} = await req.json();

    if (!pdfData || !customerId || customerName) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    // ✅ Save PDF file locally
    const pdfPath = path.join(process.cwd(), 'public/invoices', `${customerName}.pdf`);
    fs.writeFileSync(pdfPath, Buffer.from(pdfData, 'base64'));

    const pdfUrl = `/invoices/${customerName}.pdf`;

    // ✅ Save PDF URL in the database
    await prisma.customer.update({
      where: { id: customerId },
      data: { pdfUrl: pdfUrl }
    });

    return NextResponse.json({ message: "PDF saved", pdfUrl });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
