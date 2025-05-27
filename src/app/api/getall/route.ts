// File: app/api/employees/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options'; // adjust this import path as needed

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Static list of employees
  const employees = [
    { name: 'Mamaji' },
    {  name: 'Billa Ji' },
    {  name: 'Manga Ram' },
    {  name: 'Chhotu Lal' },
    {  name: 'Rajesh' },
    { name: 'Gyani Devi' },
  ];

  return NextResponse.json(employees);
}
