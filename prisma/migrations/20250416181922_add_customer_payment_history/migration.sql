-- CreateTable
CREATE TABLE "CustomerPaymentHistory" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "remainingDue" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPaymentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerPaymentHistory" ADD CONSTRAINT "CustomerPaymentHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
