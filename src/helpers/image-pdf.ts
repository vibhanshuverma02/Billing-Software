import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Converts an image buffer to a base64-encoded single-page PDF.
 * @param imageBuffer - The input image buffer (e.g. JPEG, PNG).
 * @returns A base64-encoded string of the resulting PDF.
 */
export async function generatePdfBase64FromImage(imageBuffer: Buffer): Promise<string> {
  // Convert image to JPEG buffer (standardizing format)
  const jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();

  // Create a new PDF and embed the JPEG
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(jpegBuffer);

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  // Serialize PDF and convert to base64
  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  return pdfBase64;
}

