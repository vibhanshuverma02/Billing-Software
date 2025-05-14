/*
  Warnings:

  - A unique constraint covering the columns `[chequeNo,uniqueNo]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.
  - Made the column `chequeNo` on table `Bill` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `chequeNo` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueNo` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Bill_uniqueNo_key";

-- AlterTable
ALTER TABLE "Bill" ALTER COLUMN "chequeNo" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "chequeNo" TEXT NOT NULL,
ADD COLUMN     "uniqueNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bill_chequeNo_uniqueNo_key" ON "Bill"("chequeNo", "uniqueNo");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_chequeNo_uniqueNo_fkey" FOREIGN KEY ("chequeNo", "uniqueNo") REFERENCES "Bill"("chequeNo", "uniqueNo") ON DELETE RESTRICT ON UPDATE CASCADE;
