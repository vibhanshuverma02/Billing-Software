import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import StockTable from '@/components/ui/StockTable';
import { StockFormWrapper } from '@/components/ui/InteractiveEmployeePanel '; // ✅ wrapper
import { NextResponse } from 'next/server';

export default async function ProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const username = session.user.username;

  return (
    <div className="p-4 space-y-4">
      {/* Add New Stock button at top-left */}
      
      <div className="w-full flex items-start  ">
  <div className="ml-4">
    <StockFormWrapper username={username} />
  </div>
</div>


      {/* Stock Table as main content */}
      <h1 className="text-3xl font-bold item-center text-center mb-4">Product Catalogue</h1>
      <div>
        <StockTable username={username} />

      </div>
    </div>
  );
}
