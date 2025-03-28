"use client";
//import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockSchema } from "@/schema/stockSchema";
import { invoiceschema } from "@/schema/invoiceschema";
import { pdf } from "@react-pdf/renderer";  // ✅ Import PDFDownloadLink
import InvoicePDF from  "@/components/PDF" ; 
import { saveAs } from "file-saver";   // ✅ Import he PDF component
import { z } from "zod";
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormItem, FormLabel} from "@/components/ui/form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useState, useEffect,  useReducer, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import StockSelect from "@/components/ui/stockselection";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import { ApiResponse } from "@/type/ApiResponse";
// import { Item } from "@radix-ui/react-select";


// ✅ Lazy load PDFDownloadLink to avoid SSR issues
// ✅ Use ESM-friendly import for PDFDownloadLink
// const PDFDownloadLinkNoSSR = dynamic(
//   () =>
//     import("@react-pdf/renderer").then((mod) => {
//       return mod.PDFDownloadLink;
//     }),
//   { ssr: false }
// );

type InvoiceFormData = z.infer<typeof invoiceschema>& {
  items: z.infer<typeof stockSchema>["items"];
};

interface State {
  customername: string;
  customermobileNo: string;
  customerdetialsMessage: string;
  isCheckingCustomer: boolean;
}
interface SetNameAction {
  type: "SET_NAME";
  payload: string;
}

interface SetMobileAction {
  type: "SET_MOBILE";
  payload: string;
}

interface SetMessageAction {
  type: "SET_MESSAGE";
  payload: string;
}

interface ToggleLoadingAction {
  type: "TOGGLE_LOADING";
  payload: boolean;
}

type Action = SetNameAction | SetMobileAction | SetMessageAction | ToggleLoadingAction;
const initialState = {
  customername: "",
  customermobileNo: "",
  customerdetialsMessage: "",
  isCheckingCustomer: false,
};



