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


      
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:justify-center">
        <div className="w-full md:max-w-md mx-auto h-80 overflow-y-auto rounded-lg shadow-sm"> {/* 👈 Reduced size */}
          <EmployeeSearchPage />
        </div>

     <div className="w-full md:max-w-lg mx-auto flex justify-center items-center ">
  <EmployeeFormWrapper username={username} />
</div>

      </div>
    </div>
  );
}