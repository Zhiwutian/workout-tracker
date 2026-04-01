CREATE TABLE "exercise_recent_clears" (
	"clearId" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"scope" text NOT NULL,
	"clearedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_recent_clears_user_scope_unique" UNIQUE("userId","scope")
);
--> statement-breakpoint
ALTER TABLE "exercise_recent_clears" ADD CONSTRAINT "exercise_recent_clears_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint