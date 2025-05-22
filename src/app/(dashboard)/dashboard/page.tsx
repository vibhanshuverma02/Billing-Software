"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import BulkAttendanceForm from "@/components/ui/bulk-attendence";
import InvoiceExport from "@/components/ui/excel";
import EmployeeForm from "@/components/ui/employeeform";
import StockForm from "@/components/ui/StockForm";
import DealerForm from "@/components/ui/dealerfrom";
import SessionLogger from "@/components/ui/session_logger";
import AnalyticsChart from "@/components/ui/dailysales";
import { useMediaQuery } from "@/lib/hooks";

export default function Dashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username ?? null;
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleCard = (cardName: string) => {
    setActiveCard(prev => (prev === cardName ? null : cardName));
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
      case "Sales":
        return <AnalyticsChart />;
      default:
        return null;
    }
  };

  return (
    <div className="relative px-4 py-6">
      {/* Overlay */}
      {activeCard && (
  <div className="fixed inset-0 z-30 flex items-start justify-center pt-4 backdrop-blur-sm  animate-scaleUpToTop">
    <div className="flex flex-col items-center  ">
      <img
        src="/images/final2-Photoroom.png"
        alt="KSC Logo"
        className="w-20 h-10 sm:w-60 sm:h-20 object-contain drop-shadow-xl"
      />
      <h1 className="text-xl sm:text-3xl font-bold animate-fadeIn">
        Kukreja Saree Center
      </h1>
    </div>
  </div>
)}


      

      {/* Dynamic Form Modal */}
      <div
  className={`z-50 transition-all duration-300 fixed ${
    activeCard === "Sales"
      ? "inset-0 bg-white overflow-auto p-4"
      : isMobile
      ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl p-4"
      : "w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-2xl shadow-2xl p-4 bottom-0 left-1/2 transform -translate-x-1/2"
  } ${activeCard ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
>

        {renderActiveForm()}
        <button
          onClick={() => setActiveCard(null)}
          className="absolute top-2 right-4 text-gray-500 hover:text-red-500 text-2xl z-50"
          aria-label="Close form"
        >
          ×
        </button>
      </div>

      {/* Logo + Title */}
    {!activeCard && (
  <div className="flex flex-col items-center justify-center  text-center  animate-scaleUpToTop">
    <img
      src="/images/final2-Photoroom.png"
      alt="KSC Logo"
      className="w-40 h-40 sm:w-60 sm:h-60 object-contain drop-shadow-xl "
    />
    <h1 className="text-xl sm:text-3xl font-bold animate-fadeIn">
      Kukreja Saree Center
    </h1>
  

          <p className="text-blue-600 text-sm sm:text-xl font-semibold">
            Select an option below to get started
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div
        className={`grid gap-4 p-4 max-w-5xl mx-auto ${
          isMobile ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-6"
        } ${activeCard ? "backdrop-blur-sm" : ""}`}
      >
        {[
          { key: "attendance", label: "Add Attendance" },
          { key: "invoice", label: "Download Invoice" },
          { key: "stock", label: "Add Stock" },
          { key: "employee", label: "Add Employee" },
          { key: "dealer", label: "Add Dealer" },
          { key: "Sales", label: "Today Sales" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleCard(key)}
            className={`w-full rounded-lg py-3 text-sm font-semibold transition-all duration-300 ${
              activeCard && activeCard !== key
                ? "opacity-30 blur-sm pointer-events-none"
                : "opacity-100"
            } hover:scale-105 hover:shadow-lg hover:bg-blue-100`}
          >
            {activeCard === key ? `Hide ${label.split(" ")[1]}` : label}
          </button>
        ))}
      </div>

      <SessionLogger />
    </div>
  );
}
