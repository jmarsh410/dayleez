-- CreateTable
CREATE TABLE "DigoutGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "grid" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigoutGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigoutGame_userId_date_key" ON "DigoutGame"("userId", "date");

-- AddForeignKey
ALTER TABLE "DigoutGame" ADD CONSTRAINT "DigoutGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

