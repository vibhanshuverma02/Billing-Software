// components/ui/EmployeeFormWrapper.tsx
"use client";

import { useState } from "react";
import EmployeeForm from "./employeeform";
import StockForm from "./StockForm";

export  function StockFormWrapper({ username }: { username: string }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-2xl mx-auto rounded-lg shadow-sm p-4">
      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {showForm ? "X" : "Add New Stock"}
      </button>

      {showForm && (
        <div className="overflow-y-auto">
       
          <StockForm username={username} />
        </div>
      )}
    </div>
  );
}
export default function EmployeeFormWrapper({ username }: { username: string }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-2xl mx-auto rounded-lg shadow-sm p-4">
      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {showForm ? "X" : "Create New Employee"}
      </button>

      {showForm && (
        <div className="overflow-y-auto">
         
          <EmployeeForm username={username} />
        </div>
      )}
    </div>
  );
}
