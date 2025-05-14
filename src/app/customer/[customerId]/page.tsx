import { getCustomerById } from "@/lib/customerfetch";
import CustomerInvoiceList from "@/components/ui/customerInvoice";

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ customerId: string }>;  // ✅ mark params as Promise
}) {
  const resolvedParams = await params;      // ✅ await params
  const customerId = Number(resolvedParams.customerId);  // ✅ access after await

  if (isNaN(customerId)) {
    throw new Error("Invalid customerId");
  }

  const customer = await getCustomerById(customerId);

  return (
    <div className="p-6 space-y-6">
      {/* Customer Details Card */}
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-4 border">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {customer?.customerName}
          </h2>
          <p className="text-sm text-gray-500">Customer ID: {customer?.id}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-gray-600 text-sm">Mobile Number</h4>
            <p className="text-blue-900 text-xl font-bold">
              {customer?.mobileNo || "N/A"}
            </p>
          </div>

          <div>
            <h4 className="text-gray-600 text-sm">Address</h4>
            <p className="text-gray-600 text-xl font-bold">
              {customer?.address || ""}
            </p>
          </div>

          <div>
            <h4 className="text-gray-600 text-sm">Status</h4>
            <p className="text-blue-600 text-xl font-bold">
              {customer?.status}
            </p>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="bg-white shadow-md rounded-2xl p-6 border">
        <h1 className="text-xl font-bold mb-4">Invoices</h1>
        <CustomerInvoiceList
          customerId={customerId}
          customerName={customer?.customerName || ""}
          mobileNo={customer?.mobileNo || ""}
        />
      </div>
    </div>
  );
}
