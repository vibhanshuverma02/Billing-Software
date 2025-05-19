'use client';

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { BarcodePDF } from './BarcodePDF';
import { PDFDownloadLink } from '@react-pdf/renderer';

interface BarcodeGeneratorProps {
  barcodeValue: string;
  setBarcodeValue: (val: string) => void;
}

export default function BarcodeGenerator({ barcodeValue, setBarcodeValue }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeBase64, setBarcodeBase64] = useState('');
  const [count, setCount] = useState('1');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  useEffect(() => {
    if (canvasRef.current && barcodeValue) {
      JsBarcode(canvasRef.current, barcodeValue, {
        format: 'CODE128',
        displayValue: true,
      });

      const base64 = canvasRef.current.toDataURL('image/png');
      setBarcodeBase64(base64);
    } else {
      setBarcodeBase64('');
    }
  }, [barcodeValue]);

  return (
    <div>
      <input
        type="text"
        value={barcodeValue}
        onChange={handleChange}
        placeholder="Enter barcode"
        className="border p-2 w-full"
      />

      {barcodeValue && (
        <div className="mt-2">
          <canvas ref={canvasRef} />
        </div>
      )}

      <input
  type="number"
  min="1"
  value={count}
  onChange={(e) => {
    setCount(e.target.value); // let it be an empty string or any value temporarily
  }}
  className="border p-2 w-full mt-2"
  placeholder="Enter number of copies"
/>

      {barcodeBase64 && (
        <PDFDownloadLink

  document={<BarcodePDF barcodeBase64={barcodeBase64} count={Math.max(1, parseInt(count) || 1)} />}
  


          fileName="barcode.pdf"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2 block text-center"
        >
          {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
        </PDFDownloadLink>
      )}
    </div>
  );
}
