"use client";
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

interface InvoicePDFProps {
  pageSize: 'A4' | 'A5';
  invoiceNo: string;
  date: string;
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
  previousBalance: number;
  paidAmount: number;
  balanceDue: number | null;
  paymentStatus: string | null;
}

Font.register({
  family: 'NotoSans',
  src: '/font/NotoSans-Regular.ttf',
});

Font.register({
  family: 'NotoSansDevanagari',
  src: '/font/NotoSansDevanagari-Regular.ttf',
});

const getStyles = (pageSize: 'A4' | 'A5') =>
  StyleSheet.create({
    page: {
      fontFamily: 'NotoSans',
      fontSize: pageSize === 'A4' ? 8 : 8,
      padding: pageSize === 'A4' ? 16 : 16,
    },
    header: {
      textAlign: 'right',
      margintop: pageSize === 'A4'? 5 : 5 ,
      marginBottom: pageSize === 'A4' ? 5 : 5,
    },
    title: {
      fontSize: pageSize === 'A4' ? 12 : 12,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: pageSize === 'A4' ? 4 : 4,
    },
    section: {
      marginBottom: pageSize === 'A4' ? 5 : 5,
      lineHeight: 1.3,
    },
    user: {
      textAlign: 'left',
      fontSize: pageSize === 'A4' ? 7 : 7,
      marginTop: pageSize === 'A4' ? 14 : 14,
      color: '#555',
    },
    billTo: {
      fontSize: pageSize === 'A4' ? 6 : 6,
      fontWeight: 'bold',
      
    },
    paymentStatus: {
      textAlign: 'right',
      fontSize: pageSize === 'A4' ? 6 : 6,
      backgroundColor: '#f2f2f2',
      padding: pageSize === 'A4' ? 2 : 2,
      borderRadius: 1,
      alignSelf: 'flex-end',
      marginBottom: pageSize === 'A4' ? 1 : 1,
    },
    table: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 1,
      marginTop: pageSize === 'A4' ? 5 : 5,
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
      padding: pageSize === 'A4' ? 3 : 3,
      border: '1px solid #000',
      fontSize: pageSize === 'A4' ? 7 : 7,
      textAlign: 'center',
    },
    totals: {
      textAlign: 'right',
      marginTop: pageSize === 'A4' ? 6 : 6,
    },
    totalText: {
      fontSize: pageSize === 'A4' ? 6 : 6,
      marginBottom: pageSize === 'A4' ? 4: 4,
    },
    footer: {
      textAlign: 'center',
      fontSize: pageSize === 'A4' ? 7 : 7,
      marginTop: pageSize === 'A4' ? 16: 16,
      color: '#555',
    },
    bilingualText: {
      fontFamily: 'NotoSansDevanagari',
      fontSize: pageSize === 'A4' ? 7 : 7,
      textAlign: 'center',
      marginTop: pageSize === 'A4' ? 10 : 10,
      lineHeight: 1.5,
    },
  });

const InvoicePDF = ({
  pageSize,
  invoiceNo,
  date,
  customerName,
  mobileNo,
  address,
  items,
  Grandtotal,
  gstTotal,
  previousBalance,
  paidAmount,
  balanceDue,
  paymentStatus,
}: InvoicePDFProps) => {
  const styles = getStyles(pageSize);

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        <Image
          src="/images/final2-Photoroom.png"
          style={{ width: pageSize === 'A4' ? 80 : 60, height: pageSize === 'A4' ? 55 : 40, alignSelf: 'center', marginBottom: pageSize === 'A4' ? 10: 5 }}
        />

        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: pageSize === 'A4' ? 18 : 10 }}>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 16 : 12 }}>KUKREJA SAREE CENTER</Text>
          <Text style={styles.bilingualText}>(सरदार जी )</Text>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 10 : 8 }}>GST: 05ASTPK6699N1ZJ</Text>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 10 : 8 }}>Address: Arya Samaj road B.T. Ganj Roorkee</Text>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 10 : 8 }}>Contact: 8439751861</Text>
        </View>

        <View
  style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: pageSize === 'A4' ? 16 : 10,
    marginBottom: pageSize === 'A4' ? 10 : 6,
  }}
>
  <View>
    <Text>Invoice No: {invoiceNo}</Text>
    <Text>Date: {new Date(date).toLocaleString()}</Text>
  </View>

  {paymentStatus && (
    <Text style={styles.paymentStatus}>Payment Status: {paymentStatus}</Text>
  )}
</View>

<Text style={styles.title}>INVOICE</Text>


       {!(customerName === 'NA' && mobileNo === '0000000000') && (
  <View style={styles.section}>
    <Text style={styles.billTo}>Bill To:</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Text style={{ flexShrink: 1 }}>Customer: {customerName}</Text>
      <Text style={{ flexShrink: 1 }}>Address: {address}</Text>
      <Text style={{ flexShrink: 1 }}>Contact: {mobileNo}</Text>
    </View>
  </View>
)}


        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol}>Product</Text>
            <Text style={styles.tableCol}>Qty</Text>
            <Text style={styles.tableCol}>Rate</Text>
            <Text style={styles.tableCol}>GST %</Text>
            <Text style={styles.tableCol}>Total</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol}>{item.itemName}</Text>
              <Text style={styles.tableCol}>{item.quantity}</Text>
              <Text style={styles.tableCol}>₹{item.rate.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{item.gstRate}%</Text>
              <Text style={styles.tableCol}>
                ₹{(item.rate * item.quantity * (1 + item.gstRate / 100)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 12 : 10 }}>
            Subtotal: ₹{(Grandtotal - (gstTotal+previousBalance) ).toFixed(2)}
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 12 : 10 }}>GST: ₹{gstTotal.toFixed(2)}</Text>
          <Text>Previous Balance: ₹{previousBalance.toFixed(2)}</Text>
          <Text style={{ fontWeight: 'bold', fontSize: pageSize === 'A4' ? 12 : 10 }}>
            Grand Total: ₹{Grandtotal.toFixed(2)}
          </Text>
          <Text>Paid Amount: ₹{paidAmount.toFixed(2)}</Text>
          <Text>Refund: ₹{Math.max(paidAmount - Grandtotal, 0).toFixed(2)}</Text>
          <Text>Balance Due: ₹{balanceDue}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Thank you visit again!</Text>
          <Text style={styles.bilingualText}>
            फॉल की सभी साड़ियाँ और लहंगे के लिए कृपया बिल साथ लाएँ, क्योंकि बिना बिल के सामान नहीं मिलेगा।
          </Text>
          <Text>No Claim No Exchange</Text>
          <Text>For any queries, please contact us at 8439751861</Text>
          <Text>© kukreja saree center Arya Samaj road B.T. Ganj Roorkee 247667. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
