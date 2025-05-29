// File: app/api/employees/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options'; // adjust this import path as needed
import { prisma } from '@/config/db';
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'invoice') {
    // Static list for invoice
    const staticEmployees = [
      { name: 'Mamaji' },
      { name: 'Billa Ji' },
      { name: 'MangeRam' },
      { name: 'Golu' },
      { name: 'Mukesh' },
      { name: 'Sanjay' },
    ];

    return NextResponse.json(staticEmployees);
  }

  try {
    // Fetch employees from DB related to the current user
    const employees = await prisma.employee.findMany({
      where: { username: session.user.username },
      select: { id: true, name: true },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('DB error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}