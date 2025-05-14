-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "emiAmount" DOUBLE PRECISION,
ADD COLUMN     "loanAmount" DOUBLE PRECISION,
ADD COLUMN     "loanRemaining" DOUBLE PRECISION,
ADD COLUMN     "loanStartMonth" TEXT,
ADD COLUMN     "manualOverride" DOUBLE PRECISION;
