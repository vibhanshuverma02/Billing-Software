import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';  // ← swap this in
import EmployeePageClient from '@/components/ui/employeemangemnt';

export default async function ProductPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');  // ← and this
  }

  const username = session.user.username;
  return <EmployeePageClient username={username} />;
}