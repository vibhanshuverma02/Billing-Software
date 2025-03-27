import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

// Create a stock item
export async function POST(req: Request) {
  try {
    const { username, itemName, hsn, rate } = await req.json();

    if (!username || !itemName || !hsn || !rate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newStock = await prisma.stock.create({
      data: {
        username,
        itemName,
        hsn,
        rate,
      },
    });

    return NextResponse.json({ message: 'Stock item added', newStock }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Fetch stock list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    const stockItems = await prisma.stock.findMany({
      where: { username },
    });

    return NextResponse.json({ stockItems }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
