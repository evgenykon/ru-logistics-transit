-- CreateTable
CREATE TABLE "track_points" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "vehicle_id" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "direction" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT DEFAULT 'manual',

    CONSTRAINT "track_points_pkey" PRIMARY KEY ("id")
);
