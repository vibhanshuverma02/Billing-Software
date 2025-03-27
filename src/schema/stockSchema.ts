import { z } from 'zod';

export const stockSchema = z.object({

    items: z.array(
      z.object({
        itemName: z.string().min(1, "Item name is required"),
        hsn: z.string().min(1, "HSN is required"),
        rate: z.coerce.number().min(0, "Rate must be positive"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        gstRate: z.coerce.number().min(0, "GST rate must be positive"),
      }))
    // ).nonempty("At least one item is required"),
  });
  