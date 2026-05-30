/*
  Warnings:

  - You are about to drop the column `warehouse_id` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "warehouse_id";

-- CreateTable
CREATE TABLE "order_warehouses" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'origin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_warehouses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_warehouses" ADD CONSTRAINT "order_warehouses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
