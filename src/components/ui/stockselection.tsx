'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface StockItem {
  id: string;
  itemName: string;
  hsn: string;
  rate: number;
  quantity: number;
  gstRate: number;
}

interface StockSelectProps {
  onSelect: (item: StockItem) => void;
  selectedStock?: StockItem | null;
}

const StockSelect: React.FC<StockSelectProps> = ({ onSelect }) => {
  const { data: session, status } = useSession();
  const username = session?.user?.username ?? null;

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchStocks = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/stock?username=${username}`);
        setStocks(response.data.stockItems);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [username]);

  return (
    <div className="space-y-2">
      <Label>Select Item through list</Label>
      <Select
        onValueChange={(id) => {
          const selectedItem = stocks.find((item) => item.id === id);
          if (selectedItem) {
            setSelectedItemName(selectedItem.itemName);
            onSelect({
              ...selectedItem,
              quantity: 1,
              gstRate: 0
            });
          }
        }}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              status === "loading"
                ? "Authenticating..."
                : loading
                ? "Loading..."
                : selectedItemName || "Select an item"
            }
          />
        </SelectTrigger>
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
