'use client';

import Calendar from 'react-calendar';
import { format, isSameMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import type { AttendanceStatus } from '@prisma/client';

interface AttendanceCalendarProps {
  attendance: { date: Date; status: AttendanceStatus }[];
  month: Date;
  onChange: (date: string, status: AttendanceStatus) => void;
  onSave: () => void;
  changed: boolean;
  loading: boolean;
  onMonthChange: (date: Date) => void;
}

// Helper to get the first 4 Wednesdays of the month
function getFirstFourWednesdays(month: Date): string[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const wednesdays: string[] = [];
  let day = new Date(firstDay);

  while (wednesdays.length < 4 && day.getMonth() === month.getMonth()) {
    if (day.getDay() === 3) { // 3 = Wednesday
      wednesdays.push(format(day, 'yyyy-MM-dd'));
    }
    day.setDate(day.getDate() + 1);
  }

  return wednesdays;
}

export default function AttendanceCalendar({
  attendance,
  month,
  onChange,
  onSave,
  changed,
  onMonthChange,
  loading,
}: AttendanceCalendarProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // Map date strings to their status
  const modifiers = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendance.forEach((a) => {
      const key = format(new Date(a.date), 'yyyy-MM-dd');
      map[key] = a.status;
    });
    return map;
  }, [attendance]);

  // First 4 Wednesdays of the month
  const weekOffs = useMemo(() => new Set(getFirstFourWednesdays(month)), [month]);

  useEffect(() => {
    if (!changed) {
      setActiveDate(null);
    }
  }, [changed]);

  return (
    <div className="mt-4">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-2 px-2">
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ⬅ Previous
        </button>
        <h2 className="text-lg font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next ➡
        </button>
      </div>

      {/* Calendar */}
      <Calendar
        key={month.toISOString()}
        onChange={(value) => {
          const selected = Array.isArray(value) ? value[0] : value;
          if (!selected) return;

          if (!isSameMonth(selected, month)) {
            onMonthChange(new Date(selected.getFullYear(), selected.getMonth(), 1));
            setActiveDate(null);
          } else {
            setActiveDate(format(selected, 'yyyy-MM-dd'));
          }
        }}
        value={month}
        view="month"
        showNavigation={false}
        tileContent={({ date, view }) => {
          if (view !== 'month') return null;

          const dateStr = format(date, 'yyyy-MM-dd');
          const status = modifiers[dateStr];

          let dotColor = '';
          if (weekOffs.has(dateStr)) dotColor = 'bg-blue-500';
          else if (status === 'PRESENT') dotColor = 'bg-green-500';
          else if (status === 'HALF_DAY') dotColor = 'bg-yellow-400';
          else if (status === 'ABSENT') dotColor = 'bg-red-500';

          const isActive = activeDate === dateStr;

          return (
            <div className="flex flex-col items-center mt-1">
              <div
                className={`w-2 h-2 rounded-full ${dotColor} ${weekOffs.has(dateStr) ? '' : 'cursor-pointer'}`}
                onClick={() => {
                  if (!weekOffs.has(dateStr)) {
                    setActiveDate(isActive ? null : dateStr);
                  }
                }}
              />
              {isActive && !weekOffs.has(dateStr) && (
                <div className="flex justify-center mt-1 space-x-1">
                  <span
                    onClick={() => {
                      onChange(dateStr, 'PRESENT');
                      setActiveDate(null);
                    }}
                    className="cursor-pointer text-green-500 text-xs font-bold"
                  >
                    P
                  </span>
                  <span
                    onClick={() => {
                      onChange(dateStr, 'HALF_DAY');
                      setActiveDate(null);
                    }}
                    className="text-yellow-400 text-xs"
                  >
                    H
                  </span>
                  <span
                    onClick={() => {
                      onChange(dateStr, 'ABSENT');
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

      {/* Legend */}
      <div className="flex justify-between text-xs mt-2 text-black-600 flex-wrap gap-2">
        <div>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" /> PRESENT
        </div>
        <div>
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1" /> HALF
        </div>
        <div>
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" /> ABSENT
        </div>
        <div>
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1" /> WEEK OFF (Wed)
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={!changed || loading}
        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          '✅ Save Attendance'
        )}
      </button>
    </div>
  );
}
