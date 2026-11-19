import { MigrationInterface, QueryRunner } from "typeorm";

export class DoctorVisitRollupCheckpoint1790236941397 implements MigrationInterface {
    name = 'DoctorVisitRollupCheckpoint1790236941397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "doctor_visit_rollup_checkpoint" (
                "job_name" character varying(100) NOT NULL,
                "last_processed_id" bigint NOT NULL DEFAULT '0',
                "high_watermark_id" bigint NOT NULL DEFAULT '0',
                "completed" boolean NOT NULL DEFAULT false,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b0dbab61d9ab7db5f21cce88b66" PRIMARY KEY ("job_name")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "doctor_visit_rollup_checkpoint"
        `);
    }

}
