import { useState } from 'react';
import axios from 'axios';

const attendanceOptions = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const;
type AttendanceStatus = typeof attendanceOptions[number];

interface EmployeeUpdate {
  name: string;
  status: AttendanceStatus;
}

export default function BulkAttendanceForm() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [updates, setUpdates] = useState<EmployeeUpdate[]>([
    { name: "", status: "PRESENT" },
  ]);

  const handleUpdateChange = (index: number, field: keyof EmployeeUpdate, value: string) => {
    const newUpdates = [...updates];
    newUpdates[index][field] = value as AttendanceStatus;
    setUpdates(newUpdates);
  };

  const addRow = () => {
    setUpdates([...updates, { name: "", status: "PRESENT" }]);
  };

  const removeRow = (index: number) => {
    const newUpdates = updates.filter((_, i) => i !== index);
    setUpdates(newUpdates);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        action: 'dashboard_bulk_update',
        date,
        updates,
      };

      await axios.post("/api/employee", payload, {
        headers: { "Content-Type": "application/json" },
      });

      alert("✅ Attendance updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update attendance");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-2">
      <h2 className="text-s font-bold">Daily Attendance </h2>

      <label className="block">
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-1 ml-2"
        />
      </label>

      {updates.map((update, index) => (
        <div key={index} className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Employee name"
            value={update.name}
            onChange={(e) => handleUpdateChange(index, "name", e.target.value)}
            className="border p-1 flex-1"
          />
          <select
            value={update.status}
            onChange={(e) => handleUpdateChange(index, "status", e.target.value)}
            className="border p-1  bg-black text-white"
          >
            {attendanceOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button onClick={() => removeRow(index)} className="text-red-600">✖</button>
        </div>
      ))}

      <button onClick={addRow} className="bg-black text-white px-3 py-1 rounded">
        ➕ Add Employee
      </button>

      <div>
        <button
          onClick={handleSubmit}
          className="bg-black text-white px-4 py-2 rounded mt-4"
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
}
