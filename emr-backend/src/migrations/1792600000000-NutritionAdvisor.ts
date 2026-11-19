import { MigrationInterface, QueryRunner } from "typeorm";

export class NutritionAdvisor1792600000000 implements MigrationInterface {
    name = 'NutritionAdvisor1792600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_advisor_plans_status_enum" AS ENUM(
                'draft',
                'pending_review',
                'changes_requested',
                'approved',
                'rejected',
                'superseded'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "nutrition_advisor_plans" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_by" integer,
                "appointment_service_id" integer NOT NULL,
                "patient_id" integer NOT NULL,
                "version" integer NOT NULL,
                "status" "public"."nutrition_advisor_plans_status_enum" NOT NULL DEFAULT 'draft',
                "preferences" jsonb NOT NULL,
                "plan" jsonb NOT NULL,
                "handout" jsonb NOT NULL,
                "context_snapshot" jsonb NOT NULL,
                "generated_by" character varying(40) NOT NULL,
                "food_data_version" character varying(40) NOT NULL,
                "content_hash" character varying(64) NOT NULL,
                "review_comment" text,
                "reviewed_by" integer,
                "reviewed_at" TIMESTAMP,
                "previous_version_id" integer,
                CONSTRAINT "PK_nutrition_advisor_plans_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_nutrition_advisor_plans_service_version" ON "nutrition_advisor_plans" ("appointment_service_id", "version")
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_plans"
            ADD CONSTRAINT "FK_nutrition_advisor_plans_appointment_service" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_plans"
            ADD CONSTRAINT "FK_nutrition_advisor_plans_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_plans"
            ADD CONSTRAINT "FK_nutrition_advisor_plans_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_plans"
            ADD CONSTRAINT "FK_nutrition_advisor_plans_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_advisor_events_action_enum" AS ENUM(
                'generated',
                'edited',
                'new_version',
                'submitted',
                'approved',
                'rejected',
                'changes_requested',
                'downloaded',
                'sent',
                'send_failed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "nutrition_advisor_events" (
                "id" SERIAL NOT NULL,
                "plan_id" integer NOT NULL,
                "action" "public"."nutrition_advisor_events_action_enum" NOT NULL,
                "user_id" integer NOT NULL,
                "details" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_nutrition_advisor_events_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_nutrition_advisor_events_plan" ON "nutrition_advisor_events" ("plan_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_events"
            ADD CONSTRAINT "FK_nutrition_advisor_events_plan" FOREIGN KEY ("plan_id") REFERENCES "nutrition_advisor_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_events"
            ADD CONSTRAINT "FK_nutrition_advisor_events_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_advisor_deliveries_channel_enum" AS ENUM('whatsapp', 'download')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_advisor_deliveries_status_enum" AS ENUM('sent', 'failed')
        `);
        await queryRunner.query(`
            CREATE TABLE "nutrition_advisor_deliveries" (
                "id" SERIAL NOT NULL,
                "plan_id" integer NOT NULL,
                "plan_version" integer NOT NULL,
                "content_hash" character varying(64) NOT NULL,
                "channel" "public"."nutrition_advisor_deliveries_channel_enum" NOT NULL,
                "status" "public"."nutrition_advisor_deliveries_status_enum" NOT NULL,
                "language" character varying(8) NOT NULL,
                "recipient_masked" character varying(20),
                "consent_confirmed" boolean NOT NULL DEFAULT false,
                "file_path" character varying(300),
                "file_sha256" character varying(64),
                "provider_message_id" character varying(120),
                "error" character varying(300),
                "created_by" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_nutrition_advisor_deliveries_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_nutrition_advisor_deliveries_plan" ON "nutrition_advisor_deliveries" ("plan_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_deliveries"
            ADD CONSTRAINT "FK_nutrition_advisor_deliveries_plan" FOREIGN KEY ("plan_id") REFERENCES "nutrition_advisor_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_advisor_deliveries"
            ADD CONSTRAINT "FK_nutrition_advisor_deliveries_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "nutrition_advisor_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."nutrition_advisor_deliveries_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."nutrition_advisor_deliveries_channel_enum"`);
        await queryRunner.query(`DROP TABLE "nutrition_advisor_events"`);
        await queryRunner.query(`DROP TYPE "public"."nutrition_advisor_events_action_enum"`);
        await queryRunner.query(`DROP TABLE "nutrition_advisor_plans"`);
        await queryRunner.query(`DROP TYPE "public"."nutrition_advisor_plans_status_enum"`);
    }
}
