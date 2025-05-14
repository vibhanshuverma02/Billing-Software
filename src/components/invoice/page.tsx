"use client";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockSchema } from "@/schema/stockSchema";
import { invoiceschema } from "@/schema/invoiceschema";


import { z } from "zod";
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import StockSelect from "@/components/ui/stockselection";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// import BarcodeSelect from "../ui/barcode";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import { ApiResponse } from "@/type/ApiResponse";

type InvoiceFormData = z.infer<typeof invoiceschema>& {
  items: z.infer<typeof stockSchema>["items"];
};

const InvoiceForm = () => {
  const { data: session, status } = useSession();  // ✅ Fetch session
 const [username, setUsername] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [gstTotal, setGstTotal] = useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

   // ✅ Customer Details
   const [customername, setCustomername] = useState("");
   const [customermobileNo, setCustomermobileNo] = useState("");
   const [customerdetialsMessage, setCustomerdetialsMessage] = useState<string>("");
   const [isCheckingcustomerdetials, setIsCheckingcustomerdetials] = useState(false);
   const [isValid, setIsValid] = useState(false);  // ✅ Validation state flag
  //  const debouncedName = useDebounceCallback( setCustomername,300);

  // const debouncedMobile = useDebounceCallback(
  //   setCustomermobileNo, 300);


  
  useEffect(() => {
  if (status === "authenticated" && session?.user) {
    // ✅ Extract username from session
    console.log(session.user.username);
    setUsername(session.user.username || "Guest");
  }
}, [session, status]);


// ✅ Use debouncing to prevent excessive API calls
const debounce = (func: () => void, delay: number) => {
  let timer: NodeJS.Timeout;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
};

// ✅ Validate Fields before making API call
const validateFields = () => {
  if (!customername.trim() ||!customermobileNo.trim()) {
    setCustomerdetialsMessage("");  
    console.log("Fields cleared, no message");
    setIsValid(false);   // ✅ Prevent unnecessary validation message
    return false;
  }

  if (customermobileNo && !/^\d{10}$/.test(customermobileNo)) {
    setCustomerdetialsMessage("Mobile number must be 10 digits.");
    console.log("Invalid Mobile Number");
    setIsValid(false);
    return false;
  }

  setIsValid(true);  // ✅ Set valid state only if fields pass validation
  return true;
};

const fetchCustomers = useCallback(async () => {
  if (!isValid || status !== "authenticated") return;  // ✅ Skip invalid or unauthenticated requests

  setIsCheckingcustomerdetials(true);
  setCustomerdetialsMessage("");

  try {
    console.log("API call initiated");
    const response = await axios.get(`/api/invoice`, {
      params: {
        customerName: customername || undefined,
        customermobileNo: customermobileNo || undefined,
      },
    });

    console.log("API call successful");
    setCustomerdetialsMessage(response.data.message);
    console.log(response.data.customer)
    setIsValid(false);
  } catch (error) {
    console.error("Error fetching customers:", error);
    const axiosError = error as AxiosError<ApiResponse>;
    setCustomerdetialsMessage(
      axiosError.response?.data.message ?? 'Error checking username'    );
  } finally {
    setIsCheckingcustomerdetials(false);
  }
}, [customername, customermobileNo, isValid, status]);

useEffect(() => {
  validateFields();
}, [customername, customermobileNo , validateFields]);  // ✅ Run validation on field changes

useEffect(() => {
  if (isValid) {
    const debouncedFetch = debounce(fetchCustomers, 500);
    debouncedFetch();
  }
}, [isValid, fetchCustomers]);

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
  // const form = useForm<InvoiceFormData>({
  //   resolver: zodResolver(stockSchema),
  //   defaultValues: {
  //    []
  //   },
  // });

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
  }, [fields]);

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
      // id: selectedStock.id,
      itemName: selectedStock.itemName,
      hsn: selectedStock.hsn,
      rate: selectedStock.rate,
      quantity:selectedStock.quantity,
      gstRate: selectedStock.gstRate,
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


  const onSubmit = async () => {
    const formData:InvoiceFormData  = form.getValues();  // Collect entire form data

    console.log("Submitting:", formData);
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/invoice", formData);
      
      console.log("API Response:", response.data);
      
      setInvoiceNo(response.data.invoice.invoiceNo);
      setDate(response.data.invoice.invoiceDate);
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
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <Input
                    {...field}
                    value={field.value}  // Display field value
                    onChange={(e) => {
                      field.onChange(e);   // ✅ Update form field value
                      const value = e.target.value.trim();

                      // ✅ Clear the message immediately when field is empty
                      if (value === "") {
                        setCustomerdetialsMessage("");
                      } else {
                        setCustomername(value);
                      }
                    }}
                  />
                  {isCheckingcustomerdetials && <Loader2 className="animate-spin" />}
                  {!isCheckingcustomerdetials && customerdetialsMessage && (
                    <p
                      className={`text-sm ${
                       customerdetialsMessage === "Username is unique"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {customerdetialsMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ Customer Mobile */}
            <Controller
              name="mobileNo"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <Input
                    {...field}
                    value={field.value}  // Display field value
                    onChange={(e) => {
                      field.onChange(e);   // ✅ Update form field value
                      const value = e.target.value.trim();

          // ✅ Clear the message immediately when field is empty
          if (value === "") {
            setCustomerdetialsMessage("");
          } else {
            setCustomermobileNo(value);
          }
        }}
      />
                  {isCheckingcustomerdetials && <Loader2 className="animate-spin" />}
                  {!isCheckingcustomerdetials && customerdetialsMessage && (
                    <p
                      className={`text-sm ${
                        customerdetialsMessage === 'mobile no is unique'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {customerdetialsMessage}
                    </p>
                  )}
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Address</FormLabel>
                    <Textarea placeholder="Enter customer address" {...field} />
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

               {/* Stock Selection Using StockSelect Component */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                {/* <label className="block text-sm font-medium text-gray-700">Select Product</label> */}
                <StockSelect
                  onSelect={(stock) => setSelectedStock(stock)}
                />
               {/* <BarcodeSelect
        onSelect={(item) => {
          append(item); // ✅ Direct append — no state needed
        }}
      />         */}
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
    {/* <Input 
      type="number" 
      value={fields.reduce((sum, item) => sum + item.rate * item.quantity, 0)} 
      readOnly 
      className="bg-gray-100"
    /> */}
  {/* </div>
  </div> */}

  {/* GST Total */}
  {/* <div className="flex flex-col">
    <FormLabel className="text-gray-600 text-sm">GST Total</FormLabel>
    <Input 
      type="number" 
      value={gstTotal} 
      readOnly 
      className="bg-gray-100"
    />
  </div> */}

  {/* Grand Total */}
  {/* <div className="flex flex-col">
    <FormLabel className="text-gray-600 text-sm font-semibold">Grand Total</FormLabel>
    <Input 
      type="number"  
      {...form.register("Grandtotal", { valueAsNumber: true })} 
      readOnly 
      className="bg-gray-100 font-bold text-lg"
    />
  </div> */}

  {/* Paid Amount */}
  {/* <FormField control={form.control} name="paidAmount" render={({ field }) => ( */}
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
  {/* )} /> */}

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
                'GenerateBill'
              )}
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    
  );
};

export default InvoiceForm;