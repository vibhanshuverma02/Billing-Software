"use client";

import { useState, useEffect, useRef } from "react";
import { Scanner, useDevices, outline, boundingBox, centerText } from "@yudiel/react-qr-scanner";
import { fetchStockItemFromBarcode, StockItem } from "./barcode";

interface Props {
  onSelect: (item: StockItem) => void;
}

export default function ScannerPage({ onSelect }: Props) {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [tracker, setTracker] = useState<string | undefined>("centerText");
  const [pause, setPause] = useState(false);

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
      console.log("Paused due to inactivity");
    }, 10000);
  };

  const handleScan = async (barcode: string) => {
    resetInactivityTimer();
    setPause(true);

    const item = await fetchStockItemFromBarcode(barcode);
    if (item) {
      onSelect(item);
    } else {
      alert("Item not found for scanned barcode.");
    }

    setPause(false);
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
    <div>
      {/* Controls */}
      <div style={{ marginBottom: "10px" }}>
        <select onChange={(e) => setDeviceId(e.target.value)}>
          <option value={undefined}>Select a device</option>
          {devices.map((device, i) => (
            <option key={i} value={device.deviceId}>{device.label}</option>
          ))}
        </select>
        <select onChange={(e) => setTracker(e.target.value)} style={{ marginLeft: 5 }}>
          <option value="centerText">Center Text</option>
          <option value="outline">Outline</option>
          <option value="boundingBox">Bounding Box</option>
        </select>
      </div>

      {/* Scanner with overlay */}
      <div style={{ position: "relative", height: "300px", width: "300px" }}>
        <Scanner
          formats={[
            "qr_code", "micro_qr_code", "rm_qr_code", "maxi_code", "pdf417", "aztec", "data_matrix",
            "matrix_codes", "dx_film_edge", "databar", "databar_expanded", "codabar", "code_39",
            "code_93", "code_128", "ean_8", "ean_13", "itf", "linear_codes", "upc_a", "upc_e"
          ]}
          constraints={{ deviceId }}
          onScan={(codes) => handleScan(codes[0].rawValue)}
          onError={(err) => console.log("Scan error:", err)}
          styles={{ container: { height: "300px", width: "300px" } }}
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
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            flexDirection: "column",
            zIndex: 10
          }}>
            <p style={{ marginBottom: 10 }}></p>
            <button
              onClick={() => setPause(false)}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#4CAF50",
                color: "white",
              }}
            >
              Resume Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
