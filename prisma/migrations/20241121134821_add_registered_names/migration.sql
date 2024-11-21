/*
  Warnings:

  - You are about to alter the column `price` on the `Formation` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "registered_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
