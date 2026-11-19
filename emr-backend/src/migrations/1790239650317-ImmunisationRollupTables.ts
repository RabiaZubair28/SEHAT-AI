import { MigrationInterface, QueryRunner } from "typeorm";

export class ImmunisationRollupTables1790239650317 implements MigrationInterface {
    name = 'ImmunisationRollupTables1790239650317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "immunisation_rollup_seen_vaccines" (
                "rollup_date" date NOT NULL,
                "aggregation_type" character varying(20) NOT NULL,
                "dimension_id" integer NOT NULL,
                "vaccine_id" integer NOT NULL,
                CONSTRAINT "PK_0f3f35b4c5ed7aaa1c8779b7b59" PRIMARY KEY (
                    "rollup_date",
                    "aggregation_type",
                    "dimension_id",
                    "vaccine_id"
                )
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "immunisation_rollup_seen_patients" (
                "rollup_date" date NOT NULL,
                "aggregation_type" character varying(20) NOT NULL,
                "dimension_id" integer NOT NULL,
                "patient_id" integer NOT NULL,
                CONSTRAINT "PK_b55049c9942fc8802f8dc58a1f2" PRIMARY KEY (
                    "rollup_date",
                    "aggregation_type",
                    "dimension_id",
                    "patient_id"
                )
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "immunisation_rollup_checkpoint" (
                "job_name" character varying(100) NOT NULL,
                "last_processed_id" bigint NOT NULL DEFAULT '0',
                "high_watermark_id" bigint NOT NULL DEFAULT '0',
                "completed" boolean NOT NULL DEFAULT false,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bdb9ecc05836f8f3576e55120ab" PRIMARY KEY ("job_name")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "immunisation_rollup_checkpoint"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "immunisation_rollup_seen_patients"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "immunisation_rollup_seen_vaccines"
        `);
    }

}
