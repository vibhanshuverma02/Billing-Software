'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { mutate } from 'swr';
import BarcodeGenerator from './barcodegenrator';

export default function StockForm({ username }: { username: string }) {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const onSubmit = async (data: any) => {
    setLoading(true);
    console.log('Form Data Submitted:', data); // 🟡 Log raw form data

    const payload = {
      ...data,
      barcode: barcodeValue,
      rate: Number(data.rate), // 🟢 Ensure rate is sent as a number
      username,
    };

    console.log('Payload being sent to API:', payload); // 🟡 Log payload

    try {
      const response = await axios.post('/api/stock', payload);
      console.log('API Response:', response.data); // ✅ Log successful response

      mutate(`/api/stock?username=${username}`);
      reset();
      setBarcodeValue('');
    } catch (error: any) {
      console.error('❌ Error adding stock:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto shadow rounded-lg mt-9">
      {/* <h2 className="text-xl font-bold mb-4 text-center">Add New Stock</h2> */}
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Item Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <input {...register('itemName')} placeholder="Item Name" className="border p-2 w-full" required />
          <input {...register('hsn')} placeholder="HSN" className="border p-2 w-full" required />
          <input
            {...register('rate')}
            type="number"
            step="0.01"
            placeholder="Rate"
            className="border p-2 w-full"
            required
          />
          {/* Hidden input for barcode */}
          <input type="hidden" {...register('barcode')} value={barcodeValue} />
          <button disabled={loading} className="bg-white text-black px-4 py-2 rounded w-full">
            {loading ? 'Adding...' : 'Add Stock'}
          </button>
        </form>
  
        {/* Right Column: Barcode Generator */}
        <div className="flex justify-center items-center">
          <BarcodeGenerator barcodeValue={barcodeValue} setBarcodeValue={setBarcodeValue} />
        </div>
      </div>
    </div>
  );
  
}
