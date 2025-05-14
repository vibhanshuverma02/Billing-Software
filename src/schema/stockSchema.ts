import { z } from 'zod';
export const usernameValidation = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(20, 'Username must be no more than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain special characters');

export const stockSchema = z.object({

    items: z.array(
      z.object({
     //   id: z.string().min(1, "Quantity must be at least 1"),
        itemName: z.string().min(1, "Item name is required"),
        hsn: z.string().min(1, "HSN is required"),
        rate: z.coerce.number().min(0, "Rate must be positive"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        gstRate: z.coerce.number().min(0, "GST rate must be positive"),
      }))
    // ).nonempty("At least one item is required"),
  });
  export const stockcreation = z.object({

    items: z.array(
      z.object({
        username: usernameValidation,
        itemName: z.string().min(1, "Item name is required"),
        hsn: z.string().min(1, "HSN is required"),
        rate: z.coerce.number().min(0, "Rate must be positive"),
      }))
    // ).nonempty("At least one item is required"),
  });