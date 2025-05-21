"use client";

import { useState, useEffect, useRef } from "react";
import { Scanner, useDevices, outline, boundingBox, centerText } from "@yudiel/react-qr-scanner";
import { fetchStockItemFromBarcode, StockItem } from "./barcode";

interface Props {
  onSelect: (item: StockItem) => void;
}

export default function ScannerPage({ onSelect }: Props) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [tracker, setTracker] = useState<string>("centerText");
  const [pause, setPause] = useState(true); // Start paused, scanner hidden
  const [expanded, setExpanded] = useState(false); // controls if scanner is expanded/full-size

  const devices = useDevices();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  function getTracker() {
    switch (tracker) {
      case "outline":
        return outline;
      case "boundingBox":
        return boundingBox;
      case "centerText":
        return centerText;
      default:
        return undefined;
    }
  }

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setPause(true);
      setExpanded(false); // collapse scanner on inactivity
      console.log("Paused due to inactivity");
    }, 10000);
  };

  const handleScan = async (barcode: string) => {
    resetInactivityTimer();
    setPause(true);
    setExpanded(false);

    const item = await fetchStockItemFromBarcode(barcode);
    if (item) {
      onSelect(item);
    } else {
      alert("Item not found for scanned barcode.");
    }
    setPause(false);
    setExpanded(true);
  };

  useEffect(() => {
    if (!pause) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [pause]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Toggle Scanner Button for mobile */}
      {!expanded && (
        <button
          onClick={() => {
            setPause(false);
            setExpanded(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition"
        >
          Open Scanner
        </button>
      )}

      {/* Controls - show only when expanded */}
      {expanded && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md">
          <select
            onChange={(e) => setDeviceId(e.target.value)}
            className="border rounded px-3 py-1 w-full sm:w-auto"
            value={deviceId}
          >
            <option value="">Select a device</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => setTracker(e.target.value)}
            className="border rounded px-3 py-1 w-full sm:w-auto"
            value={tracker}
          >
            <option value="centerText">Center Text</option>
            <option value="outline">Outline</option>
            <option value="boundingBox">Bounding Box</option>
          </select>
          <button
            onClick={() => {
              setPause(true);
              setExpanded(false);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Close Scanner
          </button>
        </div>
      )}

      {/* Scanner with overlay */}
      {expanded && (
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-md overflow-hidden shadow-lg">
          <Scanner
            formats={[
              "qr_code",
              "micro_qr_code",
              "rm_qr_code",
              "maxi_code",
              "pdf417",
              "aztec",
              "data_matrix",
              "matrix_codes",
              "dx_film_edge",
              "databar",
              "databar_expanded",
              "codabar",
              "code_39",
              "code_93",
              "code_128",
              "ean_8",
              "ean_13",
              "itf",
              "linear_codes",
              "upc_a",
              "upc_e",
            ]}
            constraints={{ deviceId }}
            onScan={(codes) => codes.length > 0 && handleScan(codes[0].rawValue)}
            onError={(err) => console.error("Scan error:", err)}
            styles={{ container: { width: "100%", height: "100%" } }}
            components={{
              onOff: true,
              torch: true,
              zoom: true,
              finder: true,
              tracker: getTracker(),
            }}
            allowMultiple={false}
            scanDelay={2000}
            paused={pause}
          />

          {/* Camera Off Overlay */}
          {pause && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white z-10 rounded-md">
              <p className="mb-4">Scanner paused due to inactivity.</p>
              <button
                onClick={() => setPause(false)}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition"
              >
                Resume Scanner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
