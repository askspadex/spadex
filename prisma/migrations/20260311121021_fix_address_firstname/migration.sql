/*
  Warnings:

  - You are about to alter the column `basePrice` on the `ProductCost` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `shipping` on the `ProductCost` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "ProductCost" ALTER COLUMN "basePrice" SET DATA TYPE INTEGER,
ALTER COLUMN "shipping" SET DATA TYPE INTEGER;
