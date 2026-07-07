-- Run this once in the Neon SQL Editor for your new project, then run
-- `npx prisma generate` locally (or just deploy — Vercel runs it via the
-- postinstall script). Do NOT run `prisma migrate` against this project.

CREATE TABLE "EmailLog" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT '',
  "dateSent" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "resendCount" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CallLog" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL DEFAULT '',
  "role" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL,
  "dateCalled" TIMESTAMP(3) NOT NULL,
  "outcome" TEXT NOT NULL DEFAULT 'connected',
  "nextFollowUp" TIMESTAMP(3),
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Application" (
  "id" TEXT PRIMARY KEY,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT '',
  "dateApplied" TIMESTAMP(3) NOT NULL,
  "jobDescription" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'applied',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ResumeVersion" (
  "id" TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
  "originalName" TEXT NOT NULL,
  "blobUrl" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ResumeVersion_applicationId_idx" ON "ResumeVersion"("applicationId");
