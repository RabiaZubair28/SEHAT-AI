import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovingUniqueFromFacilityCode1791367193724 implements MigrationInterface {
    name = 'RemovingUniqueFromFacilityCode1791367193724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."facility_code_index"
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities" DROP CONSTRAINT "UQ_bf808b325b190fb9049254ba55e"
        `);
        await queryRunner.query(`
            CREATE INDEX "facility_code_index" ON "facilities" ("code")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."facility_code_index"
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities"
            ADD CONSTRAINT "UQ_bf808b325b190fb9049254ba55e" UNIQUE ("code")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "facility_code_index" ON "facilities" ("code")
        `);
    }

}
