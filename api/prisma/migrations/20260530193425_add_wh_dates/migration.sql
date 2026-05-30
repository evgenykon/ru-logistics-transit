-- AlterTable
ALTER TABLE "order_warehouses" ADD COLUMN     "loading_date" TIMESTAMP(3),
ADD COLUMN     "unloading_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "expected_completion_date" TIMESTAMP(3);
