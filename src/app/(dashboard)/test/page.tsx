"use client";
//import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockSchema } from "@/schema/stockSchema";
import { invoiceschema } from "@/schema/invoiceschema";
import { pdf } from "@react-pdf/renderer";  // ✅ Import PDFDownloadLink
import InvoicePDFWrapper from "@/components/ui/InvoiceWrapper"; 
import { saveAs } from "file-saver";   // ✅ Import he PDF component
import { z } from "zod";
import { QuickAddEnhancer } from "@/components/ui/quick integraton";
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormItem, FormLabel} from "@/components/ui/form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useState, useEffect,  useReducer, useRef, useCallback } from "react";
import StockSelect from "@/components/ui/stockselection";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DebouncedInput } from "@/components/ui/debounced";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import { ApiResponse } from "@/type/ApiResponse";

import { useDebounceCallback } from "usehooks-ts";
import { useSearchParams } from "next/navigation";
import ScannerPage from "@/components/ui/barcordscanner";


type InvoiceFormData = z.infer<typeof invoiceschema>& {
  items: z.infer<typeof stockSchema>["items"];
};
interface StockItem {
  
  itemName: string;
  hsn: string;
  rate: number;
  quantity: number;
  gstRate: number;
}


interface State {
  sellesperson: string
  customername: string;
  customermobileNo: string;
  customerdetialsMessage: string;
  isCheckingCustomer: boolean;
} 
interface Setseller{
  type: "SET_SELLER";
  payload:string;
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
interface ResetFormAction {
  type: "RESET_FORM";
}
type Action =Setseller| SetNameAction | SetMobileAction | SetMessageAction | ToggleLoadingAction | ResetFormAction;;
const initialState = {
  sellesperson: "",
  customername: "NA",
  customermobileNo: "0000000000",
  customerdetialsMessage: "",
  isCheckingCustomer: false,
};



const reducer = (state:State, action:Action) => {
  switch (action.type) {
    case"SET_SELLER":
    return { ...state,   sellesperson: action.payload}
    case "SET_NAME":
      return { ...state, customername: action.payload };
    case "SET_MOBILE":
      return { ...state, customermobileNo: action.payload };
    case "SET_MESSAGE":
      return { ...state, customerdetialsMessage: action.payload };
    case "TOGGLE_LOADING":
      return { ...state, isCheckingCustomer: action.payload };
    case "RESET_FORM":
  return {
    ...initialState, // make sure initialState is correctly defined
  };
  
    default:
      return state;
  }
};
const Test = () => {
  const { data: session, status } = useSession();  // ✅ Fetch session

 const [username, setUsername] = useState<string | null>(null);
 const [customerID, setCustomerID]=useState<string|null>(null);
 const [employeeList, setEmployeeList] = useState<string[]>([]);

  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [gstTotal, setGstTotal] = useState<number>(0);
  const [previous, setPrevious]=useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidamount,  setPaidamount] = useState<number>(0);
  const [refund, setRefund] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(true);


  // const[invoiceId , setInvoiceID]= useState<number>(0);
  
 // ✅ Combined customer details state
 const [state, dispatch] = useReducer(reducer, initialState);
 console.log(invoiceNo , date)

  // ✅ useRef for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
// ✅ Extract username from session

useEffect(() => {
  if (isAnonymous) {
    dispatch({ type: "SET_NAME", payload: "NA" });
    dispatch({ type: "SET_MOBILE", payload: "0000000000" });
  } else {
    dispatch({ type: "SET_NAME", payload: "" });
    dispatch({ type: "SET_MOBILE", payload: "" });
  }
}, [isAnonymous]);


useEffect(() => {
  if (status === "authenticated" && session?.user) {
    console.log("Username:", session.user.username);
    setUsername(session.user.username || "Guest");
  }
}, [session, status]);

// ✅ Debounced API call using useCallback
const debouncedFetch = useCallback((func: () => void, delay: number) => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    func();
  }, delay);
}, []);

