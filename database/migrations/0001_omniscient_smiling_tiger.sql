ALTER TABLE "todos" ALTER COLUMN "isCompleted" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "isCompleted" SET DATA TYPE boolean USING ("isCompleted" <> 0);--> statement-breakpoint
ALTER TABLE "todos" ALTER COLUMN "isCompleted" SET DEFAULT false;
