import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1789994638920 implements MigrationInterface {
    name = 'Init1789994638920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_37ea84a080a4b47133471852d54"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_74bbbb213ecc45e9444e3145b2b"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_ac4d6845272cbe1fbbf153a4c88"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_f69a57030f0d995b65098f84d37"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_37ea84a080a4b47133471852d5"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_74bbbb213ecc45e9444e3145b2"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_4f5177d5640c0fd8ba0227e8e0"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_fd946deaeffcf439a423152c14"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "created_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "created_by"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "updated_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "updated_by"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "created_by" integer NOT NULL DEFAULT '1'
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "updated_by" integer
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."roles_name_enum"
            RENAME TO "roles_name_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."roles_name_enum" AS ENUM(
                'super_admin',
                'admin',
                'facility_incharge',
                'head_office',
                'registration_clerk',
                'telehealth_consultant',
                'sba',
                'medical_officer_male',
                'medical_officer_female',
                'vaccinator',
                'dispenser',
                'paeds'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "roles"
            ALTER COLUMN "name" TYPE "public"."roles_name_enum" USING "name"::"text"::"public"."roles_name_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."roles_name_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories" DROP COLUMN "past_obstetric_complication"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories"
            ADD "past_obstetric_complication" "public"."anc_medical_surgical_histories_past_obstetric_complication_enum" array NOT NULL DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ALTER COLUMN "allowed_ips"
            SET DEFAULT '{}'::text []
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_patients_first_name_lower_pattern" ON "patients" ("first_name")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_patients_last_name_lower_pattern" ON "patients" ("last_name")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_37ea84a080a4b47133471852d5" ON "user_services" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_74bbbb213ecc45e9444e3145b2" ON "user_services" ("service_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_ac4d6845272cbe1fbbf153a4c88" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_f69a57030f0d995b65098f84d37" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_37ea84a080a4b47133471852d54" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_74bbbb213ecc45e9444e3145b2b" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_74bbbb213ecc45e9444e3145b2b"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_37ea84a080a4b47133471852d54"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_f69a57030f0d995b65098f84d37"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "FK_ac4d6845272cbe1fbbf153a4c88"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_74bbbb213ecc45e9444e3145b2"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_37ea84a080a4b47133471852d5"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_patients_last_name_lower_pattern"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_patients_first_name_lower_pattern"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ALTER COLUMN "allowed_ips"
            SET DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories" DROP COLUMN "past_obstetric_complication"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories"
            ADD "past_obstetric_complication" anc_medical_surgical_histories_past_obstetric_complication_enum array NOT NULL DEFAULT '{}'
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."roles_name_enum_old" AS ENUM(
                'super_admin',
                'admin',
                'facility_incharge',
                'head_office',
                'registration_clerk',
                'telehealth_consultant',
                'sba',
                'medical_officer_male',
                'medical_officer_female',
                'vaccinator',
                'dispenser',
                'paeds'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "roles"
            ALTER COLUMN "name" TYPE "public"."roles_name_enum_old" USING "name"::"text"::"public"."roles_name_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."roles_name_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."roles_name_enum_old"
            RENAME TO "roles_name_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "updated_by"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "updated_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "created_by"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP COLUMN "created_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "updated_by" integer
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "created_by" integer NOT NULL DEFAULT '1'
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_fd946deaeffcf439a423152c14" ON "patients" ("last_name")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_4f5177d5640c0fd8ba0227e8e0" ON "patients" ("first_name")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_74bbbb213ecc45e9444e3145b2" ON "user_services" ("service_id")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_37ea84a080a4b47133471852d5" ON "user_services" ("user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_f69a57030f0d995b65098f84d37" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_ac4d6845272cbe1fbbf153a4c88" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_74bbbb213ecc45e9444e3145b2b" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services"
            ADD CONSTRAINT "FK_37ea84a080a4b47133471852d54" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