// ✅ Fetch Customer API call
const fetchCustomer = useCallback(async () => {
  dispatch({ type: "TOGGLE_LOADING", payload: true });
  dispatch({ type: "SET_MESSAGE", payload: "" });

  try {
    console.log("Fetching customer...");
    const response = await axios.get("/api/invoice", {
      params: {
        customerName: state.customername,
        customermobileNo: state.customermobileNo,
       
           
      },
    });

    if (response.data.isNewCustomer) {
      dispatch({ type: "SET_MESSAGE", payload: "New Customer" });
      setPrevious(0);
      return;
    }

    setPrevious(response.data.customer?.balance || 0);
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

// ✅ useEffect for validation & conditional API call
useEffect(() => {
  const name = state.customername.trim();
  const mobile = state.customermobileNo.trim();

  const isHardAnonymous = name === "NA" && mobile === "0000000000";
  const isPartialAnonymous = name !== "NA" && mobile === "0000000000";

  // 🛑 Skip fetch if anonymous or partial-anonymous case
  if (isHardAnonymous || isPartialAnonymous) return;

  // ✅ Clear message when both fields are empty
  if (!name && !mobile) {
    dispatch({ type: "SET_MESSAGE", payload: "" });
    return;
  }

  // ✅ Trigger fetch if mobile number is valid
  if (/^\d{10}$/.test(mobile)) {
    debouncedFetch(fetchCustomer, 500);
  }
}, [state.customername, state.customermobileNo, debouncedFetch, fetchCustomer]);


// ✅ Prefill customer info from URL params
const searchParams = useSearchParams();

useEffect(() => {
  const nameFromURL = searchParams.get("customerName");
  const mobileFromURL = searchParams.get("mobileNo");
  const  sellespersonurl = searchParams.get("salesperson");
  if (nameFromURL) {
    dispatch({ type: "SET_NAME", payload: nameFromURL });
  }

  if (mobileFromURL) {
    dispatch({ type: "SET_MOBILE", payload: mobileFromURL });
  }
  console.log( sellespersonurl)
  if (sellespersonurl){
    dispatch({type: "SET_SELLER",payload: sellespersonurl});
  }
}, [searchParams]);


  const form = useForm<InvoiceFormData>({
  resolver: zodResolver(
    invoiceschema.merge(
      z.object({
        items: stockSchema.shape.items,
      })
    )
  ),
  defaultValues: {
    username: username || " ",
    customerName: "NA",
    mobileNo: "0000000000", // ✅ Set default here
    salesperson: "",
    paidAmount: 0,
    previous: 0,
    Grandtotal: 0,
    SuperTotal: 0,
    Refund: 0,
    items: [],
  },
});

  // 
    const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });
  useEffect(() => {
  if (state.customername) {
    if (state.customername && state.customername !== "NA")
    form.setValue("customerName", state.customername);
  }

  if (state.customermobileNo && state.customermobileNo !== "0000000000") {
    form.setValue("mobileNo", state.customermobileNo);
  }
  if(state.sellesperson){
  form.setValue("salesperson", state.sellesperson);}
}, [state.customername, state.customermobileNo,  state.sellesperson, form]);

  

  // Debounced Calculation Function
  const calculateTotals = useDebounceCallback(() => {


// Correct GST extraction from GST-inclusive rate
const subtotal = fields.reduce((sum, item) => sum + item.rate * item.quantity, 0);

// Correct GST extraction from inclusive rate and round to 2 decimals
const gst = fields.reduce((sum, item) => {
  const itemGst =
    (item.rate * item.quantity * item.gstRate) / (100 + item.gstRate);
  return sum + Number(itemGst.toFixed(2));
}, 0);

const grandTotal = subtotal - gst;
const superTotal = grandTotal + previous + gst;

form.setValue("previous", previous);
form.setValue("Grandtotal", grandTotal);
form.setValue("SuperTotal", superTotal);
setGstTotal(gst);


  
    const newRefund = paidamount - superTotal;
    setRefund(Math.max(newRefund, 0)); // Ensures refund is never negative
  
    form.setValue("Refund", Math.max(newRefund, 0));
    
  }, 300); // Debounce delay (300ms)

  // ✅ Sync paidAmount separately
useEffect(() => {
  form.setValue("paidAmount", paidamount);
}, [paidamount, form]);

//  useEffect(() => {
//   if (lastEditedRef.current) {
//     const { row, col } = lastEditedRef.current;
//     const el = inputRefs.current[row]?.[col];
//     if (el) el.focus();
//   }
// }, [fields]);


  // ✅ Correct: Remove calculateTotals from dependencies to avoid infinite loop
  useEffect(() => {
    calculateTotals();
  }, [paidamount, fields, previous,calculateTotals]);
  
  


  // ✅ Add Item to Invoice Table
  const addItem = (stock: StockItem) => {
  if (!stock) {
    toast.error("Please select a product!");
    return;
  }

  append({
  itemName: stock.itemName,
  hsn: stock.hsn,
  rate: stock.rate,
  quantity: stock.quantity, // ✅ use quantity from `stock`
  gstRate: stock.gstRate ?? 5, // optional fallback
});


  toast.success(`${stock.itemName} added to invoice.`);
};

  

  // // ✅ Clear Form
 const clearForm = () => {
  form.reset({
    username: username || " ",
    customerName: "NA",
    mobileNo: "0000000000",
    salesperson: "",
    paidAmount: 0,
    previous: 0,
    Grandtotal: 0,
    SuperTotal: 0,
    Refund: 0,
    items: [],
    
  });
//  lastEditedRef.current = null;
  setInvoiceNo("");
  setDate("");
  setGstTotal(0);
  setBalanceDue(null);
  setPaymentStatus(null);
  setPaidamount(0);
  setRefund(0);
  setPrevious(0);
  setIsAnonymous(true)
  // setSelectedStock(null);
  // setQuantity(1);
  // setGstRate(5);
  setCustomerID(null);

  // Clear reducer state
  dispatch({ type: "RESET_FORM" }); // 👈 Create this case in your reducer to reset `customername`, `customermobileNo`, etc.
};
useEffect(() => {
  if (employeeList.length > 0) return; // Don't fetch again
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/getall");
      if (Array.isArray(res.data)) {
        const names = res.data.map((emp) => emp.name);
        setEmployeeList(names);
      } else {
        throw new Error("Invalid employee list format");
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
      toast.error("Unable to load salespeople.");
      setEmployeeList([]);
    }
  };

  fetchEmployees();
}, [employeeList]);



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
      const newInvoice = response.data.invoice;
      // const newCustomer = response.data.customer;
      
      console.log("API Response:", response.data);
     
      setInvoiceNo(response.data.invoice.invoiceNo);
      setDate(response.data.invoice.invoiceDate);
      setCustomerID(response.data.customer.id);
      console.log(customerID)
      console.log(response.data.customer.id);
      if(!isAnonymous){
      setBalanceDue(response.data.balanceDue);
      setPaymentStatus(response.data.paymentStatus);
      }

      toast.success("Invoice generated successfully!");
      setTimeout(() => {
        generateAndDownloadPDF({
          invoiceId:newInvoice.id,
          invoiceNo: newInvoice.invoiceNo,
          date: newInvoice.invoiceDate,
          // customerID: newCustomer.id,
          grandTotal: formData.SuperTotal,
          paidAmount: formData.paidAmount,
          balanceDue: response.data.balanceDue,
          paymentStatus:response.data.paymentStatus,


       } );  // Pass invoiceNo
      }, 500); // Slight delay to allow state update
  
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



  const generateAndDownloadPDF = async ({
    invoiceId,
    invoiceNo,
    date,
   // customerID,
    grandTotal,
    // gstTotal,
   
    paidAmount,
    balanceDue,
    paymentStatus,
  }: {
    invoiceId:number;
    invoiceNo: string;
    date: string;
   // customerID: string ;
    grandTotal: number;
    // gstTotal:   number;
   
    paidAmount: number;
    balanceDue: number ;
    paymentStatus:string;
  }) => {
  try {
    // if (!invoiceNo) {
    //   alert("Invoice not found. Please generate an invoice first.");
    //   return;
    // }

    // ✅ Ensure we're using the stored state, not `form.getValues()`
    const blob = await pdf(
      <InvoicePDFWrapper 
        invoiceNo={invoiceNo}
        date={date}
        customerName={state.customername}
        mobileNo={state.customermobileNo}
        salesperson={state.sellesperson}
        items={fields.length > 0 ? fields : [{ itemName: "N/A", hsn: "0000", rate: 0, quantity: 0, gstRate: 0 }]}
        Grandtotal= {grandTotal}
        gstTotal={ gstTotal}
        previousBalance={previous}
        paidAmount={paidAmount}
        balanceDue={balanceDue}
        paymentStatus={paymentStatus}
      />
    ).toBlob();
 const fileName = `customername_${state.customername}.pdf`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      saveAs(blob, fileName);
    }

    const base64 = await blob.arrayBuffer().then((buf) => {
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    });

    await axios.put("/api/invoice", {
      invoiceId: invoiceId,
      pdfBufferBase64: base64,
    });

    alert("PDF generated and path saved!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF: " + (error as Error).message);
  }
};
const inputRefs = useRef<Array<{
  quantity?: HTMLInputElement | null;
  rate?: HTMLInputElement | null;
  gst?: HTMLButtonElement | null;
}>>([]);