const reducer = (state:State, action:Action) => {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, customername: action.payload };
    case "SET_MOBILE":
      return { ...state, customermobileNo: action.payload };
    case "SET_MESSAGE":
      return { ...state, customerdetialsMessage: action.payload };
    case "TOGGLE_LOADING":
      return { ...state, isCheckingCustomer: action.payload };
    default:
      return state;
  }
};
const InvoiceForm = () => {
  const { data: session, status } = useSession();  // ✅ Fetch session
 const [username, setUsername] = useState<string | null>(null);
 const [customerID, setCustomerID]=useState<string|null>(null);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [gstTotal, setGstTotal] = useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
 // ✅ Combined customer details state
 const [state, dispatch] = useReducer(reducer, initialState);
 

  // ✅ useRef for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
// ✅ Extract username from session
useEffect(() => {
  if (status === "authenticated" && session?.user) {
    console.log("Username:", session.user.username);
    setUsername(session.user.username || "Guest");
  }
}, [session, status]);

// ✅ Debounced API call
const debouncedFetch = useCallback((func: () => void, delay: number) => {
  if (debounceRef.current) clearTimeout(debounceRef.current); // Clear previous timer
  debounceRef.current = setTimeout(() => {
    func(); // Execute the API call after the delay
  }, delay);
}, []);

// ✅ Combined API Call
const fetchCustomer = useCallback(async () => {
  // if (!state.customername.trim() || !state.customermobileNo.trim()) {
  //   dispatch({ type: "SET_MESSAGE", payload: "Both name and mobile are required." });
  //   return;
  // }

  dispatch({ type: "TOGGLE_LOADING", payload: true });
  dispatch({ type: "SET_MESSAGE", payload: "" });

  try {
    console.log("Fetching customer...");
    const response = await axios.get(`/api/invoice`, {
      params: {
        customerName: state.customername,
        customermobileNo: state.customermobileNo,
      },
    });

    dispatch({
      type: "SET_MESSAGE",
      payload: response.data.message || "Customer found!",
    });
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse>;
    dispatch({
      type: "SET_MESSAGE",
      payload: axiosError.response?.data.message || "Error fetching customer",
    });
  } finally {
    dispatch({ type: "TOGGLE_LOADING", payload: false });
  }
}, [state.customername, state.customermobileNo]);

// ✅ Single useEffect for Combined API Call

  // ✅ useEffect for API Calls and Validation
  useEffect(() => {
    if (!state.customername.trim() || !state.customermobileNo.trim()) {
      // ✅ Clear message when both fields are empty
      dispatch({ type: "SET_MESSAGE", payload: "" });
      return;
    }

    if (state.customername.trim() || state.customermobileNo.trim()) {
      // ✅ Only call API if mobile number is 10 digits
      if (/^\d{10}$/.test(state.customermobileNo) || !state.customermobileNo) {
        debouncedFetch(fetchCustomer, 500);
      }
    }
  }, [state.customername, state.customermobileNo, debouncedFetch, fetchCustomer]);
  // ✅ Initialize Form with Zod Schema
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(
      invoiceschema.merge(
        z.object({
          items: stockSchema.shape.items
        })
      )
    ),
    defaultValues: {
      username: username || " ",
      customerName: "",
      mobileNo: "",
      address: "",
      paidAmount:0  ,
      Grandtotal: 0,
      items: []
    },
  });
  // 
    const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const calculateTotals = useCallback(() => {
    const subtotal = fields.reduce((sum, item) => sum + item.rate * item.quantity, 0);
    const gst = fields.reduce((sum, item) => sum + (item.rate * item.quantity * item.gstRate) / 100, 0);
    const grandTotal = subtotal + gst;
  
    form.setValue("Grandtotal", grandTotal);
    setGstTotal(gst);
  }, [fields, form]);
  

  useEffect(() => {
    calculateTotals();
  }, [fields , calculateTotals]);

  const [selectedStock, setSelectedStock] = useState<InvoiceFormData["items"][number] |  null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [gstRate, setGstRate] = useState<number>(12);
 

  // ✅ Add Item to Invoice Table
  const addItem = () => {
    if (!selectedStock) {
      toast.error("Please select a product!");
      return;
    }

    append({
      itemName: selectedStock.itemName,
      hsn: selectedStock.hsn,
      rate: selectedStock.rate,
      quantity,
      gstRate,
    });

    // Reset selection
    setSelectedStock(null);
    setQuantity(1);
    setGstRate(3);
  };


  // ✅ Clear Form
  const clearForm = () => {
    form.reset();
    form.setValue("Grandtotal", 0)
    setGstTotal(0);
    setBalanceDue(null);
    setPaymentStatus(null);
  };

  // ✅ Submit the form
   // ✅ Handle API Submission
  // ✅ Submit the form
