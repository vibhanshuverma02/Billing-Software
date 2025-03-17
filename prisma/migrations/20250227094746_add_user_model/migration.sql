/*
  Warnings:

  - You are about to drop the column `forgotPasswordExpire` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `forgotPasswordToken` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `verifyTokenExpire` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `forgotPasswordExpire`,
    DROP COLUMN `forgotPasswordToken`,
    DROP COLUMN `isAdmin`,
    DROP COLUMN `verifyTokenExpire`;