const handleKeyDown = (
  e: React.KeyboardEvent,
  row: number,
  col: 'quantity' | 'rate' | 'gst'
) => {
  const moveFocus = (nextRow: number, nextCol: 'quantity' | 'rate' | 'gst') => {
    inputRefs.current[nextRow]?.[nextCol]?.focus();
  };

  const lastRow = fields.length - 1;

  switch (e.key) {
    case "ArrowDown":
      if (row < lastRow) {
        moveFocus(row + 1, col);
        e.preventDefault();
      }
      break;
    case "ArrowUp":
      if (row > 0) {
        moveFocus(row - 1, col);
        e.preventDefault();
      }
      break;
    case "ArrowRight":
      if (col === "quantity") moveFocus(row, "rate");
      else if (col === "rate") moveFocus(row, "gst");
      e.preventDefault();
      break;
    case "ArrowLeft":
      if (col === "gst") moveFocus(row, "rate");
      else if (col === "rate") moveFocus(row, "quantity");
      e.preventDefault();
      break;
    case "Tab":
      if (e.shiftKey) {
        if (col === "gst") moveFocus(row, "rate");
        else if (col === "rate") moveFocus(row, "quantity");
        else if (col === "quantity" && row > 0) moveFocus(row - 1, "gst");
      } else {
        if (col === "quantity") moveFocus(row, "rate");
        else if (col === "rate") moveFocus(row, "gst");
        else if (col === "gst" && row < lastRow) moveFocus(row + 1, "quantity");
      }
      e.preventDefault();
      break;
  }
};
  return (
 < div className="flex items-start justify-center min-h-screen px-4 py-6">
  <Card className="w-full max-w-full md:max-w-4xl max-h-screen overflow-y-auto shadow-md rounded-lg p-6">
    <CardHeader className="text-center mb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-600">Generate Invoice</h1>
    </CardHeader>

    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Invoice Info */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormItem>
              <FormLabel>Invoice No</FormLabel>
              <Input
                placeholder="Loading..."
                value={invoiceNo || ""}
                readOnly
                className="w-full"
              />
            </FormItem>

            <FormItem>
              <FormLabel>Order Date</FormLabel>
              <Input
                placeholder="Loading..."
                value={date || ""}
                readOnly
                className="w-full"
              />
            </FormItem>
          </div> */}

          <div className="flex justify-start md:justify-end">
            <Button id="new-bill-btn"  type="button" onClick={clearForm} className="px-4 py-2">
              New Bill
            </Button>
          </div>
            
