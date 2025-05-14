"use client";

import { useEffect, useState } from "react";

import axios from "axios"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function CustomerInvoiceList({ customerId , customerName, mobileNo }: { customerId: string  , customerName: string , mobileNo: string}) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clearAmount, setClearAmount] = useState('');
  
const [balanceAfterClear, setBalanceAfterClear] = useState<number | null>(null);
const [loading, setLoading] = useState(false);
const [invoiceLoading, setInvoiceLoading] = useState(true); 
const [error, setError] = useState<string | null>(null);

// Track clear balance operations
const [clearBalanceHistory, setClearBalanceHistory] = useState<any[]>([]);


  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setInvoiceLoading(true); // Start loading state
        const res = await axios.get(`/api/customer/invoices`, {
          params: { customerId },
        });
        setInvoices(res.data.invoices);
        setBalanceAfterClear(res.data.balance);
        setClearBalanceHistory(res.data.paymenthistory);
        console.log("Fetched Invoices:", res.data.invoices);
      } catch (error) {
        setError("Failed to fetch invoices. Please try again.");
        console.error("Failed to fetch invoices:", error);
      } finally {
        setInvoiceLoading(false); // End loading state
      }
    };

    fetchInvoices();
  }, [customerId]);

  
  
  const handleClearBalance = async () => {
   

    setLoading(true);
    try {
      const res = await axios.post(`/api/customer/invoices`, {
        customerId,
        amount: parseFloat(clearAmount),
      });
      console.log(res.data.updatedInvoices.pdfUrl);
      
        setBalanceAfterClear(res.data.balance);
        setClearAmount('');
        setInvoices(prev =>
          prev.map(inv => {
            const updated = res.data.updatedInvoices.find((u: { id: number }) => u.id === inv.id);
            return updated ? updated : inv;
          })
        );
      
       
        
         // 👈 updated invoices
        setClearBalanceHistory((prevHistory) => [
          ...prevHistory,
         ...res.data.paymentHistory, // newest atbottom
          
        ]);
    
      
    } catch (err) {
      console.error("Error clearing balance:", err);
      alert("Something went wrong while clearing balance.");
    } finally {
      setLoading(false);
    }
  };
  
  const downloadBase64Pdf = (pdfByteObject: Record<number, number>, fileName = "invoice.pdf") => {
    // Step 1: Convert to Uint8Array
    const byteArray = Uint8Array.from(Object.values(pdfByteObject));
  
    // Step 2: Create a Blob
    const blob = new Blob([byteArray], { type: 'application/pdf' });
  
    // Step 3: Create object URL
    const url = URL.createObjectURL(blob);
  
    // Step 4: Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // Clean up URL
    URL.revokeObjectURL(url);
  };
  
  
  return (
    
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Previous Invoices</h2>
      <div className="rounded-md border">
        {invoiceLoading ? (
          <div className="text-center py-4">Loading invoices...</div>
        ) : error ? (
          <div className="text-red-500 py-4 text-center">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Amount of invoice</TableHead>
                <TableHead>Previous Balance Due</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Invoice URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>₹{invoice.totalAmount}</TableCell>
                  <TableCell>₹{invoice.previousDue}</TableCell>
                  <TableCell>₹{invoice.supertotal}</TableCell>
                  <TableCell>₹{invoice.paidAmount}</TableCell>
                  <TableCell>₹{invoice.refund}</TableCell>
                  <TableCell>₹{invoice.balanceDue}</TableCell>
                  <TableCell>{invoice.paymentStatus}</TableCell>
                  <TableCell>
  {invoice.pdfUrl ? (
    <button
      onClick={() => downloadBase64Pdf(invoice.pdfUrl, `invoice_${invoice.invoiceNo}.pdf`)}
      className="text-blue-500 hover:underline"
    >
      Download
    </button>
  ) : (
    <span className="text-gray-400">N/A</span>
  )}
</TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      <h2 className="font-semibold text-gray-700 mt-6">Clear Customer Balance</h2>
      <div className="mt-2 flex flex-wrap gap-4 items-center">
        <input
          type="number"
          placeholder="Enter amount to clear"
          value={clearAmount}
          onChange={(e) => setClearAmount(e.target.value)}
          className="border px-3 py-2 rounded w-40"
        />
        <button
          onClick={handleClearBalance}
          disabled={loading || !clearAmount}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Clearing..." : "Clear Balance"}
        </button>
        {balanceAfterClear !== null && (
          <p className="text-green-600 font-semibold ml-4">
            Balance Due: ₹{balanceAfterClear.toLocaleString()}
          </p>
        )}
        <Link
  href={{
    pathname: "/test",
    query: {
      customerName: customerName,
      mobileNo: mobileNo,
    },
  }}
  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
>
  Generate Invoice
</Link>

      </div>
 {/* Payment History Table */}
<h2 className="text-xl font-semibold mt-8 mb-4">Payment History</h2>
<div className="rounded-md border overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>#</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Amount Paid</TableHead>
        <TableHead>Remaining Due</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {clearBalanceHistory.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
            No payment history found.
          </TableCell>
        </TableRow>
      ) : (
        clearBalanceHistory.map((entry, index) => (
          <TableRow key={entry.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{new Date(entry.paidAt).toLocaleDateString()}</TableCell>
            <TableCell>₹{entry.amountPaid}</TableCell>
            <TableCell>₹{entry.remainingDue}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>

      
    </div>
  );
}