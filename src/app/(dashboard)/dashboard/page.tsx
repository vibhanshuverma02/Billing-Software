"use client";

import { useState } from "react";
import BulkAttendanceForm from "@/components/ui/bulk-attendence";
import InvoiceExport from "@/components/ui/excel";
import EmployeeForm from "@/components/ui/employeeform";
import StockForm from "@/components/ui/StockForm";
import { useSession } from "next-auth/react";
import DealerForm from "@/components/ui/dealerfrom";
import SessionLogger from "@/components/ui/session_logger";

export default function Dashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username ?? null;

  const [activeCard, setActiveCard] = useState<null | string>(null);

  const toggleCard = (cardName: string) => {
    setActiveCard((prev) => (prev === cardName ? null : cardName));
  };

  const renderActiveForm = () => {
    switch (activeCard) {
      case "attendance":
        return <BulkAttendanceForm />;
      case "invoice":
        return <InvoiceExport />;
      case "stock":
        return <StockForm username={username} />;
      case "employee":
        return <EmployeeForm username={username} />;
      case "dealer":
        return <DealerForm />;
      default:
        return null;
    }
  };

  return (
    <>
    {/* Blur Background Overlay */}
  {activeCard && (
    <div className="fixed inset-0 z-30 backdrop-blur-sm bg-black/30 transition-opacity duration-300" />
  )}

      {/* Form Section */}
     <div
  className={`z-50 w-full max-w-md sm:max-w-sm max-h-[80vh] overflow-y-auto rounded-t-2xl shadow-2xl  p-4 transition-all duration-300 fixed bottom-20 left-1/2 transform -translate-x-1/2 ${
    activeCard ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
  }`}
>

        {renderActiveForm()}
        <button
          onClick={() => setActiveCard(null)}
          className="absolute top-2 right-4 text-gray-500 hover:text-red-500 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Bottom Sticky Cards Grid */}
      <div
        className={`fixed bottom-0 left-0 w-full  shadow-inner border-t border-gray-200 z-40 transition-all duration-300 ${
          activeCard ? "backdrop-blur-md" : ""
        }`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2">
          <button
            onClick={() => toggleCard("attendance")}
            className={`rounded-lg py-3 text-sm font-semibold transition-all ${
              activeCard && activeCard !== "attendance"
                ? "opacity-30 blur-sm"
                : ""
            }`}
          >
            {activeCard === "attendance"
              ? "Hide Attendance"
              : "Add Attendance"}
          </button>

          <button
            onClick={() => toggleCard("invoice")}
            className={`rounded-lg py-3 text-sm font-semibold transition-all ${
              activeCard && activeCard !== "invoice" ? "opacity-30 blur-sm" : ""
            }`}
          >
            {activeCard === "invoice" ? "Hide Invoice" : "Download Invoice"}
          </button>

          <button
            onClick={() => toggleCard("stock")}
            className={`rounded-lg py-3 text-sm font-semibold transition-all ${
              activeCard && activeCard !== "stock" ? "opacity-30 blur-sm" : ""
            }`}
          >
            {activeCard === "stock" ? "Hide Stock" : "Add Stock"}
          </button>

          <button
            onClick={() => toggleCard("employee")}
            className={`rounded-lg py-3 text-sm font-semibold transition-all ${
              activeCard && activeCard !== "employee" ? "opacity-30 blur-sm" : ""
            }`}
          >
            {activeCard === "employee" ? "Hide Employee" : "Add Employee"}
          </button>

          <button
            onClick={() => toggleCard("dealer")}
            className={`rounded-lg py-3 text-sm font-semibold transition-all ${
              activeCard && activeCard !== "dealer" ? "opacity-30 blur-sm" : ""
            }`}
          >
            {activeCard === "dealer" ? "Hide Dealer" : "Add Dealer"}
          </button>
        </div>
      </div>

      <SessionLogger />
    </>
  );
}
