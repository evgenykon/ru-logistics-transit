-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "loading_time_of_day" TEXT,
ADD COLUMN     "timezone" TEXT DEFAULT '+3',
ADD COLUMN     "use_local_time" BOOLEAN NOT NULL DEFAULT false;
