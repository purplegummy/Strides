-- CreateTable
CREATE TABLE "Pin" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinUpvote" (
    "id" TEXT NOT NULL,
    "pinId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pin_createdById_idx" ON "Pin"("createdById");

-- CreateIndex
CREATE INDEX "Pin_lat_lng_idx" ON "Pin"("lat", "lng");

-- CreateIndex
CREATE INDEX "PinUpvote_pinId_userId_idx" ON "PinUpvote"("pinId", "userId");

-- AddForeignKey
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinUpvote" ADD CONSTRAINT "PinUpvote_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinUpvote" ADD CONSTRAINT "PinUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
