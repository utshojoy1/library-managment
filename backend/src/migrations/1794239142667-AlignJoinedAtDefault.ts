import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignJoinedAtDefault1794239142667 implements MigrationInterface {
    name = 'AlignJoinedAtDefault1794239142667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "joined_at" SET DEFAULT ('now'::text)::date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "joined_at" SET DEFAULT CURRENT_DATE`);
    }

}
