// utils/barcodeHandler.ts
import axios from "axios";

export interface StockItem {
  id: string;
  itemName: string;
  hsn: string;
  rate: number;
  quantity: number;
  gstRate: number;
}

export const fetchStockItemFromBarcode = async (
  barcode: string
): Promise<StockItem | null> => {
  try {
    const res = await axios.get(`/api/stock?barcode=${barcode}`);
    const raw = res.data.stockItem;

    return {
      id: raw.id,
      itemName: raw.itemName,
      hsn: raw.hsn,
      rate: raw.rate,
      quantity: 1,
      gstRate: 12,
    };
  } catch (err) {
    console.error("Barcode fetch failed", err);
    return null;
  }
};