<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
  <input
    type="checkbox"
    checked={isAnonymous}
    onChange={(e) => setIsAnonymous(e.target.checked)}
    id="anonymousToggle"
    className="h-5 w-5 mt-1 sm:mt-0"
  />
  <label
    htmlFor="anonymousToggle"
    className="text-sm font-medium text-gray-700 cursor-pointer"
  >
    Generate anonymous bill (non-saree/lehenga customers)
  </label>
</div>



{/* Customer Info */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
  <Controller
    name="customerName"
    control={form.control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Customer Name</FormLabel>
        <Input
          {...field}
          value={state.customername}
          onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
          disabled={isAnonymous}
          className="w-full"
        />
      </FormItem>
    )}
  />

  <Controller
    name="mobileNo"
    control={form.control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Contact Number</FormLabel>
        <Input
          {...field}
          value={state.customermobileNo}
          onChange={(e) => dispatch({ type: "SET_MOBILE", payload: e.target.value })}
          disabled={isAnonymous}
          className="w-full"
        />
      </FormItem>
    )}
  />

  {/* Status message, full width on all screens */}
  <div className="col-span-1 md:col-span-2 flex items-center space-x-2">
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

 <Controller
  name="salesperson"
  control={form.control}
  render={({ field }) => (
    <FormItem className="col-span-1 md:col-span-2">
      <FormLabel>Salesperson</FormLabel>
      <Select
        value={state.sellesperson}
       onValueChange={(value) => {
  dispatch({ type: "SET_SELLER", payload: value });
  field.onChange(value);

  // ✅ Blur the trigger manually
  setTimeout(() => {
    const active = document.activeElement as HTMLElement;
    if (active) active.blur();
  }, 10);
}}

      >
        <SelectTrigger tabIndex={-1}  className="max-w-xs">
          <SelectValue placeholder="Select Salesperson" />
        </SelectTrigger>
      <SelectContent>
  {employeeList.length > 0 ? (
    employeeList.map((name) => (
      <SelectItem key={name} value={name}>
        {name}
      </SelectItem>
    ))
  ) : (
    <SelectItem value="none" disabled>
      No employees found
    </SelectItem>
  )}
</SelectContent>

      </Select>
    </FormItem>
  )}
