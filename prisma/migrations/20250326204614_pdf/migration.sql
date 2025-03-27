/*
  Warnings:

  - Added the required column `pdfUrl` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "pdfUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "customerName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "hsn" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);
