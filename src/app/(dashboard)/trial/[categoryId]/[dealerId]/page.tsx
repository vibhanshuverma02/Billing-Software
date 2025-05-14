"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Bill {
  id: string;
  date: string;
  chequeNo?: string;
  uniqueNo?: string;
  totalAmount: number;
  less: number;
  pdfBase64?: Record<number, number>;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  chequeNo?: string;
  uniqueNo?: string;
}

interface Dealer {
  name: string;
  contact: string;
  address: string;
  bills: Bill[];
  payments: Payment[];
}

export default function PurchaseMangentPage() {
  const { dealerId, categoryId } = useParams<{ dealerId: string; categoryId: string }>();
 console.log(dealerId)
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching dealer for", dealerId, categoryId);

    const fetchDealer = async () => {
      try {
        const res = await axios.get("/api/dealer", {
          params: { dealerId, categoryId },
        });
        console.log("API Response:", res.data);
        setDealer({ ...res.data.dealer});
           console.log(res.data.dealer.pdfBase64);

      } catch (error) {
        console.error("Error fetching dealer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealer();
  }, [dealerId, categoryId]);

  if (loading) return <p>Loading...</p>;
  if (!dealer) return <p>No dealer data</p>;


 const downloadPdfHelper = (data: Record<number, number> | string, fileName = "bill.pdf") => {
  let byteArray: Uint8Array;

  if (typeof data === "string") {
    // Base64 string → decode
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    byteArray = new Uint8Array(byteNumbers);
  } else {
    // Assume it's Record<number, number> like { 0: 37, 1: 80, ... }
    byteArray = Uint8Array.from(Object.values(data));
  }

  console.log("First 10 bytes for sanity check:", byteArray.slice(0, 10)); // Should start with [37,80,68,70,...]

  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  if (loading) return <div className="py-6 text-center">Loading...</div>;
  if (error) return <div className="text-red-500 py-6 text-center">{error}</div>;
  console.log("Dealer state:", dealer);  // Check if dealer is set
  if (!dealer) return <div className="py-6 text-center">Dealer not found.</div>;

    return (
    <div className="min-h-screen   overflow-x-hidden">
      <div className="mt-6 px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Dealer Card */}
 <div className="mt-15 mb-6 mx-4 p-3 w-screen  shadow-sm bg-blur overflow-x-auto">
  
          <h2 className="text-2xl font-bold mb-2">{dealer.name}</h2>
          <p className="text-gray-600 mb-1">Contact: {dealer.contact}</p>
          <p className="text-gray-600">Address: {dealer.address}</p>
        </div>

        {/* Bills Table */}
        <div className="mb-6 mx-4 p-3 w-screen ">
          <h3 className="text-xl font-semibold mb-2">Bills</h3>
          <div className="rounded-md border overflow-x-auto">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Cheque No</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Less</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dealer.bills?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                        No bills found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dealer.bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                        <TableCell>{bill.id}</TableCell>
                        <TableCell>{bill.chequeNo || "N/A"}</TableCell>
                        <TableCell>{bill.uniqueNo || "N/A"}</TableCell>
                        <TableCell>₹{bill.totalAmount}</TableCell>
                        <TableCell>₹{bill.less}</TableCell>
                        <TableCell>
                          {bill.pdfBase64 ? (
                            <button
                              onClick={() =>
                                downloadPdfHelper(bill.pdfBase64!, `bill_${bill.id}.pdf`)
                              }
                              className="text-blue-500 hover:underline"
                            >
                              Download
                            </button>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="mb-6 mx-4  p-3 w-screen ">
          <h3 className="text-xl font-semibold mb-2">Payments</h3>
          <div className="rounded-md border overflow-x-auto">
            <div className="min-w-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cheque No</TableHead>
                    <TableHead>Bill No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dealer.payments?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                        No payment history.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dealer.payments.map((p, index) => (
                      <TableRow key={p.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{p.amount}</TableCell>
                        <TableCell>{p.chequeNo || "N/A"}</TableCell>
                        <TableCell>{p.uniqueNo || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}