/>


</div>
{/* Stock Selection */}
<div className="flex flex-col gap-4 mb-6">
  <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
    {/* Scanner */}
    <div className="w-full md:flex-1">
      <ScannerPage onSelect={(item) => append(item)} />
    </div>

    {/* OR separator */}
    <div className="text-center md:px-2">
      <span className="text-gray-500 font-semibold select-none">OR</span>
    </div>

    {/* Stock Select */}
    <div className="w-full md:flex-1">
      <StockSelect
        onSelect={(stock) => {
          addItem(stock);
        }}
      />
    </div>
  </div>
</div>



            {/* Invoice Table */}
            <div className="overflow-x-auto">
  <div className="hidden md:block">
    {/* Desktop Table */}
    <Table className="min-w-full">
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
 <DebouncedInput
    type="number"
    value={item.quantity}
    onDebouncedChange={(value) => update(index, { ...item, quantity: value })}
    onTotalCalculate={calculateTotals}
    onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
  ref={(el) => {
    if (!inputRefs.current[index]) {
      inputRefs.current[index] = { quantity: null, rate: null, gst: null };
    }
    inputRefs.current[index].quantity = el;
  }}
/>

</TableCell>

<TableCell>
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">
      ₹{Math.round(item.rate / (1 + item.gstRate / 100))} (Excl. GST)
    </span>
   <DebouncedInput
  type="number"
  value={item.rate}
  onDebouncedChange={(value) => 
    update(index, { ...item, rate: value }) }
  onTotalCalculate={calculateTotals}
  onKeyDown={(e) => handleKeyDown(e, index, 'rate')}
  ref={(el) => {
    if (!inputRefs.current[index]) {
      inputRefs.current[index] = { quantity: null, rate: null, gst: null };
    }
    inputRefs.current[index].rate = el;
  }}
/>

  </div>
</TableCell>

        <TableCell>
  <Select
  value={String(item.gstRate)}
 onValueChange={(value) => {
  update(index, { ...item, gstRate: Number(value) });
  calculateTotals();

}}

>
  <SelectTrigger
   ref={(el) => {
  if (!inputRefs.current[index]) {
    inputRefs.current[index] = { quantity: null, rate: null, gst: null };
  }
  inputRefs.current[index].gst = el;
}}

    onKeyDown={(e) => handleKeyDown(e, index, 'gst')}
  >
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
        <TableCell>
          ₹{Math.round(item.rate * item.quantity)}
        </TableCell>
        <TableCell>
          <Button variant="destructive" onClick={() => remove(index)}>
            <Trash2 />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
