// app/your-path/page.tsx (or wherever your main page is)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { NextResponse } from 'next/server';
import EmployeePageClient from '@/components/ui/employeemangemnt';

export default async function ProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const username = session.user.username;

  // Server component renders client component passing username
  return <EmployeePageClient username={username} />;
}
