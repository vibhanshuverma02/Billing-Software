'use client';

import React from 'react';
import { Document, Page, View, Image, StyleSheet } from '@react-pdf/renderer';

interface Props {
  barcodeBase64: string;
  count: number;
}

// --- Constants ---
const MM = (value: number) => value * 2.835; // mm to pt conversion

const LABEL_WIDTH = 63.5;
const LABEL_HEIGHT = 38.1;
const COLUMNS = 3;
const ROWS = 7;
const HORIZONTAL_GAP = 2.05;
const PAGE_MARGIN_LEFT_ = 6.5;
const PAGE_MARGIN_Right_ = 7.5;
const PAGE_MARGIN_TOP = 9.1;
const PAGE_MARGIN_BOTTOM = 9.1;

const LABELS_PER_PAGE = COLUMNS * ROWS;

// --- Component ---
export const BarcodePDF = ({ barcodeBase64, count }: Props) => {
  const labelsToRender = Array.from({ length: Math.min(count, LABELS_PER_PAGE) });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.grid}>
          {labelsToRender.map((_, index) => {
            const isLastColumn = (index + 1) % COLUMNS === 0;

            return (
              <View
  key={index}
  style={[
    styles.cell,
    isLastColumn ? {} : { marginRight: MM(HORIZONTAL_GAP) },
  ]}
>

                <Image src={barcodeBase64} style={styles.barcode} />
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  page: {
    paddingTop: MM(PAGE_MARGIN_TOP),
    paddingBottom: MM(PAGE_MARGIN_BOTTOM),
    paddingLeft: MM(PAGE_MARGIN_LEFT_),
    paddingRight: MM(PAGE_MARGIN_Right_),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: MM(210 - ( PAGE_MARGIN_LEFT_+ PAGE_MARGIN_Right_)),
  },
  cell: {
    width: MM(LABEL_WIDTH),
    height: MM(LABEL_HEIGHT),
    alignItems: 'center',
    justifyContent: 'center',
    border: '0.5px solid black', // <-- Bounding box added here
  },
  barcode: {
    width: MM(63.1), // inner padding
    height: MM( 38.1 ),
  },
});
