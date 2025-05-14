'use client';

import React from 'react';
import { Document, Page, View, Image, StyleSheet } from '@react-pdf/renderer';

interface Props {
  barcodeBase64: string;
  count: number;
}

export const BarcodePDF = ({ barcodeBase64, count }: Props) => {
  const copies = Array.from({ length: count });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.imageGrid}>
          {copies.map((_, idx) => (
            <View key={idx} style={styles.imageWrapper}>
              <Image src={barcodeBase64} style={styles.image} />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  imageWrapper: {
    marginRight: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 80,
  },
});
