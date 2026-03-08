-- CreateTable
CREATE TABLE "MemoryLink" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemoryLink_fromId_toId_key" ON "MemoryLink"("fromId", "toId");

-- AddForeignKey
ALTER TABLE "MemoryLink" ADD CONSTRAINT "MemoryLink_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Memory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryLink" ADD CONSTRAINT "MemoryLink_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Memory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
