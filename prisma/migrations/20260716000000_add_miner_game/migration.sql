-- CreateTable
CREATE TABLE "public"."MinerGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "grid" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinerGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinerGame_userId_date_key" ON "public"."MinerGame"("userId" ASC, "date" ASC);

-- AddForeignKey
ALTER TABLE "public"."MinerGame" ADD CONSTRAINT "MinerGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

