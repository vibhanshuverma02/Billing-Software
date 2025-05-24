import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
 XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// Types


type PayloadItem = {
  value: number;
  [key: string]: unknown; // allow extra fields if needed
};

type AnalyticsResponse = {
  totalSales: number;
  totalDue: number;
  invoiceCount: number;
  startDate: string;
  endDate: string;
  dailySales: Record<string, number>;
  invoicesBySalesperson: {
    invoiceDate: string;
    salesperson: string;
    count: number;
  }[];
};


type ChartDataPoint = {
  date: string;
  sales: number;
};

const formatINR = (value: number) => {
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

const AnalyticsChart: React.FC = () => {
  const [type, setType] = useState<'thisWeek' | 'prevWeek' | 'custom'>('thisWeek');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (type === 'custom' && (!customStart || !customEnd)) return;

    const params: Record<string, string> = { type };
    if (type === 'custom') {
      params.start = customStart;
      params.end = customEnd;
    }

    setLoading(true);
    axios.get<AnalyticsResponse>('/api/analytics', { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [type, customStart, customEnd]);

  const chartData: ChartDataPoint[] = data
    ? Object.entries(data.dailySales).map(([date, sales]) => ({ date, sales }))
    : [];

  return (
    <div style={{
     
      minHeight: '100vh',
      padding: '1rem',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }} className='text-black'>Sales Analytics</h2>

      <div style={{ marginBottom: '1rem' }}  className='text-black'>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'thisWeek' | 'prevWeek' | 'custom')}
          style={{ marginRight: 12, padding: '0.5rem', borderRadius: '0.5rem' }}
        >
          <option value="thisWeek">This Week</option>
          <option value="prevWeek">Previous Week</option>
          <option value="custom">Custom Range</option>
        </select>

        {type === 'custom' && (
          <>
            <label style={{ marginRight: 8 }}>
              Start Date:
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={customEnd || undefined}
                style={{ marginLeft: 4 }}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart || undefined}
                style={{ marginLeft: 4 }}
              />
            </label>
          </>
        )}

       
      </div>

      {loading && <p>Loading...</p>}

      {!loading && data && (
        <div style={{
          
          borderRadius: '1rem',
          padding: '1.5rem',
         
          marginBottom: '2rem'
        }}>
         <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
  {/* Sales summary */}
  <div style={{ flex: 1, minWidth: '250px', color: 'black' }}>
    <strong>This week Sales :</strong> {formatINR(data.totalSales)} |{' '}
    <strong>Invoices:</strong> {data.invoiceCount}
  </div>

  {/* Daily invoices per salesperson */}
  {data.invoicesBySalesperson && data.invoicesBySalesperson.length > 0 && (
    <div style={{ flex: 2, minWidth: '350px', color: 'black' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Daily Invoices Per Salesperson
      </h3>
      {Object.entries(
        data.invoicesBySalesperson.reduce<Record<string, { salesperson: string; count: number }[]>>(
          (acc, curr) => {
            if (!acc[curr.invoiceDate]) acc[curr.invoiceDate] = [];
            acc[curr.invoiceDate].push({ salesperson: curr.salesperson, count: curr.count });
            return acc;
          },
          {}
        )
      ).map(([date, entries]) => (
        <div key={date} style={{ marginBottom: '0.75rem' }}>
          <strong>{format(parseISO(date), 'MMM d, yyyy')}:</strong>
          <ul style={{ paddingLeft: '1rem' }}>
            {entries.map((entry, idx) => (
              <li key={idx}>
                {entry.salesperson || 'Unknown'}: {entry.count} invoice{entry.count > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )}
</div>


          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3"  />
              <XAxis
                dataKey="date"
                
                tickFormatter={(dateStr) => format(parseISO(dateStr), 'eee')}
              />
              <YAxis
               
                tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" fill="#ff9800" radius={[6, 6, 0, 0]} />
            </BarChart>
            
          </ResponsiveContainer>
          
        </div>
      )}

      {!loading && !data && (
        <p>No data available. Please select a valid date range.</p>
      )}
    </div>
  );
};

export default AnalyticsChart;
