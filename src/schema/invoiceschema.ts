import { z } from 'zod';


  // ✅ Define schema with an array of items
  export const invoiceschema = z.object({
    // invoiceNo: z.string(),     // Add missing props
    // date: z.string(),
    username: z.string().min(1, "Username is required"),
    customerName: z.string().min(1, "Customer name is required"),
    mobileNo: z.string().min(10, "Mobile number must be at least 10 digits"),
    address: z.string().optional(),
  
    Grandtotal: z.coerce.number().positive("Total amount must be positive"),
    // gstTotal:z.coerce.number(),
    paidAmount: z.coerce.number().nonnegative("Paid amount cannot be negative"),
    previous: z.coerce.number().nonnegative("Balancedue amount cannot be negative"),
    SuperTotal: z.coerce.number(),
     Refund:z.coerce.number(),
    //  selectedStock: z.union([z.null(), stockSchema.shape.items]), // Make sure this matches selectedStock in your type
    //  formQuantity: z.number().min(0), // Ensure this matches formQuantity in your type
    //  formGstRate: z.number().min(0), // Ensure this matches formGstRate in your type
    // paymentStatus:z.string()

  
    
  });


  // <InvoicePDF
      //   invoiceNo={invoiceNo}
      //   date={date}
      //   username={username || form.getValues("username")} 
      //   customerName={state.customername}                  
      //   mobileNo={state.customermobileNo}                  
      //   address={form.getValues("address")|| "NA"}
      //   items={fields}                                     
      //   grandTotal={form.getValues("Grandtotal")}
      //   gstTotal={gstTotal}
      //   paidAmount={form.getValues("paidAmount")}
      //   balanceDue={balanceDue || 0}
      //   paymentStatus={paymentStatus}
      // />
  