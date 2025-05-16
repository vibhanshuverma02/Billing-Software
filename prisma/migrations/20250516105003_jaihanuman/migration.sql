/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,month]` on the table `monthlyBalances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "monthlyBalances_employeeId_month_key" ON "monthlyBalances"("employeeId", "month");
