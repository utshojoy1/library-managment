import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * The schema as the earlier Drizzle migrations left it. Databases created before
 * the switch to TypeORM already have it, so this only records itself there.
 */
export class Baseline1794182400000 implements MigrationInterface {
  name = 'Baseline1794182400000'

  async up(q: QueryRunner) {
    if (await q.hasTable('users')) return

    await q.query(`
      CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "name" text NOT NULL,
        "password_hash" text NOT NULL,
        "role" text DEFAULT 'member' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "email_verified_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );

      CREATE TABLE "sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "expires_at" timestamp with time zone NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      );

      CREATE TABLE "email_tokens" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "purpose" text NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" timestamp with time zone NOT NULL,
        "used_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "email_tokens_token_hash_unique" UNIQUE("token_hash"),
        CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      );

      CREATE TABLE "emails" (
        "id" serial PRIMARY KEY NOT NULL,
        "to" text NOT NULL,
        "subject" text NOT NULL,
        "text" text NOT NULL,
        "status" text DEFAULT 'queued' NOT NULL,
        "error" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "sent_at" timestamp with time zone
      );

      CREATE TABLE "members" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer,
        "member_no" text NOT NULL,
        "name" text NOT NULL,
        "email" text,
        "phone" text,
        "joined_at" date DEFAULT current_date NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        CONSTRAINT "members_member_no_unique" UNIQUE("member_no"),
        CONSTRAINT "members_user_id_unique" UNIQUE("user_id"),
        CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null
      );

      CREATE TABLE "books" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "author" text NOT NULL,
        "isbn" text,
        "category" text,
        "published_year" integer,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE TABLE "copies" (
        "id" serial PRIMARY KEY NOT NULL,
        "book_id" integer NOT NULL,
        "barcode" text NOT NULL,
        "status" text DEFAULT 'available' NOT NULL,
        CONSTRAINT "copies_barcode_unique" UNIQUE("barcode"),
        CONSTRAINT "copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE cascade
      );

      CREATE TABLE "loans" (
        "id" serial PRIMARY KEY NOT NULL,
        "copy_id" integer NOT NULL,
        "member_id" integer NOT NULL,
        "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
        "due_at" timestamp with time zone NOT NULL,
        "returned_at" timestamp with time zone,
        "status" text DEFAULT 'active' NOT NULL,
        CONSTRAINT "loans_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "copies"("id"),
        CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "members"("id")
      );

      CREATE UNIQUE INDEX "loans_one_active_per_copy" ON "loans" ("copy_id") WHERE status = 'active';
      CREATE INDEX "loans_active_member" ON "loans" ("member_id") WHERE status = 'active';
    `)
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE IF EXISTS "loans", "copies", "books", "members", "emails", "email_tokens", "sessions", "users"`)
  }
}
