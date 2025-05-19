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
const Test = () => {
  const { data: session, status } = useSession();  // ✅ Fetch session
 const [username, setUsername] = useState<string | null>(null);
 const [customerID, setCustomerID]=useState<string|null>(null);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [gstTotal, setGstTotal] = useState<number>(0);
  const [previous, setPrevious]=useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidamount,  setPaidamount] = useState<number>(0);
  const [refund, setRefund] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // const[invoiceId , setInvoiceID]= useState<number>(0);
  
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

  if (isAnonymous) return;

  // ✅ Clear message when both fields are empty
  if (!name && !mobile) {
    dispatch({ type: "SET_MESSAGE", payload: "" });
    return;
  }

  // ✅ Trigger fetch if mobile number is valid
  if (/^\d{10}$/.test(mobile)) {
    debouncedFetch(fetchCustomer, 500);
  }
}, [state.customername, state.customermobileNo, isAnonymous, debouncedFetch, fetchCustomer]);

// ✅ Prefill customer info from URL params
const searchParams = useSearchParams();

useEffect(() => {
  const nameFromURL = searchParams.get("customerName");
  const mobileFromURL = searchParams.get("mobileNo");

  if (nameFromURL) {
    dispatch({ type: "SET_NAME", payload: nameFromURL });
  }

  if (mobileFromURL) {
    dispatch({ type: "SET_MOBILE", payload: mobileFromURL });
  }
}, [searchParams]);


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
      paidAmount: 0,
      previous:0,
      Grandtotal: 0,
      SuperTotal: 0,
      Refund:0,
      items: []
    },
  });
  // 
    const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });
  useEffect(() => {
    form.setValue("customerName", state.customername);
    form.setValue("mobileNo", state.customermobileNo);
    
  }, [state.customername, state.customermobileNo , form]);
  
  

  // Debounced Calculation Function
  const calculateTotals = useDebounceCallback(() => {
    const subtotal = fields.reduce((sum, item) => sum + item.rate * item.quantity, 0);
    const gst = fields.reduce((sum, item) => sum + (item.rate * item.quantity * item.gstRate) / 100, 0);
    const grandTotal = subtotal + gst;
    const superTotal = grandTotal + previous;
    form.setValue("previous", previous)
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

  
  // ✅ Correct: Remove calculateTotals from dependencies to avoid infinite loop
  useEffect(() => {
    calculateTotals();
  }, [paidamount, fields, previous,calculateTotals]);
  
  const [selectedStock, setSelectedStock] = useState<InvoiceFormData["items"][number] |  null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [gstRate, setGstRate] = useState<number>(12);
  
  // useEffect(() => {
  //   const refund = paidamount - (form.getValues("SuperTotal") || 0);
  //   form.setValue("Refund", refund);
  // }, [paidamount, form]);
  

  // ✅ Add Item to Invoice Table
  const addItem = (item?: StockItem) => {
    const stock = item || selectedStock;
  
    if (!stock) {
      toast.error("Please select a product!");
      return;
    }
  
    const finalQuantity = item?.quantity ?? quantity;
    const finalGstRate = item?.gstRate ?? gstRate;
  
    append({
      itemName: stock.itemName,
      hsn: stock.hsn,
      rate: stock.rate,
      quantity: finalQuantity,
      gstRate: finalGstRate,
    });
  
    // Reset only if added from manual selection
    if (!item) {
      setSelectedStock(null);
      setQuantity(1);
      setGstRate(3);
    }
  };
  

  // // ✅ Clear Form
  // const clearForm = () => {
  //   form.reset();
  //   form.setValue("Grandtotal", 0)
  //   setGstTotal(0);
  //   setBalanceDue(null);
  //   setPaymentStatus(null);
  // };

  

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
      setBalanceDue(response.data.balanceDue);
      setPaymentStatus(response.data.paymentStatus);


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
        address={form.getValues("address") || "NA"}
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
    saveAs(blob, fileName);
    const base64 = await blob.arrayBuffer().then(buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
  );

    // ✅ Update only the PDF path in the database (no new invoice)
    // const pdfPath = `C:/Users/Client/Downloads/${fileName}`;
    console.log(invoiceId)
    await axios.put("/api/invoice", { invoiceId: invoiceId, pdfBufferBase64: base64 });

    alert("PDF generated and path saved!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF.");
  }
};

  return (
  <div className="flex items-center justify-center min-h-screen px-4">
    <Card className="w-full max-w-4xl max-h-screen overflow-y-auto shadow-md rounded-lg p-6">
      <CardHeader className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600">Generate Invoice</h1>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormItem>
                <FormLabel>Invoice No</FormLabel>
                <Input placeholder="Loading..." value={invoiceNo || ""} readOnly className="w-full" />
              </FormItem>
              <FormItem>
                <FormLabel>Order Date</FormLabel>
                <Input placeholder="Loading..." value={date || ""} readOnly className="w-full" />
              </FormItem>
            </div>
<div className="flex items-center space-x-2 mb-4">
  <input
    type="checkbox"
    checked={isAnonymous}
    onChange={(e) => {
      const checked = e.target.checked;
      setIsAnonymous(checked);
      if (checked) {
        dispatch({ type: "SET_NAME", payload: "NA" });
        dispatch({ type: "SET_MOBILE", payload: "0000000000" });
      } else {
        dispatch({ type: "SET_NAME", payload: "" });
        dispatch({ type: "SET_MOBILE", payload: "" });
      }
    }}
    id="anonymousToggle"
    className="h-5 w-5"
  />
  <label htmlFor="anonymousToggle" className="text-sm font-medium text-gray-700">
    genrate bill for non saree and lehenge customers
  </label>
</div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

              <div className="col-span-3">
                {state.isCheckingCustomer && <Loader2 className="animate-spin" />}
                {!state.isCheckingCustomer && state.customerdetialsMessage && (
                  <p
                    className={`text-sm ${
                      state.customerdetialsMessage.includes("New")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {state.customerdetialsMessage}
                  </p>
                )}
              </div>

              <Controller
                name="address"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Customer Address</FormLabel>
                    <Textarea placeholder="Enter customer address" {...field} className="w-full" />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock Selection */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
              <div className="flex-1 space-y-4">
                <ScannerPage onSelect={(item) => append(item)} />
                <StockSelect onSelect={(stock) => setSelectedStock(stock)} />
                <Input
                  value={selectedStock ? selectedStock.itemName : ""}
                  readOnly
                  className="bg-gray-100 text-gray-800 w-full"
                />
                <p className="text-lg font-medium">
                  Selected Product:{" "}
                  <span className="text-blue-600">
                    {selectedStock?.itemName || "No product selected"}
                  </span>
                </p>
              </div>

              <FormItem className="w-full md:w-32">
                <FormLabel>Quantity</FormLabel>
                <Input
                  type="number"
                  value={quantity}
                  min={0}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full"
                />
              </FormItem>

              <FormItem className="w-full md:w-32">
                <FormLabel>GST %</FormLabel>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300"
                >
                  {[0, 3, 5, 12, 18, 28].map((gst) => (
                    <option key={gst} value={gst}>
                      {gst}%
                    </option>
                  ))}
                </select>
              </FormItem>

             <Button type="button" onClick={() => addItem()} className="bg-blue-600 text-white">
                Add Item
              </Button>

            </div>

            {/* Invoice Table */}
            <div className="overflow-x-auto">
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
                     {/* Quantity with DebouncedInput */}
          <TableCell>
  <DebouncedInput
    type="number"
    value={item.quantity}
    onDebouncedChange={(value) => update(index, { ...item, quantity: value })}
    onTotalCalculate={calculateTotals} // Trigger total calculation after debounce
  />
</TableCell>

<TableCell>
  <DebouncedInput
    type="number"
    value={item.rate}
    onDebouncedChange={(value) => {
      update(index, { ...item, rate: value });
      // No need to call calculateTotals here because it's handled in DebouncedInput
    }}
    onTotalCalculate={calculateTotals} // Trigger total calculation after debounce
  />
</TableCell>

                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        ₹{(item.rate * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}
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
            </div>

            {/* Payment Section */}
            <div className="flex flex-col md:flex-row justify-end mt-8 gap-6">
              <div className="text-lg font-bold space-y-4 text-right w-full max-w-md">
                <p>Sub Total: ₹{fields.reduce((sum, item) => sum + item.rate * item.quantity, 0)}</p>
                <p>GST: ₹{gstTotal}</p>
                <p>Total: ₹{form.getValues("Grandtotal").toFixed(2)}</p>
              
                <div className="border p-3 rounded-lg">
                  <p className="font-semibold">Previous Balance: ₹{previous.toFixed(2)}</p>
                  <p className="font-semibold text-red-600">
                    GrandTotal: ₹{form.getValues("SuperTotal").toFixed(2)}
                  </p>
                </div>
                

                <div>
                  <FormLabel>Paid Amount</FormLabel>
                <Input
  type="number"
  value={paidamount === 0 ? "" : paidamount}
  onChange={(e) => setPaidamount(Number(e.target.value) || 0)}
  className="w-full"
/>

                </div>

                <div>
                  <p className="font-medium text-red-600">Balance Due:</p>
                  <Input type="number" value={balanceDue ?? 0} readOnly className="bg-gray-100 w-full" />
                </div>

                <div>
                  <FormLabel>Payment Status</FormLabel>
                  <Input
                    value={paymentStatus || "N/A"}
                    readOnly
                    className="bg-gray-100 w-full"
                  />
                </div>

                <div>
                  <p className="font-semibold text-red-600">Return Amount: ₹{refund.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 py-3" disabled={isSubmitting}>
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