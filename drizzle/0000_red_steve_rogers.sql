CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text,
	"category" text,
	"published_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copies" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"barcode" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	CONSTRAINT "copies_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"copy_id" integer NOT NULL,
	"member_id" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_no" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"joined_at" date DEFAULT current_date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "members_member_no_unique" UNIQUE("member_no")
);
--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."copies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_active_per_copy" ON "loans" USING btree ("copy_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "loans_active_member" ON "loans" USING btree ("member_id") WHERE status = 'active';