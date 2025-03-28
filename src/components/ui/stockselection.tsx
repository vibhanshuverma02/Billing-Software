"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// import { z } from "zod";

interface StockItem {
  id: string;
  itemName: string;
  hsn: string;
  rate: number;
  quantity:number;
  gstRate:number;
}

interface StockSelectProps {
  onSelect: (item: StockItem) => void;
  selectedStock?: StockItem | null;   // Added selectedStock prop
}

const StockSelect: React.FC<StockSelectProps> = ({ onSelect }) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);  // ✅ Store selected item

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/stock?username=vibhanshu");
        setStocks(response.data.stockItems);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  return (
    <div className="space-y-2">
      <Label>Select Item</Label>
      <Select onValueChange={(id) => {
        const selectedItem = stocks.find((item) => item.id === id);
        if (selectedItem) {
          setSelectedItemName(selectedItem.itemName);
        
          onSelect(selectedItem);
        }
      }}>
        <SelectTrigger>  
          <SelectValue
            placeholder={loading ? "Loading..." : selectedItemName || "Select an item"}
          />  </SelectTrigger>

        <SelectContent>
          {stocks.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.itemName} (₹{item.rate})
              
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StockSelect;
