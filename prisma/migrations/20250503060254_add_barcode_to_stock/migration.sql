/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Stock_barcode_key" ON "Stock"("barcode");
