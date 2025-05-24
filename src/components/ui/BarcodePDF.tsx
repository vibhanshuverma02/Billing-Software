'use client';

import React from 'react';
import { Document, Page, View, Image, StyleSheet ,Text } from '@react-pdf/renderer';

interface Props {
  barcodeBase64: string;
  count: number;
}


// --- Constants ---
const CM = (value: number) => value * 28.346; // cm to pt conversion

const LABEL_WIDTH_CM = 6.398;
const LABEL_HEIGHT_CM = 3.8;
const HORIZONTAL_GAP_CM = 0.203;
const VERTICAL_GAP_CM = 0; // You said no gap between rows
const COLUMNS = 3;
const ROWS = 7;

const PAGE_MARGIN_Right_CM = 0.688;
const PAGE_MARGIN_LEFT_CM = 0.712 ;
const PAGE_MARGIN_TOP_CM = 1.484;
const PAGE_MARGIN_BOTTOM_CM = 1.616;

const BARCODE_WIDTH_CM = 5.721;
const BARCODE_HEIGHT_CM = 2.861;

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
            const isLastRow = Math.floor(index / COLUMNS) === ROWS - 1;

            return (
              <View
                key={index}
               style={[
  styles.cell,
  ...(!isLastColumn ? [{ marginRight: CM(HORIZONTAL_GAP_CM) }] : []),
  ...(!isLastRow ? [{ marginBottom: CM(VERTICAL_GAP_CM) }] : []),
]}

              >
                <Image src={barcodeBase64} style={styles.barcode} />
                <Text style={styles.centerName}>KUKREJA SAREE CENTER</Text>
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
    paddingTop: CM(PAGE_MARGIN_TOP_CM),
    paddingBottom: CM(PAGE_MARGIN_BOTTOM_CM),
    paddingLeft: CM(PAGE_MARGIN_LEFT_CM),
    paddingRight: CM(PAGE_MARGIN_Right_CM),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CM(210 - (PAGE_MARGIN_LEFT_CM + PAGE_MARGIN_Right_CM)),
  },
  cell: {
    width: CM(LABEL_WIDTH_CM),
    height: CM(LABEL_HEIGHT_CM),
    alignItems: 'center',
    justifyContent: 'center',
 
  },
 barcode: {
    width: CM(BARCODE_WIDTH_CM),
    height: CM(BARCODE_HEIGHT_CM),
  },
  centerName: {
    fontSize: 5,
    marginTop: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
