import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';

type PayloadItem = { value: number; [key: string]: unknown };

type SelectedDayInvoice = {
  id: number;
  time: string;
  url: string; // base64 PDF data
  salesperson: string;
  total: number;
};

type AnalyticsSummary = {
  totalSales: number;
  invoiceCount: number;
  startDate: string;
  endDate: string;
  dailySales: Record<string, number>;
};

type ChartDataPoint = { date: string; sales: number };

const formatINR = (value: number | null | undefined) => {
  if (typeof value !== 'number' || isNaN(value)) return '₹0.00';
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#2c2c2c',
        color: '#fff',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        boxShadow: '0 0 8px rgba(0,0,0,0.3)'
      }}>
        <p>{format(parseISO(label!), 'eee, MMM d, yyyy')}</p>
        <p>Sales: {formatINR(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const downloadBase64Pdf = (base64Data: string, fileName = "invoice.pdf") => {
  const base64 = base64Data.split(',').pop() || base64Data;
  const byteCharacters = atob(base64);
  const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
  const byteArray = new Uint8Array(byteNumbers);
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
const handleDownload = async (invoiceId: number) => {
  try {
    const res = await axios.get<{ url: string }>(`/api/analytics/invoices`, {
      params: { id: invoiceId },
    });

    const pdfBase64 = res.data.url; // updated to match the backend key
    console.log(pdfBase64);

    if (pdfBase64) {
      downloadBase64Pdf(pdfBase64, `invoice-${invoiceId}.pdf`);
    } else {
      alert("PDF not found for this invoice");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to download PDF");
  }
};



const AnalyticsChart: React.FC = () => {
  const [type, setType] = useState<'thisWeek' | 'prevWeek' | 'custom'>('thisWeek');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayInvoices, setDayInvoices] = useState<SelectedDayInvoice[] | null>(null);
  const [loading, setLoading] = useState(false);


const fetchSummary = async () => {
  const params: Record<string, string> = { type };

  if (type === 'custom') {
    // Only send if both dates are provided
    if (customStart && customEnd) {
      params.start = customStart;
      params.end = customEnd;
    } else {
      // Don't call API if either date is missing
      setSummary(null);
      return;
    }
  }

  try {
    setLoading(true);
    const res = await axios.get<AnalyticsSummary>('/api/analytics/summary', { params });
    setSummary(res.data);
  } catch (err) {
    console.error(err);
    setSummary(null);
  } finally {
    setLoading(false);
  }
};


  const fetchDayInvoices = async (date: string) => {
    try {
      setLoading(true);
      const res = await axios.get<{ invoices: SelectedDayInvoice[] }>(`/api/analytics/invoices`, {
        params: { day: date }
      });
      setDayInvoices(res.data.invoices);
    } catch (err) {
      console.error(err);
      setDayInvoices(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = (payload: { date: string; sales: number }) => {
    setSelectedDate(payload.date);
  };

  useEffect(() => {
    fetchSummary();
    setDayInvoices(null);
    setSelectedDate('');
  }, [type, customStart, customEnd]);

  useEffect(() => {
    if (selectedDate) fetchDayInvoices(selectedDate);
  }, [selectedDate]);

  
  const chartData: ChartDataPoint[] = summary
    ? Object.entries(summary.dailySales).map(([date, sales]) => ({ date, sales }))
    : [];

  const selectedDayTotal = dayInvoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;
 
const [expandedSalesperson, setExpandedSalesperson] = useState<string | null>(null);

const groupedBySalesperson = dayInvoices?.reduce<Record<string, SelectedDayInvoice[]>>((acc, inv) => {
  if (!acc[inv.salesperson]) acc[inv.salesperson] = [];
  acc[inv.salesperson].push(inv);
  return acc;
}, {}) || {};


  return (
    <div style={{ padding: '1rem' }}>
      <h2 className="text-xl font-semibold mb-4 text-black">Sales Analytics</h2>

      <div className="mb-4">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as any);
            setSelectedDate('');
          }}
          className="p-2 rounded-md border mr-2 text-black"
        >
          <option value="thisWeek">This Week</option>
          <option value="prevWeek">Previous Week</option>
          <option value="custom">Custom Range</option>
        </select>

        {type === 'custom' && (
  <>
   <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setSelectedDate('');
              }}
              className="p-2 border rounded text-black"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setSelectedDate('');
              }}
              className="p-2 border rounded text-black"
            />

  </>
)}

{/* Disable day select if start or end date is missing */}
{/* {type === 'custom' && customStart && customEnd && (
  <div className="mb-4">
    <label className="mr-2 font-medium text-black">Select Day:</label>
    <input
      type="date"
      className="p-1 border rounded text-black"
      value={selectedDate}
      min={customStart}
      max={customEnd}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  </div>
)} */}

      </div>

      {/* {type === 'custom' && customStart && customEnd && (
        <div className="mb-4">
          <label className="mr-2 font-medium text-black">Select Day:</label>
          <input
            type="date"
            className="p-1 border rounded text-black"
            value={selectedDate}
            min={customStart}
            max={customEnd}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      )} */}

      {loading && <p className="text-gray-600">Loading...</p>}

      {!loading && summary && (
        <>
          <div className="mb-4 text-black">
            <strong>Total Sales:</strong> {formatINR(selectedDate ? selectedDayTotal : summary.totalSales)} |{' '}
            <strong>Invoices:</strong> {selectedDate ? (dayInvoices?.length || 0) : summary.invoiceCount}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => format(parseISO(date), 'EEE')} />
              <YAxis tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="sales"
                fill="#ff9800"
                radius={[6, 6, 0, 0]}
                onClick={(data) => {
                  const payload = (data as any)?.payload;
                  if (payload?.date) {
                    handleBarClick({ date: payload.date, sales: payload.sales });
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {!loading && dayInvoices && selectedDate && (
  <div className="mt-6 text-black">
    <h3 className="font-semibold text-lg mb-2">
      Invoices on {format(parseISO(selectedDate), 'eeee, MMM d, yyyy')}
    </h3>
    {dayInvoices.length === 0 ? (
      <p>No invoices found.</p>
    ) : (
      <>
        {Object.entries(groupedBySalesperson).map(([salesperson, invoices]) => (
          <div key={salesperson} className="mb-4">
            <button
              onClick={() =>
                setExpandedSalesperson((prev) =>
                  prev === salesperson ? null : salesperson
                )
              }
              className="font-medium text-left text-black hover:underline"
            >
              {salesperson} — {invoices.length} invoice
              {invoices.length > 1 ? 's' : ''}
            </button>

            {expandedSalesperson === salesperson && (
              <ul className="list-disc ml-6 mt-2 text-black">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    
                    <button
  onClick={() => handleDownload(inv.id)}
  className="text-blue-700 underline ml-2"
>
  Download
</button>

                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </>
    )}
  </div>
)}

    </div>
  );
};

export default AnalyticsChart;
