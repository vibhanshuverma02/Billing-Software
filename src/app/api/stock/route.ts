import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

// Create a stock item
export async function POST(req: Request) {
  try {
    const { username, itemName, hsn, rate  , barcode} = await req.json();

    if (!username || !itemName || !hsn || !rate || !barcode) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newStock = await prisma.stock.create({
      data: {
        username,
        itemName,
        hsn,
        rate :Number(rate),
        barcode
      },
    });

    return NextResponse.json({ message: 'Stock item added', newStock }, { status: 201 });
  } catch (error) {
    console.error('Error creating stock:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Fetch stock list
// Updated GET function to support barcode and username actions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");
    const username = searchParams.get("username");

    // ✅ If barcode is passed, return specific item by barcode
    if (barcode) {
      const stockItem = await prisma.stock.findUnique({
        where: { barcode },
      });
     
      if (!stockItem) {
        return NextResponse.json({ message: "Item not found for barcode" }, { status: 404 });
      }

      return NextResponse.json({ stockItem }, { status: 200 });
    }

    // ✅ If username is passed, return all items for user
    if (username) {
      const stockItems = await prisma.stock.findMany({
        where: { username },
      });

      return NextResponse.json({ stockItems }, { status: 200 });
    }

    // ❌ If neither provided
    return NextResponse.json({ message: "Either barcode or username is required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
