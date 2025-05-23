// app/product/page.tsx (or .jsx)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import StockTable from '@/components/ui/StockTable';
import { StockFormWrapper } from '@/components/ui/InteractiveEmployeePanel ';
import { redirect } from 'next/navigation';
import { MotionDiv } from '@/components/ui/MotionDiv';// We'll create this wrapper for server compatibility

export default async function ProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/api/auth/signin'); // Redirect instead of returning JSON in UI
  }

  const username = session.user.username;
console.log(username);
  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-xl md:text-4xl font-bold text-center  mb-6">
          🛒 Product Catalogue
        </h1>
      </MotionDiv>

      {/* Add New Stock Form Section */}
      <MotionDiv
        className="  p-4 flex flex-col sm:flex-row sm:items-start gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="w-full sm:w-1/2">
          <h2 className="text-lg font-semibold  mb-2">➕ Create Stock</h2>
          <StockFormWrapper username={username} />
        </div>

        {/* Placeholder for optional search/filter */}
        
      </MotionDiv>

      {/* Stock Table Section */}
      <MotionDiv
        className=" shadow-md rounded-xl p-4 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold  mb-4">📦 Inventory Products</h2>
        <StockTable username={username} />
      </MotionDiv>
    </div>
  );
}
