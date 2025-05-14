import { z } from "zod";

export const CreateEmployeeSchema = z.object({
  username: z.string().min(1, "Username is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  photoPath: z.string().optional(),
  joiningDate: z.coerce.date(), // handles string to Date conversion
  baseSalary: z.number().min(0, "Base salary must be a positive number"),
  currentBalance: z.number(), // can be negative for udhaar

  
  // New optional loan/EMI fields
  emiAmount: z.number().nullable().optional(),
  loanRemaining: z.number().nullable().optional(),
  loanStartMonth: z.number().nullable().optional(), // month index
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;