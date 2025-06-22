-- ALTER TABLE "User"
-- ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'pending',
-- ADD COLUMN "subscriptionApprovedAt" TIMESTAMP;

-- ✅ Approve specific users manually
UPDATE "User"
SET "subscriptionStatus" = 'approved',
    "subscriptionApprovedAt" = NOW()
WHERE "email" IN (
  'vibhanshuverma.dpsr@gmail.com',
  'gurubakshkukreja147@gmail.com'
);
