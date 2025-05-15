import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import EmployeeSearchPage from '@/components/ui/employeedetail';
import EmployeeFormWrapper from '@/components/ui/InteractiveEmployeePanel '; // 👈 New Client Component
import { NextResponse } from 'next/server';

export default async function ProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const username = session.user.username;

   return (
    <div className="p-4">
  <h1 className="text-2xl font-bold text-center mt-10">Search Employee</h1>

      
      <div className="w-full flex flex-col items-center">
  <div className="w-full md:max-w-lg">
    <EmployeeSearchPage />
  </div>

  <h3 className="my-4 text-center">Or</h3>

  <div className="w-full md:max-w-lg mx-auto flex justify-center">
    <EmployeeFormWrapper username={username} />
  </div>
</div>
</div>
  );
}