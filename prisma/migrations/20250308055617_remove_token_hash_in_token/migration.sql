/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `Token` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Token_tokenHash_key` ON `Token`;

-- AlterTable
ALTER TABLE `Token` DROP COLUMN `tokenHash`;
