import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMustChangePasswordColumnToUsersTable1790245551667 implements MigrationInterface {
    name = 'AddMustChangePasswordColumnToUsersTable1790245551667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "must_change_password" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "must_change_password"
        `);
    }

}
