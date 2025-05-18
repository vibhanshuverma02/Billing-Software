"use client";
import React from "react";
import InvoicePDF from "@/components/PDF";

interface InvoicePDFWrapperProps {
  invoiceNo: string;
  date: string;
  customerName: string;
  mobileNo: string;
  address: string;
  items: {
    itemName: string;
    hsn: string;
    rate: number;
    quantity: number;
    gstRate: number;
  }[];
  Grandtotal: number;
  gstTotal: number;
  previousBalance: number;
  paidAmount: number;
  balanceDue: number | null;
  paymentStatus: string | null;
}

const ITEM_THRESHOLD = 15;

const InvoicePDFWrapper = (props: InvoicePDFWrapperProps) => {
  const {
    items,
    invoiceNo,
    date,
    customerName,
    mobileNo,
    address,
    Grandtotal,
    gstTotal,
    previousBalance,
    paidAmount,
    balanceDue,
    paymentStatus,
  } = props;

  // Determine page size based on items count
  const pageSize = items.length > ITEM_THRESHOLD ? "A4" : "A5";

  // Alert user if switching to A4 (run only once on mount)
  React.useEffect(() => {
    if (pageSize === "A4") {
      alert(
        `Your items count (${items.length}) exceeds threshold. Switching to A4 page size for better print layout.`
      );
    }
  }, [pageSize, items.length]);

  return (
    <InvoicePDF
      pageSize={pageSize}
      invoiceNo={invoiceNo}
      date={date}
      customerName={customerName}
      mobileNo={mobileNo}
      address={address}
      items={items}
      Grandtotal={Grandtotal}
      gstTotal={gstTotal}
      previousBalance={previousBalance}
      paidAmount={paidAmount}
      balanceDue={balanceDue}
      paymentStatus={paymentStatus}
    />
  );
};

export default InvoicePDFWrapper;
