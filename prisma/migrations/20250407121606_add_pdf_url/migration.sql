/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "pdfUrl";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "pdfUrl" BYTEA;
