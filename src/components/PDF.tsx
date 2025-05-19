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
      fontSize: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    header: {
      textAlign: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 4,
    },
    section: {
      marginVertical: 4,
      lineHeight: 1.3,
    },
    user: {
      textAlign: 'left',
      fontSize: 7,
      color: '#555',
    },
    billTo: {
      fontSize: 6,
      fontWeight: 'bold',
    },
    paymentStatus: {
      fontSize: 6,
      backgroundColor: '#f2f2f2',
      padding: 2,
      borderRadius: 1,
      alignSelf: 'flex-end',
      marginBottom: 4,
    },
    table: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 1,
      marginTop: 6,
    },
    tableRow: {
      flexDirection: 'row',
    },
    tableHeader: {
      backgroundColor: '#f2f2f2',
      fontWeight: 'bold',
    },
    tableCol: {
      width: '20%',
      padding: 3,
      border: '1px solid #000',
      fontSize: 7,
      textAlign: 'center',
    },
    totals: {
      textAlign: 'right',
      marginTop: 6,
    },
    footerContainer: {
      marginTop: 'auto',
      paddingTop: 6,
    },
    footer: {
      textAlign: 'center',
      fontSize: 7,
      color: '#555',
      marginTop: 4,
    },
    bilingualText: {
      fontFamily: 'NotoSansDevanagari',
      fontSize: 7,
      textAlign: 'center',
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
  paymentStatus,
}: InvoicePDFProps) => {
  const styles = getStyles(pageSize);

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        <Image
          src="/images/final2-Photoroom.png"
          style={{ width: 60, height: 40, alignSelf: 'center', marginBottom: 6 }}
        />

        <View style={styles.header}>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>KUKREJA SAREE CENTER</Text>
          <Text style={styles.bilingualText}>(सरदार जी )</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 8 }}>GST: 05ASTPK6699N1ZJ</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Address: Arya Samaj road B.T. Ganj Roorkee</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Contact: 8439751861</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
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
            <Text>Customer: {customerName}</Text>
            <Text>Address: {address}</Text>
            <Text>Contact: {mobileNo}</Text>
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
          <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
            Grand Total: ₹{Grandtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footer}>Thank you visit again!</Text>
          <Text style={styles.bilingualText}>
            फॉल की सभी साड़ियाँ और लहंगे के लिए कृपया बिल साथ लाएँ, क्योंकि बिना बिल के सामान नहीं मिलेगा।
          </Text>
          <Text style={styles.footer}>No Claim No Exchange</Text>
          <Text style={styles.footer}>For any queries, please contact us at 8439751861</Text>
          <Text style={styles.footer}>
            © kukreja saree center Arya Samaj road B.T. Ganj Roorkee 247667. All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;



