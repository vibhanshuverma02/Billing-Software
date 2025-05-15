import { format, isSameMonth } from 'date-fns';
import { Attendance, Transaction, AttendanceStatus } from '@prisma/client';

export interface State {
  attendance: Attendance[];
  allAttendance: Attendance[];
  transactions: Transaction[];
  balance: number;
  salary: number;
  calculatedSalary: number;
  deductions: number;
  month: Date;
  changed: boolean;
  presents: number;
  absents: number;
  halfdays: number;
  workingdays: number;
}

export type Action =
  | { type: 'SET_MONTH'; payload: Date }
  | { type: 'SET_INITIAL_DATA'; payload: Partial<State> }
  | { type: 'UPDATE_ATTENDANCE'; payload: { date: string; status: AttendanceStatus } }
  | { type: 'SAVE_ATTENDANCE_SUCCESS'; payload: { attendance: Attendance[]; salary: number; finalSalary: number; presents: number; absents: number; halfdays: number; workingdays: number } }
  | { type: 'ADD_TRANSACTION'; payload: { transaction: Transaction; balance: number; salary: number; deductions: number } }
  | { type: 'DELETE_TRANSACTION'; payload: { id: number; balance: number; salary: number; deductions: number } };

// ✅ Helper to filter attendance by selected month
function filterMonthAttendance(att: Attendance[], month: Date): Attendance[] {
  return att.filter((a) => isSameMonth(new Date(a.date), month));
}

// ✅ Initial state function
export const initialState = (props: {
  attendance: Attendance[];
  transactions: Transaction[];
  employee: { currentBalance: number };
  calculatedSalary: number;
  totaldeductions: number;
  finalSalaryToPay: number;
  month: Date;
  workingdays: number;
  presents: number;
  absents: number;
  halfdays: number;
}): State => {
  return {
    attendance: filterMonthAttendance(props.attendance, props.month),
    allAttendance: props.attendance,
    transactions: props.transactions,
    balance: props.employee.currentBalance,
    salary: props.finalSalaryToPay,
    calculatedSalary: props.calculatedSalary,
    deductions: props.totaldeductions,
    month: props.month,
    changed: false,
    presents: props.presents,
    absents: props.absents,
    halfdays: props.halfdays,
    workingdays: props.workingdays,
  };
};

// ✅ Reducer
export function employeeReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MONTH': {
      const attendance = filterMonthAttendance(state.allAttendance, action.payload);
      return {
        ...state,
        month: action.payload,
        attendance,
        changed: false,
      };
    }

    case 'SET_INITIAL_DATA': {
      const att = action.payload.attendance ?? [];
      const attendance = filterMonthAttendance(att, state.month);
      return {
        ...state,
        ...action.payload,
        allAttendance: att,
        attendance,
        changed: false,
      };
    }

    case 'UPDATE_ATTENDANCE': {
      const updated = [...state.attendance];
      const index = updated.findIndex(
        (r) => format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(action.payload.date), 'yyyy-MM-dd')
      );

      if (index !== -1) {
        updated[index] = { ...updated[index], status: action.payload.status };
      } else {
        updated.push({
          id: 0,
          employeeId: 0, // Should be filled properly from API if needed
          date: new Date(action.payload.date),
          status: action.payload.status,
        });
      }

      // Optionally recalculate local stats (fallback only)
      return {
        ...state,
        attendance: updated,
        changed: true,
      };
    }

    case 'SAVE_ATTENDANCE_SUCCESS': {
      const filtered = filterMonthAttendance(action.payload.attendance, state.month);
      return {
        ...state,
        allAttendance: action.payload.attendance,
        attendance: filtered,
        calculatedSalary: action.payload.finalSalary,
        salary: action.payload.salary,
        changed: false,
        presents: action.payload.presents,
        absents: action.payload.absents,
        halfdays: action.payload.halfdays,
        workingdays: action.payload.workingdays,
      };
    }

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload.transaction],
        balance: action.payload.balance,
        salary: action.payload.salary,
        deductions: action.payload.deductions,
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.payload.id),
        balance: action.payload.balance,
        salary: action.payload.salary,
        deductions: action.payload.deductions,
      };

    default:
      return state;
  }
}
