-- AlterTable
ALTER TABLE "ClientSessionAllowance" ADD COLUMN     "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "maxSessions" DROP NOT NULL;
