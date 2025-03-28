"use client";
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface InvoicePDFProps {
  invoiceNo: string;
  date: string;
  username: string;
  customerID:string;
  customerName: string;
  mobileNo: string;
  address: string;
  items: {
    itemName: string;
    hsn: string;
    rate: number;
    quantity: number;
    gstRate: number;
  }[];
  Grandtotal: number;
  gstTotal: number;
  paidAmount: number;
  balanceDue: number | null;
  paymentStatus: string | null;
}

// ✅ PDF Styles
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Times-Roman',
        fontSize: 12,
        padding: 30,
      },
      header: {
        textAlign: 'right',
        marginBottom: 20,
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
      },
      section: {
        marginBottom: 20,
        lineHeight: 1.5,
      },
      user:{
        textAlign: 'left',
        fontSize: 10,
        marginTop: 30,
        color: '#555',
      },
      billTo: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      paymentStatus: {
        textAlign: 'right',
        fontSize: 12,
        backgroundColor: '#f2f2f2',
        padding: 5,
        borderRadius: 5,
        width: 'auto',
        alignSelf: 'flex-end',
        marginBottom: 10,
      },
      table: {
        display: 'flex',       
        flexDirection: 'column', width: '100%', borderStyle: 'solid', borderWidth: 1
      },
      tableRow: {
        flexDirection: 'row',
      },
      tableHeader: {
        backgroundColor: '#f2f2f2',
        fontWeight: 'bold',
      },
      tableCol: {
        width: '16.66%',
        padding: 5,
        border: '1px solid #000',
        textAlign: 'center',
      },
      totals: {
        textAlign: 'right',
        marginTop: 10,
      },
      footer: {
        textAlign: 'center',
        fontSize: 10,
        marginTop: 30,
        color: '#555',
      },
});

// ✅ PDF Component
const InvoicePDF = ({

  invoiceNo,
  date,
  username,
  customerID,
  customerName,
  mobileNo,
  address,
  items,
  Grandtotal,
  gstTotal,
  paidAmount,
  balanceDue,
  paymentStatus,
}: InvoicePDFProps) => (
    <Document>
    <Page size="A3" style={styles.page}>
    <View style={styles.user}>
        <Text>{username}</Text>
        <Text>Address: Main Market Roorkee</Text>
        <Text>Contact: 9999999999</Text>
       <Text>GST: XXXXXXXXXXXXX</Text> 
      </View>
      
      {/* ✅ Header Section */}
      <View style={styles.header}>
        <Text>Invoice No: {invoiceNo}</Text>
        <Text>Date: {new Date(date).toLocaleString()}</Text>
      </View>

      <Text style={styles.title}>TAX INVOICE</Text>

      {/* ✅ Bill To Section */}
      <View style={styles.section}>
        <Text style={styles.billTo}>Bill To:</Text>
        <Text>Customer: {customerName}</Text>
        <Text>Address: {address}</Text>
        <Text>Contact: {mobileNo}</Text>
      </View>

      <View style={styles.paymentStatus}>
        <Text>Payment Status: {paymentStatus}</Text>
      </View>

      {/* ✅ Invoice Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCol}>Product</Text>
          <Text style={styles.tableCol}>HSN</Text>
          <Text style={styles.tableCol}>Qty</Text>
          <Text style={styles.tableCol}>Rate</Text>
          <Text style={styles.tableCol}>GST %</Text>
          <Text style={styles.tableCol}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCol}>{item.itemName}</Text>
            <Text style={styles.tableCol}>{item.hsn}</Text>
            <Text style={styles.tableCol}>{item.quantity}</Text>
            <Text style={styles.tableCol}>₹{item.rate.toFixed(2)}</Text>
            <Text style={styles.tableCol}>{item.gstRate}%</Text>
            <Text style={styles.tableCol}>
              ₹{(item.rate * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* ✅ Totals */}
      <View style={styles.totals}>
        <Text>Subtotal: ₹{(Grandtotal - gstTotal).toFixed(2)}</Text>
        <Text>GST: ₹{gstTotal.toFixed(2)}</Text>
        <Text>Grand Total: ₹{Grandtotal.toFixed(2)}</Text>
        <Text>Paid Amount: ₹{paidAmount.toFixed(2)}</Text>
        <Text>Balance Due: ₹{balanceDue}</Text>
      </View>

      {/* ✅ Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>For any queries, please contact us at support@company.com</Text>
        <Text>© 2025 Kukreja Saree Center. All rights reserved.</Text>
      </View>
      
    </Page>
  </Document>
);


export default InvoicePDF;