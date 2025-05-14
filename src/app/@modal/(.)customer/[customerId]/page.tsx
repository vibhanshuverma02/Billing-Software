
import { Modal } from "./model";
// import React from 'react';
import { getCustomerById } from '@/lib/customerfetch';


// import CustomerInvoiceList from '@/components/ui/customerInvoice';

export default async function PhotoModal({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const photocustomerId = (await params).customerId;
  const customer = await getCustomerById(photocustomerId);
  // const pdfurl = customer?.pdfUrl?.toLocaleString()
  
  console.log("222")
  return (
    <Modal>
      <div className="p-6 space-y-6">
        {/* Customer Detail Card */}
        {/* <div className="bg-white shadow-md rounded-2xl p-4 space-y-4 border"> */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-xs">
               {customer?.customerName}</h2>

            <p className="text-sm text-gray-500">Customer ID: {customer?.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-gray-600 text-sm">Mobile Number</h4>
              <p className="text-blue-900 text-xl font-bold">
                {customer?.mobileNo || "N/A"}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-gray-600 text-sm">Address</h4>
              <p className="text-gray-600 text-xl font-bold">
                {customer?.address || ""}
              </p>
            </div>

            <div className="space-y-1 col-span-2">
              <h4 className="text-gray-600 text-sm">Balance Due</h4>
              <p className="text-blue-600 text-xl font-bold">
                ₹{customer?.balance?.toLocaleString()}
              </p>

              <h5 className="text-gray-600 text-sm">Status</h5>
              <h5 className="text-blue-600 text-xl font-bold">
                {customer?.status || "N/A"}
              </h5>
            </div>

          <div>
            <a
              href={`/customer/${photocustomerId}`}
              className="inline-block mt-4 bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600"
            >
              View Profile
            </a>
          </div>
          </div>

        </div>
      {/* </div> */}
    </Modal>
  );
}