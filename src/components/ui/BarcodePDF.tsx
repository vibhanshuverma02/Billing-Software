'use client';

import React from 'react';
import { Document, Page, View, Image, StyleSheet } from '@react-pdf/renderer';

interface Props {
  barcodeBase64: string;
  count: number;
}

export const BarcodePDF = ({ barcodeBase64, count }: Props) => {
  const copies = Array.from({ length: Math.min(count, 12) }); // Max 12 per page

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.grid}>
          {copies.map((_, idx) => (
            <View key={idx} style={styles.cell}>
              <Image src={barcodeBase64} style={styles.barcode} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

const mm = (value: number) => value * 2.835;

const styles = StyleSheet.create({
  page: {
    padding: 0, // No margin
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: mm(100),     // 100mm width
    height: mm(44.15),  // 44.15mm height
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcode: {
    width: mm(100),
    height: mm(44.15),
  },
});
