-- CreateTable
CREATE TABLE "MonthlyBalance" (
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

    CONSTRAINT "MonthlyBalance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonthlyBalance" ADD CONSTRAINT "MonthlyBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
