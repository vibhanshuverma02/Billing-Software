'use client';

import Calendar from 'react-calendar';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';

import axios , { AxiosError }  from 'axios';


interface Attendance {
  id: number;
  date: string;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'SALARY' | 'ADVANCE' | 'DEDUCTION' | 'OTHER';
  date: string;
}

interface Props {
  employee: {
    id: number;
    name: string;
    phone: string;
    baseSalary: number;
    currentBalance: number;
  };
  month: Date; // Format: YYYY-MM
  onMonthChange: (date: Date | undefined) => void;
  onRefresh: () => void; // 🟢 add this
  attendance: Attendance[];
  calculatedSalary: number;
  transactions: Transaction[];
  loading?: boolean;
  workingdays: number;
  absents: number;
  halfdays: number;
  presents: number;
  totaldeductions: number;
  finalSalaryToPay: number;
  carryForward: number;
  loanRemaining: number;
  currentBalance: number;
}

function AddTransaction({ employeeId, selectedMonthDate , onTransactionAdded }: { employeeId: number, selectedMonthDate: Date  , onTransactionAdded: (tx: Transaction, updatedBalance: number , updatedsalary :number, updatededuction:number) => void}) {
  const [type, setType] = useState("ADVANCE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const[ userDate, setUserDate] = useState("")
  const handleSubmit = async () => {
    if (!amount) return alert("Amount is required!");

    const payload = {
      action: "update",
      month: format(selectedMonthDate, 'yyyy-MM'), 
      employeeId, 
      transactions: [
        {
          type,
          amount: parseFloat(amount),
          description,
          date: userDate ? new Date(userDate).toISOString() : new Date().toISOString(), // Use the user-provided date
        },
      ],
    };

    try {
      const res = await axios.post("/api/employee", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
    const finalSalary = res.data.employee.finalSalary;
    const updatedBalance = res.data.employee.updatedBalance;
    console.log("updatebalance : "  ,updatedBalance)
    const newTransaction = res.data.employee.transaction[0];
    const updatededuction = res.data.employee.totalDeduction;
      onTransactionAdded(newTransaction, updatedBalance , finalSalary , updatededuction);
      alert("Transaction added successfully!");
      setAmount("");
      setDescription("");
      setUserDate("");
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert("Failed to add transaction");
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-md font-semibold">➕ Add Transaction</h3>
      <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-2 py-1 w-full">
        <option value="SALARY">Salary</option>
        <option value="ADVANCE">Advance</option>
        <option value="DEDUCTION">Deduction</option>
        <option value="OTHER">Other</option>
      </select>
      <input
  type="date"
  value={userDate}
  onChange={(e) => setUserDate(e.target.value)} // Update userDate state
/>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="border rounded px-2 py-1 w-full"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="border rounded px-2 py-1 w-full"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
      >
        Submit
      </button>
    </div>
  );
}
export default function EmployeeCard({
  employee,
  month, // ✅ controlled from parent as Date
  onMonthChange,
  attendance,
  calculatedSalary,
  transactions,
  workingdays,
  absents,
  halfdays,
  presents,
  finalSalaryToPay,
  loanRemaining,
  totaldeductions,
}: Props) {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);
  const [localBalance, setLocalBalance] = useState<number>(employee.currentBalance);
  const [localsalary, setLocalsalary] = useState<number>(finalSalaryToPay);
  const [localdeducation, setLocaldeduction] = useState<number>(totaldeductions);
  const [localAttendance, setLocalAttendance] = useState<Attendance[]>(attendance);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [localcalculatedsalary, setLocalcalculatedsalary] = useState<number>(calculatedSalary);
  const [didChangeLocally, setDidChangeLocally] = useState(false);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>(attendance);
 
  const handlePrevMonth = () => {
    setDidChangeLocally(false); // 👈 reset so new month attendance can apply
 
    const newDate = subMonths(month, 1);
    onMonthChange(newDate);
  };
  
  const handleNextMonth = () => {
    setDidChangeLocally(false); // 👈 reset before moving
    
    const newDate = addMonths(month, 1);
    onMonthChange(newDate);
  };
  

  function handleAddTransaction(
    newTransaction: Transaction,
    updatedBalance: number,
    updatedsalary: number,
    updatededuction: number
  ) {
    if (localTransactions.length == 0){
      setLocalTransactions([newTransaction]);
    }
    else{
    setLocalTransactions((prev) => [...prev, newTransaction]);
     }
    setLocalBalance(updatedBalance);
    setLocalsalary(updatedsalary);
    setLocaldeduction(updatededuction);
  }

const filteredTransactions = useMemo(() => {
  if (!month || !localTransactions.length) return [];

  return localTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getFullYear() === month.getFullYear() &&
      txDate.getMonth() === month.getMonth()
    );
  });
}, [localTransactions, month]);


  function handleAttendanceChange(date: string, status: "PRESENT" | "HALF_DAY" | "ABSENT") {
    console.log("mein handle triger hua");



    setLocalAttendance((prev) => {
      const index = prev.findIndex((r) => r.date === date);
      if (index !== -1) {
        return prev.map((r) => r.date === date ? { ...r, status } : r);
      } else {
        return [...prev, { id: employee.id, date, status }];
      }
    });
    

    setDidChangeLocally(true);

    console.log("mein end of handelttriger hua");
  }

  const modifiers = useMemo(() => {
    const map: { [dateStr: string]: 'PRESENT' | 'HALF_DAY' | 'ABSENT' } = {};
    localAttendance.forEach((a) => {
      const date = format(new Date(a.date), 'yyyy-MM-dd'); // 🔥 local-safe
      map[date] = a.status;
    });
    return map;
  }, [localAttendance]);
  
  useEffect(() => {
    if (JSON.stringify(localTransactions) !== JSON.stringify(transactions)) {
      setLocalTransactions(transactions);
    }

    if (localBalance !== employee.currentBalance) {
      setLocalBalance(employee.currentBalance);
    }

    if (localsalary !== finalSalaryToPay) {
      setLocalsalary(finalSalaryToPay);
    }

    if (localdeducation !== totaldeductions) {
      setLocaldeduction(totaldeductions);
    }
      
    setLocalcalculatedsalary(calculatedSalary);

   

// /    setLocalAttendance(attendance);
    console.log("masterhu main", attendance ,"month" , month);
  }, [transactions, employee.currentBalance, finalSalaryToPay, totaldeductions]);
async function updateAttendance() {
  console.log("Updating attendance...");  // Check if this log appears
  try {
    const payload = {
      action: 'update_attendence',
      employeeId: employee.id,
      month: format(month, 'yyyy-MM'),
      attendance: localAttendance,
    };
console.log("payload",payload);
    const response = await axios.post('/api/employee', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log("Attendance update successful, response:", response.data);  // Log the response

    setAllAttendance(response.data.attendance); 
    setDidChangeLocally(false);
    setLocalcalculatedsalary(response.data.finalSalary);
    setLocalsalary(response.data.finalSalaryToPay);

    alert("✅ Attendance updated successfully!");  // Ensure this alert gets triggered
  } catch (error) {
    console.error("❌ Failed to update attendance:", error);
    alert("Failed to update attendance");
  }
}


 
  useEffect(() => {
    if (didChangeLocally) return;
 
    setLocalAttendance(allAttendance); // ✅ Clear overwrite
  }, [month, allAttendance]);
  
 
  useEffect(() => {
    setAllAttendance(attendance);
  }, [attendance]);
  
async function handleDeleteTransaction(txId: string) {
  console.log("inisde delete")
  if (!txId) {
    alert("Invalid transaction ID");
    return;
  }
console.log(888)
  
  try {
    console.log("!!!!!")
    const payload = {
      action: "delete_transaction",
      employeeId: employee.id,
      transactionId: txId,
    };

    const res = await axios.post('/api/employee', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log("Response data after delete:", res.data); // Log the response data

    if (res.status === 200) {
      const { updatedBalance, updatedSalary, totalDeduction } = res.data;

      // Update local state after deletion
      
      setLocalTransactions((prev) => prev.filter((tx) => tx.id !== txId));
      setLocalBalance(updatedBalance);
      setLocalsalary(updatedSalary);
      setLocaldeduction(totalDeduction);

      alert("Transaction deleted successfully!");
    } else {
      console.error("Unexpected response:", res);
      alert("Failed to delete transaction. Please try again.");
    }
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>;
    console.error("Error deleting transaction:", axiosError);
    const errorMessage = axiosError.response?.data?.error || "Failed to delete transaction";
    alert(errorMessage);
  }
  
}

return (
  <div className="p-4 border rounded-lg shadow-md flex flex-col gap-6 bg-black text-white max-w-md w-full">
    {/* 👤 Employee Details */}
    <div>
      <h2 className="text-xl font-bold text-black-800 mb-2">👤 Employee Details</h2>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">
          {employee.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-black-900">{employee.name}</p>
          <p className="text-sm text-black-600">📞 {employee.phone}</p>
          <p className="text-sm text-black-600">🧾 Previous Balance: ₹{localBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>

    {/* 📉 Loan & EMI */}
    <div>
      <h2 className="text-xl font-bold text-black-800 mb-2">📉 Loan & EMI</h2>
      <div className="space-y-1">
        <p className="text-sm text-black-600">💳 Loan Remaining: ₹{loanRemaining}</p>
      </div>
    </div>

    {/* 📅 Attendance */}
    <div>
      <h2 className="text-xl font-bold text-black-800 mb-2">📅 Attendance</h2>
      <div className="space-y-1">
        <p className="text-sm text-black-600">📅 Working Days: {workingdays}</p>
        <p className="text-sm text-black-600">❌ Absents: {absents}</p>
        <p className="text-sm text-black-600">🌓 Half Days: {halfdays}</p>
        <p className="text-sm text-black-600">✅ Presents: {presents}</p>
      </div>
    </div>

    {/* 💸 Salaries & Deductions */}
    <div>
      <h2 className="text-xl font-bold text-black-800 mb-2">💸 Salaries & Deductions</h2>
      <div className="space-y-1">
        <p className="text-sm text-black-600">💰 Base Salary: ₹{employee.baseSalary}</p>
        <p className="text-sm text-black-600">🧾 Month Salary: ₹{localcalculatedsalary}</p>
        <p className="text-sm text-black-600">➖ Deductions(advance + previous balance): ₹{localdeducation}</p>
        <p className="text-sm text-black-600">💸 Final Payable: ₹{localsalary}</p>
      </div>
    </div>

    {/* Calendar */}
    <div>
      <div className="flex justify-between items-center mb-2 px-2">
        <button onClick={handlePrevMonth} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          ⬅ Previous
        </button>
        <h2 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <button onClick={handleNextMonth} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          Next ➡
        </button>
      </div>

      <Calendar
        key={month.toISOString()} // Forces re-render when month changes
        onChange={(value) => {
          const selected = Array.isArray(value) ? value[0] : value;
          if (selected) {
            const clickedMonth = selected.getMonth();
            const currentMonth = month.getMonth();

            if (clickedMonth !== currentMonth || selected.getFullYear() !== month.getFullYear()) {
              const newMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
              setDidChangeLocally(false); // reset local flag
              onMonthChange(newMonth); // parent will update month prop
            } else {
              setActiveDate(format(selected, 'yyyy-MM-dd'));
            }
          }
        }}
        value={month}
        view="month"
        showNavigation={false}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null;

          const dateStr = format(date, 'yyyy-MM-dd');
          const status = modifiers[dateStr] ?? 'PRESENT';

          let dotColor = '';
          if (status === 'PRESENT') dotColor = 'bg-green-500';
          else if (status === 'HALF_DAY') dotColor = 'bg-yellow-400';
          else if (status === 'ABSENT') dotColor = 'bg-red-500';

          const isActive = activeDate === dateStr;

          return (
            <div className="flex flex-col items-center mt-1 ">
              <div
                className={`w-2 h-2 rounded-full ${dotColor} cursor-pointer`}
                onClick={() => setActiveDate(isActive ? null : dateStr)}
              />
              {isActive && (
                <div className="flex justify-center mt-1 space-x-1 ">
                  <span
                    onClick={() => {
                      handleAttendanceChange(dateStr, 'PRESENT');
                      setActiveDate(null);
                    }}
                    className="cursor-pointer text-green-500 text-xs font-bold"
                  >
                    P
                  </span>
                  <span
                    onClick={() => {
                      handleAttendanceChange(dateStr, 'HALF_DAY');
                      setActiveDate(null);
                    }}
                    className="text-yellow-400 text-xs"
                  >
                    H
                  </span>
                  <span
                    onClick={() => {
                      handleAttendanceChange(dateStr, 'ABSENT');
                      setActiveDate(null);
                    }}
                    className="text-red-500 text-xs"
                  >
                    A
                  </span>
                </div>
              )}
            </div>
          );
        }}
      />

      <div className="flex justify-between text-xs mt-2 text-black-600">
        <div><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" /> PRESENT</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1" /> HALF</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" /> ABSENT</div>
      </div>

      <button
        onClick={updateAttendance}
        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-white-700 mt-2"
      >
        ✅ Save Attendance
      </button>
    </div>

    {/* Transactions */}
    <div className="mt-4">
      <h3 className="text-md font-semibold">📑 Transactions for {format(month, 'MMMM yyyy')}</h3>
      <table className="w-full table-auto border border-black-300 mt-2">
        <thead>
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((tx, index) => (
            <tr key={`${tx.id}-${tx.date}-${index}`}>
              <td className="p-2">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
              <td className="p-2">{tx.type}</td>
              <td className="p-2">₹{tx.amount}</td>
              <td className="p-2">
                <button
  onClick={(e) => {
    e.stopPropagation(); // Stop propagation just in case
    console.log('🟢 Delete button clicked for ID:', tx.id);
    handleDeleteTransaction(tx.id);
  }}
  className="text-red-500 hover:underline"
>
  Delete
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Add Transaction */}
    <AddTransaction
      employeeId={employee.id}
      selectedMonthDate={month} // now uses parent month
      onTransactionAdded={handleAddTransaction}
    />
  </div>
);
}