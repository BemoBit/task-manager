-- CreateEnum
CREATE TYPE "PipelineState" AS ENUM ('IDLE', 'INITIALIZING', 'DECOMPOSING', 'ENRICHING', 'GENERATING_PROMPTS', 'COMPLETED', 'FAILED', 'PAUSED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "PhaseExecutionState" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'RETRYING');

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "state" "PipelineState" NOT NULL DEFAULT 'IDLE',
    "config" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_phase_executions" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "phaseName" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "state" "PhaseExecutionState" NOT NULL DEFAULT 'PENDING',
    "config" JSONB NOT NULL,
    "result" JSONB,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_phase_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_checkpoints" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "state" "PipelineState" NOT NULL,
    "currentPhase" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_events" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipelines_taskId_idx" ON "pipelines"("taskId");

-- CreateIndex
CREATE INDEX "pipelines_state_idx" ON "pipelines"("state");

-- CreateIndex
CREATE INDEX "pipelines_createdAt_idx" ON "pipelines"("createdAt");

-- CreateIndex
CREATE INDEX "pipeline_phase_executions_pipelineId_idx" ON "pipeline_phase_executions"("pipelineId");

-- CreateIndex
CREATE INDEX "pipeline_phase_executions_state_idx" ON "pipeline_phase_executions"("state");

-- CreateIndex
CREATE INDEX "pipeline_checkpoints_pipelineId_idx" ON "pipeline_checkpoints"("pipelineId");

-- CreateIndex
CREATE INDEX "pipeline_checkpoints_createdAt_idx" ON "pipeline_checkpoints"("createdAt");

-- CreateIndex
CREATE INDEX "pipeline_events_pipelineId_idx" ON "pipeline_events"("pipelineId");

-- CreateIndex
CREATE INDEX "pipeline_events_eventType_idx" ON "pipeline_events"("eventType");

-- CreateIndex
CREATE INDEX "pipeline_events_createdAt_idx" ON "pipeline_events"("createdAt");

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_phase_executions" ADD CONSTRAINT "pipeline_phase_executions_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_checkpoints" ADD CONSTRAINT "pipeline_checkpoints_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