<QuickAddEnhancer
  addItem={addItem}
  fields={fields}
  inputRefs={inputRefs}
  dispatch={dispatch}
 
/>
  </div>

  {/* Mobile view: cards / stacked layout */}
 <div className="block md:hidden space-y-4">
  <QuickAddEnhancer
  addItem={addItem}
  fields={fields}
  inputRefs={inputRefs}
  dispatch={dispatch}

/>
  {fields.map((item, index) => (
    <div key={item.id} className="p-4 border rounded-md shadow-sm">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">Product:</span>
        <span>{item.itemName}</span>
      </div>

      <div className="flex justify-between mb-2">
        <span className="font-semibold">HSN:</span>
        <span>{item.hsn}</span>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Qty:</span>
        <DebouncedInput
          type="number"
          value={item.quantity}
          onDebouncedChange={(value) => update(index, { ...item, quantity: value })}
          onTotalCalculate={calculateTotals}
          className="w-20"
        />
      </div>

      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold">Rate:</span>
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500">
            ₹{Math.round(item.rate / (1 + item.gstRate / 100))} (Excl. GST)
          </span>
          <DebouncedInput
            type="number"
            value={item.rate}
            onDebouncedChange={(value) => update(index, { ...item, rate: value })}
            onTotalCalculate={calculateTotals}
            className="w-24 mt-1"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">GST %:</span>
        <Select
          value={String(item.gstRate)}
          onValueChange={(value) => {
            update(index, { ...item, gstRate: Number(value) });
            calculateTotals();
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
      </div>

      <div className="flex justify-between mb-2">
        <span className="font-semibold">Total:</span>
        <span>₹{Math.round(item.rate * item.quantity)}</span>
      </div>

      <div className="text-right">
        <Button variant="destructive" onClick={() => remove(index)}>
          <Trash2 />
        </Button>
      </div>
    </div>
  ))}
</div>

</div>

{/* payment  */}<div className="flex flex-col md:flex-row justify-end mt-8 gap-6">
  <div className="text-lg font-bold text-right w-full md:max-w-md space-y-4">
    <p>Item Cost: ₹{form.getValues("Grandtotal").toFixed(0)}</p>
    <p>GST: ₹{Math.round(gstTotal)}</p>

    {/* Show Previous Balance above Grand Total for real customers */}
    {!isAnonymous && previous > 0 && (
      <p className="font-semibold">
        Previous Balance: ₹{previous.toFixed(0)}
      </p>
    )}

    {/* Always show Grand Total */}
    <div className="border p-3 rounded-lg">
      <p className="font-semibold text-red-600">
        Grand Total: ₹{form.getValues("SuperTotal").toFixed(0)}
      </p>
    </div>

    {/* Paid Amount */}
    <div>
      <FormLabel>Paid Amount</FormLabel>
      <Input
        type="number"
        value={paidamount === 0 ? "" : paidamount}
        onChange={(e) => setPaidamount(Number(e.target.value) || 0)}
        className="w-full"
      />
    </div>

    {/* Show Balance Due & Payment Status for real customers */}
    {!isAnonymous &&
      paidamount < parseFloat(String(form.getValues("SuperTotal"))) && (
        <>
          <div>
            <p className="font-medium text-red-600">Balance Due:</p>
            <Input
              type="number"
              value={balanceDue ?? 0}
              readOnly
              className="bg-gray-100 w-full"
            />
          </div>

          <div>
            <FormLabel>Payment Status</FormLabel>
            <Input
              value={paymentStatus || "N/A"}
              readOnly
              className="bg-gray-100 w-full"
            />
          </div>
        </>
      )}

    {/* Always show Return Amount */}
    <div>
      <p className="font-semibold text-red-600">
        Return Amount: ₹{refund.toFixed(0)}
      </p>
    </div>
  </div>
</div>


<Button  id="submit-btn"type="submit" className="w-full mt-6 py-3 md:max-w-md md:self-end" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Please wait...
    </>
  ) : (
    "Generate Invoice"
  )}
</Button>

          </form>
        </Form>
      </CardContent>
    </Card>
  </div>
);



};

export default Test;