// ✅ Sync reducer state with form data on changes
useEffect(() => {
  form.setValue("customerName", state.customername);
  form.setValue("mobileNo", state.customermobileNo);
}, [state.customername, state.customermobileNo, form]);


  const onSubmit = async () => {
    // form.setValue("customerName", state.customername);
    
    // form.setValue("mobileNo", state.customermobileNo);

    // await new Promise((resolve) => setTimeout(resolve, 0)); 
    const formData:InvoiceFormData  = form.getValues();  // Collect entire form data
    console.log("Updated Form Data:", formData);  // 🔥 Log the form data
    console.log("Submitting:", formData);
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/invoice", formData);
      
      console.log("API Response:", response.data);
      
      setInvoiceNo(response.data.invoice.invoiceNo);
      setDate(response.data.invoice.invoiceDate);
      setCustomerID(response.data.customer.id);
      console.log(response.data.customer.id);
      setBalanceDue(response.data.balanceDue);
      setPaymentStatus(response.data.paymentStatus);

      toast.success("Invoice generated successfully!");
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      const axiosError = error as AxiosError<ApiResponse>;

      // Default error message
      const errorMessage =  axiosError.response?.data.message ||
     'Failed to generate invoice:';


      toast(
       errorMessage
        //variant: 'destructive',
      );    } finally {
      setIsSubmitting(false);
    }
  };
  const generateAndDownloadPDF = async () => {
    try {
      const blob = await pdf(
        <InvoicePDF invoiceNo={invoiceNo}
        date={date}
        username={username || form.getValues("username")}
        customerID={customerID || "NA"}
        customerName={state.customername}
        mobileNo={state.customermobileNo}
        address={form.getValues("address") || "NA"}
        items={fields.length > 0
          ? fields
          : [{ itemName: "N/A", hsn: "0000", rate: 0, quantity: 0, gstRate: 0 }]}
        Grandtotal={form.getValues("Grandtotal")}
        gstTotal={gstTotal}
        paidAmount={form.getValues("paidAmount")}
        balanceDue={balanceDue || 0}
        paymentStatus={paymentStatus || "NA"}/>
      ).toBlob();

      const fileName = `invoice_${Date.now()}.pdf`;
      saveAs(blob, fileName);

      // Simulate local path (only for display purposes)
      const pdfPath = `C:/Users/Client/Downloads/${fileName}`;

      // ✅ Save PDF path to database
      await axios.put("/api/invoice", {
        customerId: customerID,
        pdfPath,
      });

      alert("PDF generated and path saved!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF.");
    }
  };


  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Card className="max-w-5xl mx-auto shadow-md rounded-lg">
        <CardHeader className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">Oakworld Public  School </h1>
          <p className="text-gray-500">Sector149, GreaterNoida-UTTARPRADESH 201301 </p>
          <p className="text-gray-500">Contact: +91 98765 43210 , + 917324 78929</p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <FormItem>
                  <FormLabel>Invoice No</FormLabel>
                  <Input placeholder="Loading..." value={invoiceNo || ""} readOnly />
                </FormItem>

                <FormItem>
                  <FormLabel>Order Date</FormLabel>
                  <Input placeholder="Loading..." value={date || ""} readOnly />
                </FormItem>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-3 gap-6">
      {/* ✅ Customer Name */}
      <Controller
        name="customerName"
        control={form.control}
        render={({ field }) => (
          <div>
            <label>Customer Name</label>
            <Input
              {...field}
              value={state.customername}
              onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
            />
          </div>
        )}
      />

      {/* ✅ Customer Mobile */}
      <Controller
        name="mobileNo"
        control={form.control}
        render={({ field }) => (
          <div>
            <label>Contact Number</label>
            <Input
              {...field}
              value={state.customermobileNo}
              onChange={(e) => dispatch({ type: "SET_MOBILE", payload: e.target.value })}
            />
          </div>
        )}
      />

      {/* ✅ Loader and Message */}
      <div className="col-span-3">
        {state.isCheckingCustomer && <Loader2 className="animate-spin" />}
        {!state.isCheckingCustomer && state.customerdetialsMessage && (
          <p
            className={`text-sm ${
              state.customerdetialsMessage.includes("New") ? "text-green-500" : "text-red-500"
            }`}
          >
            {state.customerdetialsMessage}
          </p>
        )}
      </div>

      {/* ✅ Customer Address */}
      <Controller
        name="address"
        control={form.control}
        render={({ field }) => (
          <div className="col-span-3">
            <label>Customer Address</label>
            <Textarea placeholder="Enter customer address" {...field} />
          </div>
        )}
      />
    </div>

               {/* Stock Selection Using StockSelect Component */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                {/* <label className="block text-sm font-medium text-gray-700">Select Product</label> */}
                <StockSelect
                  onSelect={(stock) => setSelectedStock(stock)}
                />
                 <Input
          value={selectedStock ? selectedStock.itemName : ""}
          readOnly
          className="bg-gray-100 text-gray-800"
        />
                 {/* Display selected stock itemName in the SelectTrigger */}
            <div className="mt-4">
              <p className="text-lg font-medium">
                Selected Product:{" "}
                <span className="text-blue-600">
                  {selectedStock?.itemName || "No product selected"}
                </span>
              </p>
            </div>
              </div>
  
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <Input
                  type="number"
                  value={quantity}
                  min={0}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700">GST %</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300"
                >
                  {[0, 3,5, 12, 18, 28].map((gst) => (
                    <option key={gst} value={gst}>
                      {gst}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button type="button" onClick={addItem} className="bg-blue-600 text-white">
                  Add Item
                </Button>
              </div>
            </div>

              {/* Invoice Table */}
             
      {/* Invoice Table */}
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>HSN</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>GST %</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{item.itemName}</TableCell>
              <TableCell>{item.hsn}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => update(index, { ...item, quantity: Number(e.target.value) })}
                />
              </TableCell>
              <TableCell>
              <Input
                type="number"
                value={item.rate}
                onChange={(e) => {
                  update(index, { ...item, rate: Number(e.target.value) });
                  calculateTotals();}}/></TableCell>
                <TableCell>
                <Select
                  value={String(item.gstRate)}
                  onValueChange={(value) => {
                    update(index, { ...item, gstRate: Number(value) });
                     calculateTotals();  // ✅ Ensure totals update after the state change
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="GST %" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 3, 5, 12, 18, 28].map((rate) => (
                      <SelectItem key={rate} value={String(rate)}>
                        {rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell>₹{(item.rate * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => remove(index)}>
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

              {/* Payment Section */}
 <div className="flex justify-end mt-8">
 <div className="text-lg font-bold space-y-2 text-right">
 <p>Sub Total: ₹{(fields.reduce((sum, item) => sum + item.rate * item.quantity, 0))}</p>
 <p>GST: ₹{gstTotal}</p>
 <p>Grand Total: ₹{form.getValues("Grandtotal")}</p>
   
 <div className="flex flex-col">
       <div className="flex justify-between items-center col-span-2">
       <span className="text-gray-600">Paid Amount:</span>
      <Input 
        type="number" 
        // {...field}
        onChange={(e) => form.setValue("paidAmount", Number(e.target.value))} 
        className="border-blue-500"
      />
      {/* <FormMessage /> */}
    </div>
    </div>

  {/* Balance Due */}
  <div className="flex flex-col">
  <span className="text-red-600 font-medium">Balance Due:</span>
  <span className="text-red-600 font-bold">
    <Input 
      type="number" 
      value={balanceDue ?? 0} 
      readOnly 
      className="bg-gray-100"
    />
    </span>
  </div>

  {/* Payment Status */}
  <div className="flex flex-col">
    <FormLabel className="text-gray-600 text-sm">Payment Status</FormLabel>
    <Input 
      value={paymentStatus || "N/A"} 
      readOnly 
      className="bg-gray-100"
    />
  </div>
</div>
</div>

<Button onClick={clearForm} className="mt-4">Clear Form</Button>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Generate Bill'
              )}
            </Button>

            {/* ✅ PDF Generation and Download */}
            {/* <div className="mt-8 flex justify-between"> */}
              {/* <Button onClick={handleGeneratePDF} className="bg-blue-600 text-white">
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  "Generate PDF"
                )}
 
         </Button> */}
{/*          
         <PDFDownloadLink
  document={
    <InvoicePDF
      invoiceNo={invoiceNo}
      date={date}
      username={username || form.getValues("username")}
      customerID={customerID || "NA"}
      customerName={state.customername}
      mobileNo={state.customermobileNo}
      address={form.getValues("address") || "NA"}
      items={fields.length > 0
        ? fields
        : [{ itemName: "N/A", hsn: "0000", rate: 0, quantity: 0, gstRate: 0 }]}
      Grandtotal={form.getValues("Grandtotal")}
      gstTotal={gstTotal}
      paidAmount={form.getValues("paidAmount")}
      balanceDue={balanceDue || 0}
      paymentStatus={paymentStatus || "NA"}
    />
  }
>
  {({ url, loading }) =>
    loading ? (
      <button className="bg-gray-400 text-white px-4 py-2 rounded-md" disabled>
        Generating PDF...
      </button>
    ) : (
      <a
        href={url ||"#"}
        download={`invoice_${invoiceNo}.pdf`}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
      >
        Download PDF
      </a>
    )
  }
</PDFDownloadLink> */}
 <div style={{ padding: "20px" }}>
      <h1>Generate PDF Invoice</h1>

      <button
        onClick={generateAndDownloadPDF}
        style={{
          padding: "10px 20px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Generate and Download PDF
      </button>
    </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  </div>
);
};

export default InvoiceForm;