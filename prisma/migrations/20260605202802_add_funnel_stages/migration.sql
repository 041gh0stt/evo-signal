-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "funnelStageId" TEXT;

-- CreateTable
CREATE TABLE "FunnelStage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunnelStage_workspaceId_order_idx" ON "FunnelStage"("workspaceId", "order");

-- CreateIndex
CREATE INDEX "Conversation_workspaceId_funnelStageId_idx" ON "Conversation"("workspaceId", "funnelStageId");

-- AddForeignKey
ALTER TABLE "FunnelStage" ADD CONSTRAINT "FunnelStage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_funnelStageId_fkey" FOREIGN KEY ("funnelStageId") REFERENCES "FunnelStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
