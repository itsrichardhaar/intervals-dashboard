-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "IntervalsPerson" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsProject" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "status" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION,
    "budgetAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsTask" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "status" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION,
    "loggedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsTimeEntry" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "taskId" TEXT,
    "personId" TEXT,
    "projectId" TEXT,
    "hours" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsMilestone" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsDocument" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsTaskNote" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsTaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervalsProjectNote" (
    "id" TEXT NOT NULL,
    "intervalsId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervalsProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIntervalsMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intervalsPersonId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserIntervalsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyStatusUpdate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyStatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStatusOverride" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "setById" TEXT NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStatusOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "resourcesSynced" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSentLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "alertType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsPerson_intervalsId_key" ON "IntervalsPerson"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsProject_intervalsId_key" ON "IntervalsProject"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsTask_intervalsId_key" ON "IntervalsTask"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsTimeEntry_intervalsId_key" ON "IntervalsTimeEntry"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsMilestone_intervalsId_key" ON "IntervalsMilestone"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsDocument_intervalsId_key" ON "IntervalsDocument"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsTaskNote_intervalsId_key" ON "IntervalsTaskNote"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "IntervalsProjectNote_intervalsId_key" ON "IntervalsProjectNote"("intervalsId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIntervalsMapping_userId_key" ON "UserIntervalsMapping"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIntervalsMapping_intervalsPersonId_key" ON "UserIntervalsMapping"("intervalsPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStatusOverride_projectId_key" ON "ProjectStatusOverride"("projectId");

-- CreateIndex
CREATE INDEX "EmailSentLog_taskId_alertType_idx" ON "EmailSentLog"("taskId", "alertType");

-- CreateIndex
CREATE INDEX "EmailSentLog_projectId_alertType_idx" ON "EmailSentLog"("projectId", "alertType");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTask" ADD CONSTRAINT "IntervalsTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTask" ADD CONSTRAINT "IntervalsTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "IntervalsPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTimeEntry" ADD CONSTRAINT "IntervalsTimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "IntervalsTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTimeEntry" ADD CONSTRAINT "IntervalsTimeEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "IntervalsPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTimeEntry" ADD CONSTRAINT "IntervalsTimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsMilestone" ADD CONSTRAINT "IntervalsMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsDocument" ADD CONSTRAINT "IntervalsDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsTaskNote" ADD CONSTRAINT "IntervalsTaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "IntervalsTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervalsProjectNote" ADD CONSTRAINT "IntervalsProjectNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIntervalsMapping" ADD CONSTRAINT "UserIntervalsMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIntervalsMapping" ADD CONSTRAINT "UserIntervalsMapping_intervalsPersonId_fkey" FOREIGN KEY ("intervalsPersonId") REFERENCES "IntervalsPerson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyStatusUpdate" ADD CONSTRAINT "WeeklyStatusUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyStatusUpdate" ADD CONSTRAINT "WeeklyStatusUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "IntervalsTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusOverride" ADD CONSTRAINT "ProjectStatusOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IntervalsProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusOverride" ADD CONSTRAINT "ProjectStatusOverride_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
