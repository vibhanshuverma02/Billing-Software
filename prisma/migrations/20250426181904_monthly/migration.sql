/*
  Warnings:

  - You are about to drop the `MonthlyBalance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MonthlyBalance" DROP CONSTRAINT "MonthlyBalance_employeeId_fkey";

-- DropTable
DROP TABLE "MonthlyBalance";

-- CreateTable
CREATE TABLE "monthlyBalances" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "carryForward" INTEGER NOT NULL,
    "salaryEarned" INTEGER NOT NULL,
    "totalDeductions" INTEGER NOT NULL,
    "netPayable" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "newCarryForward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthlyBalances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monthlyBalances" ADD CONSTRAINT "monthlyBalances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
