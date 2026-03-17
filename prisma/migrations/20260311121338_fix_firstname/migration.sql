/*
  Warnings:

  - You are about to drop the column `firtName` on the `Address` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "firtName",
ADD COLUMN     "firstName" TEXT NOT NULL;
