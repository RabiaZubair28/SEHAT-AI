import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientNameLowerPatternIndexes1790233610295 implements MigrationInterface {
    name = 'AddPatientNameLowerPatternIndexes1790233610295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_first_name_lower_pattern"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_last_name_lower_pattern"`);
        await queryRunner.query(`CREATE INDEX "IDX_patients_first_name_lower_pattern" ON "patients" (LOWER("first_name") text_pattern_ops)`);
        await queryRunner.query(`CREATE INDEX "IDX_patients_last_name_lower_pattern" ON "patients" (LOWER("last_name") text_pattern_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_last_name_lower_pattern"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_first_name_lower_pattern"`);
    }

}
