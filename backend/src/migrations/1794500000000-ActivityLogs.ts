import { MigrationInterface, QueryRunner } from "typeorm";

export class ActivityLogs1794500000000 implements MigrationInterface {
    name = 'ActivityLogs1794500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_logs" (
            "id" SERIAL NOT NULL,
            "at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "action" text NOT NULL,
            "actor_id" integer,
            "actor_name" text,
            "book_id" integer,
            "member_id" integer,
            "subject" text NOT NULL,
            "detail" text,
            CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL,
            CONSTRAINT "activity_logs_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL,
            CONSTRAINT "activity_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL
        )`);
        await queryRunner.query(`CREATE INDEX "activity_logs_at" ON "activity_logs" ("at")`);

        // Backfill from existing rows so history isn't lost. Who did it was never recorded, so actor stays null.
        await queryRunner.query(`
            INSERT INTO "activity_logs" ("at", "action", "book_id", "member_id", "subject", "detail")
            SELECT b.created_at, 'book_added', b.id, NULL, b.title, b.author FROM books b
            UNION ALL
            SELECT m.joined_at::timestamptz, 'member_joined', NULL, m.id, m.name, m.member_no FROM members m
            UNION ALL
            SELECT l.issued_at, 'issued', b.id, m.id, b.title, m.name
              FROM loans l JOIN copies c ON c.id = l.copy_id JOIN books b ON b.id = c.book_id JOIN members m ON m.id = l.member_id
            UNION ALL
            SELECT l.returned_at, 'returned', b.id, m.id, b.title, m.name
              FROM loans l JOIN copies c ON c.id = l.copy_id JOIN books b ON b.id = c.book_id JOIN members m ON m.id = l.member_id
              WHERE l.returned_at IS NOT NULL
            ORDER BY 1
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "activity_logs"`);
    }

}
