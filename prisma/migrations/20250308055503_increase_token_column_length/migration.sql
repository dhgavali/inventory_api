/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Token_token_key` ON `Token`;

-- AlterTable
ALTER TABLE `Token` ADD COLUMN `tokenHash` VARCHAR(255) NOT NULL,
    MODIFY `token` TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Token_tokenHash_key` ON `Token`(`tokenHash`);
