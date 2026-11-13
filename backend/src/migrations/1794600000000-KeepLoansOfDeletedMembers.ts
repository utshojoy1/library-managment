import { MigrationInterface, QueryRunner } from "typeorm";

/** Deleting a member keeps their loans: the link goes null and the name/number snapshot stays on the loan. */
export class KeepLoansOfDeletedMembers1794600000000 implements MigrationInterface {
    name = 'KeepLoansOfDeletedMembers1794600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loans" ADD "member_name" text, ADD "member_no" text`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "member_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "loans_member_id_members_id_fk"`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Loans of deleted members have no member to point back to, so they can't survive the NOT NULL.
        await queryRunner.query(`DELETE FROM "loans" WHERE "member_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "loans_member_id_members_id_fk"`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "members"("id")`);
        await queryRunner.query(`ALTER TABLE "loans" ALTER COLUMN "member_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "member_name", DROP COLUMN "member_no"`);
    }

}
