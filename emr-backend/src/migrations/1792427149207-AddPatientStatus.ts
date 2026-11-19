import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientStatus1792427149207 implements MigrationInterface {
    name = 'AddPatientStatus1792427149207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer,
                "permission_id" integer,
                CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_permissions_permission_id" ON "user_permissions" ("permission_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_permissions_user_id" ON "user_permissions" ("user_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" SERIAL NOT NULL,
                "payload" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "role_id" integer,
                CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_permissions_role_id" ON "permissions" ("role_id")
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
            CREATE TABLE "roles" (
                "id" SERIAL NOT NULL,
                "name" "public"."roles_name_enum" NOT NULL,
                "description" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "provinces" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                CONSTRAINT "PK_2e4260eedbcad036ec53222e0c7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_5c78199072262966fb68b71809" ON "provinces" ("name")
        `);
        await queryRunner.query(`
            CREATE TABLE "divisions" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "province_id" integer,
                CONSTRAINT "PK_c1f864477b3fd0954564108ed96" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9f6740ab8384ad72ec1da19a66" ON "divisions" ("name")
        `);
        await queryRunner.query(`
            CREATE TABLE "ucs" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "taluka_id" integer,
                CONSTRAINT "PK_d988cfa5d65195478b7d4484fd3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "uc_name_index" ON "ucs" ("name")
        `);
        await queryRunner.query(`
            CREATE TABLE "talukas" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "district_id" integer,
                CONSTRAINT "PK_2895e7aefa5e86eaef395e8217d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "districts" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "division_id" integer,
                CONSTRAINT "PK_972a72ff4e3bea5c7f43a2b98af" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_services" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer NOT NULL,
                "service_id" integer NOT NULL,
                "updated_by" integer,
                CONSTRAINT "PK_68ed409cb707ddff39f47691f68" PRIMARY KEY ("user_id", "service_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_74bbbb213ecc45e9444e3145b2" ON "user_services" ("service_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_37ea84a080a4b47133471852d5" ON "user_services" ("user_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "services" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_client_type_enum" AS ENUM(
                'Walk-in',
                'Referred by LHW',
                'Referred by health provider'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_total_pregnancy_since_last_period_enum" AS ENUM(
                'Within 48 hours',
                'More than 48 hours to 6 weeks',
                'More than 6 weeks to 6 months',
                'More than 6 months to 1 year',
                'More than 1 year to 2 years',
                'More than 2 years'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_previous_fp_methods_used_enum" AS ENUM(
                'Oral pills (COC)',
                'Oral pills (POP)',
                'Emergency Contraceptive Pill',
                'Condoms',
                'Diaphragm',
                'IUCD',
                'Implant (Jadelle)',
                'Injectable (Sayana Press)',
                'Injectable (3 month injection)',
                'Vasectomy',
                'Tubal ligation',
                'Injectable DepoProvera',
                'Injectable Net-En'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_service_category_enum" AS ENUM('Family Planning Services', 'LARC Removal')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_client_category_enum" AS ENUM('Family Planning Method', 'Counseling')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_insertion_period_enum" AS ENUM(
                'Less than 3 months',
                'More than 3 months to 6 months',
                'More than 6 months to 1 year',
                'Less than 2 years',
                'Less than 3 years',
                'More than 3 years'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."family_plannings_removal_reason_enum" AS ENUM(
                'Wanted to get pregnant',
                'Husband disapproval',
                'Side effects',
                'Complication',
                'Completion of period',
                'Opting for another method'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "family_plannings" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "client_type" "public"."family_plannings_client_type_enum" NOT NULL,
                "years_of_marriage" integer DEFAULT '0',
                "total_pregnancy_since_last_period" "public"."family_plannings_total_pregnancy_since_last_period_enum" NOT NULL,
                "new_user" boolean NOT NULL DEFAULT false,
                "previous_method_in_use" boolean,
                "previous_fp_methods_used" "public"."family_plannings_previous_fp_methods_used_enum" array,
                "service_category" "public"."family_plannings_service_category_enum" NOT NULL,
                "client_category" "public"."family_plannings_client_category_enum",
                "insertion_period" "public"."family_plannings_insertion_period_enum",
                "removal_reason" "public"."family_plannings_removal_reason_enum",
                "client_counseling_done" boolean NOT NULL DEFAULT false,
                "updated_by" integer,
                "appointment_service_id" integer,
                CONSTRAINT "UQ_e7da41a790a440a64b938862c31" UNIQUE ("appointment_service_id"),
                CONSTRAINT "REL_e7da41a790a440a64b938862c3" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_395a164a620a206433c9418b92f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."previous_pregnancies_place_of_delivery_enum" AS ENUM(
                'Public health facility',
                'Private health facility',
                'Informal delivery center',
                'Home',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."previous_pregnancies_outcome_enum" AS ENUM(
                'Live birth',
                'Still birth',
                'Miscarriage',
                'Induced abortion'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."previous_pregnancies_mode_of_delivery_enum" AS ENUM(
                'Normal Vaginal Delivery',
                'C-Section',
                'Assisted delivery (Vacuum/Forceps)',
                'Not Applicable'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."previous_pregnancies_complication_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Heart disease',
                'Bleeding disorder',
                'C-section',
                'Obstructed labour',
                'Antepartum haemorrhage (APH)',
                'Postpartum haemorrhage (PPH)',
                'Preeclampsia',
                'Eclampsia',
                'Preterm labour',
                'Severe abdominal pain',
                'Vaginal bleeding',
                'Decreased or loss of fetal movement',
                'Collapse / convulsion',
                'Severe headache (with or without visual disturbance)',
                'Severe edema',
                'Categorized as high risk during ANC',
                'Anaemia / low Hb',
                'Ectopic pregnancy',
                'Placenta previa',
                'Chorioamnionitis',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Puerperal sepsis',
                'Intractable vomiting',
                'Physical trauma',
                'Mental trauma',
                'Gastroenteritis',
                'Vaginal discharge',
                'Shortness of breath',
                'Infections',
                'Fever',
                'Malaria',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "previous_pregnancies" (
                "id" SERIAL NOT NULL,
                "place_of_delivery" "public"."previous_pregnancies_place_of_delivery_enum",
                "outcome" "public"."previous_pregnancies_outcome_enum",
                "mode_of_delivery" "public"."previous_pregnancies_mode_of_delivery_enum",
                "complication" "public"."previous_pregnancies_complication_enum" array,
                "otherComplication" text,
                "pregnancy_info_id" integer,
                CONSTRAINT "PK_fc4fb4ed1382bcd8bce4752c8ff" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_pregnancy_infos_reason_for_edit_enum" AS ENUM(
                'Changing current LMP',
                'Adding LMP for a new pregnancy'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_pregnancy_infos_trimester_enum" AS ENUM('First', 'Second', 'Third')
        `);
        await queryRunner.query(`
            CREATE TABLE "anc_pregnancy_infos" (
                "id" SERIAL NOT NULL,
                "gravidity" integer NOT NULL DEFAULT '0',
                "parity" integer NOT NULL DEFAULT '0',
                "lmp" date NOT NULL,
                "abortion" integer NOT NULL DEFAULT '0',
                "gestational_age" integer NOT NULL,
                "reason_for_edit" "public"."anc_pregnancy_infos_reason_for_edit_enum",
                "expected_date_of_delivery" date NOT NULL,
                "trimester" "public"."anc_pregnancy_infos_trimester_enum" NOT NULL,
                "appointment_service_id" integer,
                CONSTRAINT "REL_14a602a36836b7fa975e0ea75a" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_d85386a9f7913a96d2e36b71679" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_medical_surgical_histories_previous_illness_enum" AS ENUM(
                'Acute Flaccid Paralysis',
                'Mumps',
                'Measles',
                'Neonatal Tetanus',
                'Diphtheria',
                'Tuberculosis',
                'Typhoid Fever',
                'Pertussis',
                'Acute Diarrhea (Non-Cholera)',
                'Acute Watery Diarrhea (Cholera)',
                'Acute Jaundice Syndrome (Hepatitis A & E)',
                'Naegleria Fowleri',
                'Chickenpox',
                'Pneumonia/LRTI',
                'Severe Acute Respiratory Infection (SARI)',
                'Malaria',
                'Dengue Fever',
                'Chikungunya',
                'Crimean Congo Hemorrhagic Fever (CCHF)',
                'Hepatitis (HBV, HCV, HDV)',
                'HIV/AIDS',
                'Any other unusual event',
                'Leishmaniasis',
                'Bloody Diarrhea (Dysentery)',
                'Rabies',
                'STIs',
                'Leprosy',
                'Meningitis',
                'Rheumatic Fever',
                'Snake Bite',
                'Scabies',
                'Pyrexia of Unknown Origin (PUO)',
                'Hypertension',
                'Diabetes',
                'Ischemic heart disease/MI',
                'Heart failure',
                'Stroke',
                'Asthma',
                'COPD',
                'Hepatitis B',
                'Hepatitis C',
                'Chronic kidney disease',
                'Thyroid disease',
                'Dyslipidemia',
                'Anemia',
                'Bleeding/clotting disorder',
                'Peptic ulcer',
                'Epilepsy / Seizure disorder',
                'HIV',
                'Autoimmune disease',
                'Cancer',
                'Major surgery',
                'Psychiatric-related',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_past_obstetric_complication_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Heart disease',
                'Bleeding disorder',
                'C-Section',
                'Obstructed labour',
                'Antepartum haemorrhage (APH)',
                'Postpartum haemorrhage (PPH)',
                'Preeclampsia',
                'Eclampsia',
                'Preterm labour',
                'Severe abdominal pain',
                'Vaginal bleeding',
                'Decreased or loss of fetal movement',
                'Collapse / convulsion',
                'Severe headache (with or without visual disturbance)',
                'Severe edema',
                'Categorized as high risk during ANC',
                'Anaemia / low Hb',
                'Ectopic pregnancy',
                'Placenta previa',
                'Chorioamnionitis',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Puerperal sepsis',
                'Intractable vomiting',
                'Physical trauma',
                'Mental trauma',
                'Gastroenteritis',
                'Vaginal discharge',
                'Shortness of breath',
                'Infections',
                'Fever',
                'Malaria',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_medical_surgical_histories_allergy_details_enum" AS ENUM('Pollen', 'Dust', 'Penicillin', 'Other')
        `);
        await queryRunner.query(`
            CREATE TABLE "anc_medical_surgical_histories" (
                "id" SERIAL NOT NULL,
                "previous_illness" "public"."anc_medical_surgical_histories_previous_illness_enum" array NOT NULL DEFAULT '{}',
                "past_obstetric_complication" "public"."anc_past_obstetric_complication_enum" array NOT NULL DEFAULT '{}',
                "previous_surgery" boolean,
                "previous_surgery_details" character varying,
                "known_allergies" boolean,
                "allergy_details" "public"."anc_medical_surgical_histories_allergy_details_enum" array,
                "previous_medication" boolean,
                "previous_medication_details" character varying,
                "used_family_planning" boolean NOT NULL,
                "family_planning_methods" json,
                "prior_blood_transfusion" boolean NOT NULL DEFAULT false,
                "appointment_service_id" integer,
                CONSTRAINT "REL_7dd558ad7446a1250ac684a3b7" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_d8ca781f339e3707709bd273624" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "diagnosis" (
                "id" SERIAL NOT NULL,
                "screened_rubella" boolean NOT NULL DEFAULT false,
                "rubella_positive" boolean,
                "screened_hep_b" boolean NOT NULL DEFAULT false,
                "hep_b_positive" boolean,
                "screened_hep_c" boolean NOT NULL DEFAULT false,
                "hep_c_positive" boolean,
                "screened_thalassemia" boolean NOT NULL DEFAULT false,
                "thalassemia_positive" boolean,
                "screened_hiv" boolean NOT NULL DEFAULT false,
                "hiv_positive" boolean,
                "prescribed_lab_test" boolean NOT NULL DEFAULT false,
                "lab_tests" jsonb,
                "patient_has_labtests" boolean,
                "result_value" character varying,
                "result_lab_date" date,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "appointment_service_id" integer,
                CONSTRAINT "REL_2cf4b6c60eabaf155b39d17468" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_d5dbb1cc4e30790df368da56961" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."visits_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'dispatched',
                'referred_out',
                'unassigned'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "visits" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "patient_id" integer NOT NULL,
                "visit_date" date NOT NULL,
                "status" "public"."visits_status_enum" NOT NULL DEFAULT 'pending',
                "updated_by" integer,
                "facility_id" integer,
                CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "emergency_vitals" (
                "id" SERIAL NOT NULL,
                "temperature" double precision,
                "pulse" double precision,
                "systolic_bp" double precision,
                "diastolic_bp" double precision,
                "respiratory_rate" double precision,
                "spo2" double precision,
                "emergency_patient_id" integer,
                CONSTRAINT "REL_da12b2c66aaa8121de589de3e6" UNIQUE ("emergency_patient_id"),
                CONSTRAINT "PK_77e7b7b38eb44ae3dd5dd0ddd94" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_outcomes_outcome_enum" AS ENUM(
                'Discharged',
                'Referred',
                'LAMA',
                'Expired',
                'Admitted'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_outcomes_level_of_care_enum" AS ENUM('Primary', 'Secondary', 'Tertiary', 'Office')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_outcomes_type_of_service_enum" AS ENUM(
                'OPD',
                'ANC',
                'Delivery',
                'PNC',
                'Family planning',
                'Nutrition',
                'Immunisation',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "emergency_outcomes" (
                "id" SERIAL NOT NULL,
                "outcome" "public"."emergency_outcomes_outcome_enum" NOT NULL,
                "level_of_care" "public"."emergency_outcomes_level_of_care_enum",
                "type_of_service" "public"."emergency_outcomes_type_of_service_enum",
                "other_service" character varying(255),
                "reason_of_referral" text,
                "emergency_patient_id" integer,
                "district_id" integer,
                "facility_id" integer,
                CONSTRAINT "REL_90dc179c88f5912da50d07bdf0" UNIQUE ("emergency_patient_id"),
                CONSTRAINT "PK_16ada694c86d8b497776591d08d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_patients_identity_provider_enum" AS ENUM(
                'Self',
                'Mother',
                'Father',
                'Sibling',
                'Spouse',
                'Guardian',
                'Uncle/Aunt (blood-relation)',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_patients_nationality_status_enum" AS ENUM('Pakistani', 'Non-Pakistani')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_patients_sex_enum" AS ENUM('Male', 'Female', 'Other')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_patients_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."emergency_patients_service_required_enum" AS ENUM(
                'OPD',
                'ANC',
                'Delivery',
                'PNC',
                'Family planning',
                'Nutrition',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "emergency_patients" (
                "id" SERIAL NOT NULL,
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "er_no" character varying,
                "identity_provider" "public"."emergency_patients_identity_provider_enum",
                "other_identity_provider" character varying(255),
                "nationality_status" "public"."emergency_patients_nationality_status_enum",
                "cnic" character varying(15),
                "international_id" character varying(20),
                "mobile_no" character varying(12) NOT NULL,
                "age" character varying(15),
                "sex" "public"."emergency_patients_sex_enum" NOT NULL,
                "blood_group" "public"."emergency_patients_blood_group_enum",
                "service_required" "public"."emergency_patients_service_required_enum" NOT NULL,
                "other_service" character varying(255),
                "presenting_complaint" text NOT NULL,
                "past_medical_history" text,
                "medicine_administered" boolean NOT NULL DEFAULT false,
                "doctor_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "facility_id" integer NOT NULL,
                CONSTRAINT "UQ_e8d501c8249009fe37ee7cebf0e" UNIQUE ("er_no"),
                CONSTRAINT "PK_430169857a3286fb53ede18c4d8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "dispensers" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "remarks" text,
                "otc_med_required" boolean NOT NULL DEFAULT false,
                "updated_by" integer,
                "appointment_service_id" integer,
                "facility_id" integer,
                "user_id" integer,
                "emergency_patient_id" integer,
                CONSTRAINT "REL_ec8441af65844c3f555d4c7897" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_e37be9a5bb838ee7145fa1899aa" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "dispense_items" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "required_qty" integer NOT NULL DEFAULT '0',
                "dispensed_qty" integer NOT NULL,
                "medicine_dosage" character varying(20),
                "medicine_duration" integer,
                "otc" boolean NOT NULL DEFAULT false,
                "updated_by" integer,
                "dispense_id" integer,
                "medicine_variant_id" integer,
                "batch_id" integer,
                CONSTRAINT "PK_36f412442ceea88d3523112019a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."medicine_batches_status_enum" AS ENUM('Active', 'Expired', 'Out of Stock')
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_batches" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "batch_number" character varying(100) NOT NULL,
                "expiry_date" date NOT NULL,
                "purchase_date" date,
                "stock_quantity" integer NOT NULL DEFAULT '0',
                "status" "public"."medicine_batches_status_enum" NOT NULL DEFAULT 'Active',
                "updated_by" integer,
                "variant_id" integer,
                "facility_id" integer,
                "medicine_id" integer,
                CONSTRAINT "PK_793d7718d0d83c16956b370c8bb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "medicines" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "generic_name" character varying(255),
                "description" character varying,
                "category" character varying(100) NOT NULL,
                "contraceptive" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_77b93851766f7ab93f71f44b18b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_count" (
                "id" SERIAL NOT NULL,
                "facility_id" integer NOT NULL,
                "medicine_id" integer NOT NULL,
                "medicine_variant_id" integer NOT NULL,
                "count" integer NOT NULL DEFAULT '0',
                "otc" boolean NOT NULL DEFAULT false,
                "email_threshold" integer,
                "limit_quantity" integer,
                CONSTRAINT "PK_3d35d46d704997dac578a5a73fe" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."medicine_variants_unit_enum" AS ENUM(
                'Tablet',
                'Capsule',
                'Injection',
                'Sachet',
                'Syrup',
                'Bottle',
                'Cream',
                'Condom',
                'Pill',
                'Iud',
                'Implant',
                'IV Infusion',
                'Nebules'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_variants" (
                "id" SERIAL NOT NULL,
                "strength" character varying(300) NOT NULL,
                "unit" "public"."medicine_variants_unit_enum" NOT NULL,
                "medicine_id" integer,
                CONSTRAINT "PK_34bcb1a9c7289f31df6752797c3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "prescriptions" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "medicine_dosage" character varying(20),
                "medicine_duration" integer,
                "quantity" integer,
                "medicine_instruction" character varying(255),
                "medicine_dispensed" boolean NOT NULL DEFAULT false,
                "updated_by" integer,
                "appointment_service_id" integer,
                "medicine_variant_id" integer,
                "visit_id" integer,
                "emergency_patient_id" integer,
                CONSTRAINT "PK_097b2cc2f2b7e56825468188503" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ultrasounds_type_of_pregnancy_enum" AS ENUM('Single', 'Twins', 'Triplets', 'Quadruplets')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ultrasounds_fetal_movement_enum" AS ENUM('Present', 'Absent')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ultrasounds_fetal_presentation_enum" AS ENUM(
                'Longitudinal',
                'Cephalic',
                'Breech',
                'Shoulder',
                'Transverse'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ultrasounds_attitude_enum" AS ENUM('Flexed', 'Neutral', 'Extended')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ultrasounds_placenta_enum" AS ENUM('Posterior', 'Anterior', 'Fundal', 'Lateral')
        `);
        await queryRunner.query(`
            CREATE TABLE "ultrasounds" (
                "id" SERIAL NOT NULL,
                "requires_ultrasound" boolean NOT NULL DEFAULT false,
                "ultrasound_machine_available" boolean,
                "type_of_pregnancy" "public"."ultrasounds_type_of_pregnancy_enum",
                "fetal_movement" "public"."ultrasounds_fetal_movement_enum",
                "fetal_presentation" "public"."ultrasounds_fetal_presentation_enum",
                "attitude" "public"."ultrasounds_attitude_enum",
                "placenta" "public"."ultrasounds_placenta_enum",
                "amniotic_fluid_index" double precision,
                "fetal_heart_rate" double precision,
                "fundal_height" double precision,
                "ultrasound_reporting" text,
                "other_ultrasound_reporting" text,
                "gestational_age_weeks" character varying(20),
                "ultrasound_observations" text,
                "appointment_service_id" integer,
                CONSTRAINT "REL_8959cd79025ba83639ddb595ee" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_f3ecc34531fe5b7e2b0082804df" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."ctgs_ctg_reporting_enum" AS ENUM(
                'Normal/Reactive',
                'Suspicious',
                'Abnormal/Non-Reactive'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "ctgs" (
                "id" SERIAL NOT NULL,
                "requires_ctg" boolean NOT NULL DEFAULT false,
                "ctg_machine_available" boolean NOT NULL DEFAULT true,
                "ctg_reporting" "public"."ctgs_ctg_reporting_enum",
                "ctg_observations" text,
                "ctg_remarks" text,
                "appointment_service_id" integer,
                CONSTRAINT "REL_260f7c006913f3ad8fa8666545" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_241a83e151269124e978b4c700f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "vaccines" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "display_name" character varying NOT NULL,
                "seir_name" character varying,
                "series_name" character varying,
                "dose_number" integer NOT NULL DEFAULT '0',
                "age_min_days" integer NOT NULL DEFAULT '0',
                "age_overdue_days" integer,
                "max_age_days" integer,
                "applies_to" character varying(50) NOT NULL DEFAULT 'Child',
                "gender_restriction" character varying(20) NOT NULL DEFAULT 'Any',
                "pre_requisite_codes" text array,
                "catch_up_1_to_2_mode" character varying(50),
                "catch_up_1_to_2_interval_days" integer,
                "catch_up_1_to_2_note" text,
                "catch_up_above_2_mode" character varying(50),
                "catch_up_above_2_interval_days" integer,
                "catch_up_above_2_note" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_195bc56fe32c08445078655ec5a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_054d432c65b71b1e87436e310b" ON "vaccines" ("code", "dose_number")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."immunisation_doses_status_enum" AS ENUM(
                'Pending',
                'Scheduled',
                'Administered',
                'Defaulter',
                'Expired',
                'Closed',
                'REFUSED',
                'RETRO',
                'RETRO_DATE_MISSING',
                'VACCINATED',
                'SCHEDULED'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "immunisation_doses" (
                "id" SERIAL NOT NULL,
                "date_administered" date NOT NULL,
                "status" "public"."immunisation_doses_status_enum" NOT NULL DEFAULT 'Pending',
                "latitude" double precision,
                "longitude" double precision,
                "vaccine_id" integer,
                "patient_id" integer,
                "immunisation_id" integer,
                "vaccinated_by" integer,
                CONSTRAINT "PK_3bb2e978fcc2139b383ab7b24da" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisation_doses_patient_id" ON "immunisation_doses" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisation_doses_immunisation_id" ON "immunisation_doses" ("immunisation_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisation_doses_vaccinated_by" ON "immunisation_doses" ("vaccinated_by")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."newborn_assessments_sex_enum" AS ENUM('M', 'F')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."newborn_assessments_condition_enum" AS ENUM(
                'Alive and healthy',
                'Alive and unhealthy',
                'Dead after delivery',
                'Intrauterine death'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."newborn_assessments_symptomsassessment_enum" AS ENUM(
                'Respiratory distress',
                'Moaning',
                'Convulsions',
                'Poor movement on stimulation',
                'Not breastfeeding well',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."newborn_assessments_causeofdeath_enum" AS ENUM(
                'Birth Trauma',
                'Hypothermia',
                'Prematurity',
                'Birth asphyxia',
                'Sepsis',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."newborn_assessments_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "newborn_assessments" (
                "id" SERIAL NOT NULL,
                "sex" "public"."newborn_assessments_sex_enum",
                "condition" "public"."newborn_assessments_condition_enum",
                "weight" double precision,
                "temperature" double precision,
                "muac" double precision,
                "headCircumference" double precision,
                "apgarScore" integer,
                "symptomsAssessment" "public"."newborn_assessments_symptomsassessment_enum" array,
                "otherSymptom" character varying,
                "kmcAdministered" boolean NOT NULL DEFAULT false,
                "breastfeedingInitiated" boolean NOT NULL DEFAULT false,
                "medicineProvided" boolean,
                "medicinesAdministered" json,
                "congenitalAnomaly" boolean NOT NULL DEFAULT false,
                "causeOfDeath" "public"."newborn_assessments_causeofdeath_enum" array,
                "status" "public"."newborn_assessments_status_enum" NOT NULL DEFAULT 'Continue',
                "appointment_service_id" integer,
                "patient_id" integer,
                "immunisation_id" integer,
                CONSTRAINT "REL_b2f691639982b1f6fe1eb0e0a7" UNIQUE ("patient_id"),
                CONSTRAINT "REL_eb20fcaddb34c00607889621af" UNIQUE ("immunisation_id"),
                CONSTRAINT "PK_5d95def40a87a8f904c129194e0" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "immunisations" (
                "id" SERIAL NOT NULL,
                "appointment_service_id" integer,
                "patient_id" integer,
                CONSTRAINT "PK_bcdfad75c115239f28a4f8f9e81" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisations_appointment_service_id" ON "immunisations" ("appointment_service_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisations_patient_id" ON "immunisations" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pnc_breastfeedings_breastfeeding_issues_enum" AS ENUM(
                'Sore or cracked nipples',
                'Not enough breastmilk',
                'Too much breastmilk',
                'Baby is not latching on properly',
                'Breast tenderness',
                'Infections',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pnc_breastfeedings" (
                "id" SERIAL NOT NULL,
                "early_breastfeeding" boolean,
                "exclusive_breastfeeding" boolean NOT NULL DEFAULT false,
                "reported_issue_with_breastfeeding" boolean NOT NULL DEFAULT false,
                "breastfeeding_issues" "public"."pnc_breastfeedings_breastfeeding_issues_enum" array,
                "other_breastfeeding_issue" text,
                "appointment_service_id" integer,
                CONSTRAINT "REL_a4a1b2c98287c1a4f70bdd274a" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_0a263a4a6c38886a592e53c6a1d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pnc_family_plannings" (
                "id" SERIAL NOT NULL,
                "counseled_on_family_planning" boolean NOT NULL DEFAULT false,
                "dispenser_fp_methods" boolean NOT NULL DEFAULT false,
                "appointment_service_id" integer,
                CONSTRAINT "REL_d830d7738e618724c708950ec5" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_1bfc16a1d46377e4593757fa1cf" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pnc_postpartum_nutritions" (
                "id" SERIAL NOT NULL,
                "counselled_on_nutrition" boolean NOT NULL DEFAULT false,
                "appointment_service_id" integer,
                CONSTRAINT "REL_ef874cb15833934d5a8f013beb" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_da2a900a3087a1863c22ed31920" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_vital_assessments_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_vital_assessments_albumin_urine_dipstick_enum" AS ENUM('Negative', 'Positive')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."anc_vital_assessments_warning_signs_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Heart disease',
                'Bleeding disorder',
                'C-section',
                'Obstructed labour',
                'Antepartum haemorrhage (APH)',
                'Postpartum haemorrhage (PPH)',
                'Preeclampsia',
                'Eclampsia',
                'Preterm labour',
                'Severe abdominal pain',
                'Vaginal bleeding',
                'Decreased or loss of fetal movement',
                'Collapse / convulsion',
                'Severe headache (with or without visual disturbance)',
                'Severe edema',
                'Categorized as high risk during ANC',
                'Anaemia / low Hb',
                'Ectopic pregnancy',
                'Placenta previa',
                'Chorioamnionitis',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Puerperal sepsis',
                'Intractable vomiting',
                'Physical trauma',
                'Mental trauma',
                'Gastroenteritis',
                'Vaginal discharge',
                'Shortness of breath',
                'Infections',
                'Fever',
                'Malaria',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "anc_vital_assessments" (
                "id" SERIAL NOT NULL,
                "weight" double precision NOT NULL DEFAULT '0',
                "height" double precision NOT NULL DEFAULT '0',
                "temperature" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "body_mass_index" double precision NOT NULL DEFAULT '0',
                "change_in_weight" double precision NOT NULL DEFAULT '0',
                "systolic_bp" double precision NOT NULL DEFAULT '0',
                "diastolic_bp" double precision NOT NULL DEFAULT '0',
                "respiratory_rate" double precision NOT NULL DEFAULT '0',
                "spo2" double precision NOT NULL DEFAULT '0',
                "blood_group" "public"."anc_vital_assessments_blood_group_enum",
                "haemoglobin" double precision NOT NULL DEFAULT '0',
                "fundal_height" double precision,
                "blood_sugar_random" double precision,
                "albumin_urine_dipstick" "public"."anc_vital_assessments_albumin_urine_dipstick_enum",
                "muac" double precision NOT NULL DEFAULT '0',
                "warning_signs" "public"."anc_vital_assessments_warning_signs_enum" array NOT NULL DEFAULT '{}',
                "otherWarningSign" text,
                "appointment_service_id" integer,
                CONSTRAINT "REL_fbefd11976c992ff22bbd2233e" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_8ae5d453ef836c727405e05d441" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pnc_vital_assessments_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pnc_vital_assessments_warning_signs_enum" AS ENUM(
                'Heavy vaginal bleeding',
                'Respiratory difficulty',
                'Convulsions/loss of consciousness',
                'Severe headache with blurred vision',
                'Severe abdominal pain',
                'Foul smelling vaginal discharge',
                'Urinary problem',
                'Fever',
                'PPD',
                'Vaginal tears',
                'Pain in calf',
                'Hallucinations/Indication of self harm tendencies',
                'None',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pnc_vital_assessments" (
                "id" SERIAL NOT NULL,
                "weight" double precision NOT NULL DEFAULT '0',
                "height" double precision NOT NULL DEFAULT '0',
                "systolic_bp" double precision NOT NULL DEFAULT '0',
                "diastolic_bp" double precision NOT NULL DEFAULT '0',
                "temperature" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "spo2" double precision NOT NULL DEFAULT '0',
                "blood_group" "public"."pnc_vital_assessments_blood_group_enum",
                "haemoglobin" double precision NOT NULL DEFAULT '0',
                "blood_sugar_random" double precision NOT NULL DEFAULT '0',
                "muac" double precision NOT NULL DEFAULT '0',
                "warning_signs" "public"."pnc_vital_assessments_warning_signs_enum" array NOT NULL,
                "other_pnc_warning_sign" text,
                "appointment_service_id" integer,
                CONSTRAINT "REL_ac857bc342f77d1ed789f0da25" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_ec7494c5e2c9364e4d031bd8691" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_trimester_enum" AS ENUM('First', 'Second', 'Third')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_high_risk_signs_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Heart disease',
                'Bleeding disorder',
                'C-section',
                'Obstructed labour',
                'Antepartum haemorrhage (APH)',
                'Postpartum haemorrhage (PPH)',
                'Preeclampsia',
                'Eclampsia',
                'Preterm labour',
                'Severe abdominal pain',
                'Vaginal bleeding',
                'Decreased or loss of fetal movement',
                'Collapse / convulsion',
                'Severe headache (with or without visual disturbance)',
                'Severe edema',
                'Categorized as high risk during ANC',
                'Anaemia / low Hb',
                'Ectopic pregnancy',
                'Placenta previa',
                'Chorioamnionitis',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Puerperal sepsis',
                'Intractable vomiting',
                'Physical trauma',
                'Mental trauma',
                'Gastroenteritis',
                'Vaginal discharge',
                'Shortness of breath',
                'Infections',
                'Fever',
                'Malaria',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_hourssincerupture_enum" AS ENUM('1-18 hours', 'More than 18 hours')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_amnioticfluidcolor_enum" AS ENUM('Clear', 'Yellow', 'Green')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_symptomsassessment_enum" AS ENUM(
                'Severe vaginal bleeding',
                'Breathing difficulty',
                'High fever (above 101 F)',
                'Severe headache',
                'Blurred vision',
                'Convulsions/loss of consciousness',
                'Foul-smelling discharge/fluid from vagina',
                'Decrease/absent fetal movements',
                'Leaking meconium-stained fluid',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."pre_delivery_assessments_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pre_delivery_assessments" (
                "id" SERIAL NOT NULL,
                "lmp" TIMESTAMP,
                "gestational_age" double precision NOT NULL,
                "trimester" "public"."pre_delivery_assessments_trimester_enum" NOT NULL,
                "blood_group" "public"."pre_delivery_assessments_blood_group_enum",
                "high_risk_signs" "public"."pre_delivery_assessments_high_risk_signs_enum" array,
                "other_high_risk_sign" character varying,
                "temperature" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "systolicBP" double precision NOT NULL DEFAULT '0',
                "diastolicBP" double precision NOT NULL DEFAULT '0',
                "respiratoryRate" double precision NOT NULL DEFAULT '0',
                "spo2" double precision NOT NULL DEFAULT '0',
                "fetalMovement" boolean NOT NULL,
                "fetalHeartRate" double precision,
                "cervicalDilation" double precision NOT NULL DEFAULT '0',
                "membraneRuptured" boolean NOT NULL,
                "hoursSinceRupture" "public"."pre_delivery_assessments_hourssincerupture_enum",
                "amnioticFluidColor" "public"."pre_delivery_assessments_amnioticfluidcolor_enum" NOT NULL,
                "symptomsAssessment" "public"."pre_delivery_assessments_symptomsassessment_enum" array,
                "status" "public"."pre_delivery_assessments_status_enum" NOT NULL DEFAULT 'Continue',
                "appointment_service_id" integer,
                CONSTRAINT "REL_7ee545f4e212654c1d277ea7f1" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_bc367a421de5af3226cc36fcf8b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_typeofdelivery_enum" AS ENUM(
                'Normal Vaginal Delivery',
                'Assisted Delivery (Vacuum/Forceps)',
                'C-Section',
                'Miscarriage',
                'Induced Abortion'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_reasonforcsection_enum" AS ENUM(
                'Previous cesarean',
                'Arrest of labour',
                'Fetal distress',
                'Placenta previa',
                'Malpresentation',
                'Pre-eclampsia/eclampsia',
                'Failed instrumental delivery',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_mothercondition_enum" AS ENUM(
                'Alive and healthy',
                'Alive and unhealthy',
                'Dead',
                'Referred during delivery'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_symptomsassessment_enum" AS ENUM(
                'Foul smelling vaginal discharge',
                'Severe bleeding',
                'Third degree perineal tear',
                'Fourth degree perineal tear',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_immediatesteps_enum" AS ENUM(
                'Oxytocin administered within 1 min',
                'Placenta and membrane delivered',
                'Well contracted uterus',
                'Early initiation of breastfeeding process'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_complications_enum" AS ENUM(
                'APH',
                'PPH',
                'Cord prolapse',
                'Shoulder dystocia',
                'Prolonged / Obstructed Labor',
                'Rupture uterus',
                'Pre-eclampsia',
                'Eclampsia',
                'Sepsis',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_causeofdeath_enum" AS ENUM(
                'APH',
                'PPH',
                'Cord prolapse',
                'Shoulder dystocia',
                'Prolonged / Obstructed Labor',
                'Rupture uterus',
                'Pre-eclampsia',
                'Eclampsia',
                'Sepsis',
                'Other obstetric cause',
                'Other non-obstetric cause'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."post_delivery_assessments_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "post_delivery_assessments" (
                "id" SERIAL NOT NULL,
                "typeOfDelivery" "public"."post_delivery_assessments_typeofdelivery_enum" NOT NULL,
                "reasonForCSection" "public"."post_delivery_assessments_reasonforcsection_enum",
                "otherReasonForCSection" character varying,
                "motherCondition" "public"."post_delivery_assessments_mothercondition_enum" NOT NULL,
                "symptomsAssessment" "public"."post_delivery_assessments_symptomsassessment_enum" array,
                "immediateSteps" "public"."post_delivery_assessments_immediatesteps_enum" array,
                "complications" "public"."post_delivery_assessments_complications_enum" array,
                "otherComplication" character varying,
                "temperature" double precision,
                "pulse" double precision,
                "systolicBP" double precision,
                "diastolicBP" double precision,
                "respiratoryRate" double precision,
                "rbs" double precision,
                "hb" double precision,
                "spo2" double precision,
                "medicinesAdministered" json,
                "causeOfDeath" "public"."post_delivery_assessments_causeofdeath_enum" array,
                "status" "public"."post_delivery_assessments_status_enum" NOT NULL DEFAULT 'Continue',
                "appointment_service_id" integer,
                CONSTRAINT "REL_5cdb98d5f58f055fc0422b62a0" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_c5852f837d18709f36522a3daf8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."discharge_details_dischargechecklist_enum" AS ENUM(
                'Applied chlorhexidine on cord',
                'Counselled on exclusive breastfeeding',
                'Initiated breastfeeding process within one hour',
                'Counselled on family planning',
                'Provided family planning commodities',
                'Explained warning signs for mother and child to patient',
                'Provided counselling on false labor management'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."discharge_details_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "discharge_details" (
                "id" SERIAL NOT NULL,
                "dischargeChecklist" "public"."discharge_details_dischargechecklist_enum" array,
                "familyPlanningCommodity" character varying,
                "followUpDate" date,
                "status" "public"."discharge_details_status_enum" NOT NULL DEFAULT 'Discharged',
                "appointment_service_id" integer,
                CONSTRAINT "REL_95dfa6d5de58f1648c547bcd76" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_014e9e7ded97af69a76886f7a83" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_whorequiresreferral_enum" AS ENUM('Mother', 'Child')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_mothercomplications_enum" AS ENUM(
                'Categorized as high risk during ANC',
                'Anaemia/low HB',
                'Hypertension',
                'Preeclampsia',
                'Eclampsia',
                'Ectopic pregnancy',
                'Placenta previa',
                'Antepartum haemorrhage',
                'Chorioamnionitis',
                'Preterm labor',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Obstructed labor',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Postpartum haemorrhage',
                'Puerperal Sepsis',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_childcomplications_enum" AS ENUM(
                'Low APGAR score',
                'No spontaneous movement',
                'Stopped breastfeeding well',
                'Hypothermia',
                'Fever',
                'Fast breathing (breathing rate >60/min)',
                'Severe chest in-drawing',
                'History of convulsions',
                'Jaundice',
                'Underweight',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_levelofcare_enum" AS ENUM('Primary', 'Secondary', 'Tertiary', 'Office')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_typeofservice_enum" AS ENUM(
                'OPD',
                'ANC',
                'DELIVERY',
                'PNC',
                'FAMILY_PLANNING',
                'IMMUNISATION',
                'NUTRITION',
                'MEDICINE_DISPENSING',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_typeofreferral_enum" AS ENUM('internal', 'external')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referral_details_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "referral_details" (
                "id" SERIAL NOT NULL,
                "whoRequiresReferral" "public"."referral_details_whorequiresreferral_enum" array,
                "motherComplications" "public"."referral_details_mothercomplications_enum" array,
                "childComplications" "public"."referral_details_childcomplications_enum" array,
                "otherComplication" character varying,
                "levelOfCare" "public"."referral_details_levelofcare_enum",
                "typeOfService" "public"."referral_details_typeofservice_enum",
                "typeOfReferral" "public"."referral_details_typeofreferral_enum",
                "status" "public"."referral_details_status_enum" NOT NULL DEFAULT 'Refer to CEmONC facility',
                "appointment_service_id" integer,
                "district_id" integer,
                "facility_id" integer,
                CONSTRAINT "PK_165b11f3e8a58120fe53456e98e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_service_info_patient_coming_from_enum" AS ENUM(
                'Refer by LHW',
                'Referred by another site',
                'Direct from community'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_service_info_reason_for_admission_enum" AS ENUM(
                'Relapse',
                'Transfer from stabilisation centre',
                'Return after default',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "nutrition_service_info" (
                "id" SERIAL NOT NULL,
                "patient_coming_from" "public"."nutrition_service_info_patient_coming_from_enum" NOT NULL,
                "reason_for_admission" "public"."nutrition_service_info_reason_for_admission_enum" NOT NULL,
                "counselled_on_nutrition_and_diet" boolean NOT NULL DEFAULT false,
                "appointment_service_id" integer,
                CONSTRAINT "REL_bde19e9da041478f8f8d090611" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_35a8d23dca333aba61f8a635993" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."nutrition_vital_assessments_edema_enum" AS ENUM('Mild', 'Moderate', 'Severe', 'No edema')
        `);
        await queryRunner.query(`
            CREATE TABLE "nutrition_vital_assessments" (
                "id" SERIAL NOT NULL,
                "weight" double precision NOT NULL DEFAULT '0',
                "height" double precision NOT NULL DEFAULT '0',
                "systolic_bp" double precision,
                "diastolic_bp" double precision,
                "temperature" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "muac" double precision,
                "edema" "public"."nutrition_vital_assessments_edema_enum" NOT NULL,
                "is_experiencing_complications" boolean NOT NULL DEFAULT false,
                "complications" jsonb NOT NULL DEFAULT '[]',
                "appointment_service_id" integer,
                CONSTRAINT "REL_74e722a19d5033b880f0726ef4" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_273c0f35422a5d6fc79a41c15ab" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_medical_histories_presenting_complaints_enum" AS ENUM(
                'Fever',
                'Pain',
                'Swelling or Mass',
                'Dyspnea',
                'Cough',
                'Vomitting',
                'Diarrhea',
                'Fits',
                'Weakness',
                'Headache',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_medical_histories_associated_conditions_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Thyroid disorder',
                'Dyslipidemia',
                'Anemia',
                'Asthma',
                'COPD',
                'Chronic kidney disease',
                'Hepatitis B',
                'Hepatitis C',
                'HIV',
                'Tuberculosis',
                'Epilepsy / Seizure disorder',
                'Bleeding/clotting disorder',
                'Autoimmune disease',
                'Heart failure',
                'Ischemic heart disease / MI',
                'Stroke',
                'Major surgery',
                'Psychiatric condition',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_medical_histories_allergy_enum" AS ENUM('Pollen', 'Dust', 'Penicillin', 'Other')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_medical_histories_obstetric_complication_details_enum" AS ENUM(
                'Hypertension',
                'Diabetes',
                'Heart disease',
                'Bleeding disorder',
                'C-Section',
                'Obstructed labour',
                'Antepartum haemorrhage (APH)',
                'Postpartum haemorrhage (PPH)',
                'Preeclampsia',
                'Eclampsia',
                'Preterm labour',
                'Severe abdominal pain',
                'Vaginal bleeding',
                'Decreased or loss of fetal movement',
                'Collapse / convulsion',
                'Severe headache (with or without visual disturbance)',
                'Severe edema',
                'Categorized as high risk during ANC',
                'Anaemia / low Hb',
                'Ectopic pregnancy',
                'Placenta previa',
                'Chorioamnionitis',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Puerperal sepsis',
                'Intractable vomiting',
                'Physical trauma',
                'Mental trauma',
                'Gastroenteritis',
                'Vaginal discharge',
                'Shortness of breath',
                'Infections',
                'Fever',
                'Malaria',
                'Jaundice',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "opd_medical_histories" (
                "id" SERIAL NOT NULL,
                "presenting_complaints" "public"."opd_medical_histories_presenting_complaints_enum" array NOT NULL DEFAULT '{}',
                "presenting_complaints_other" character varying,
                "previous_illness" jsonb NOT NULL,
                "previous_illness_other" character varying,
                "associated_conditions" "public"."opd_medical_histories_associated_conditions_enum" array NOT NULL DEFAULT '{}',
                "associated_conditions_other" character varying,
                "known_allergies" boolean NOT NULL,
                "allergy" "public"."opd_medical_histories_allergy_enum" array,
                "previous_medication" boolean NOT NULL,
                "previous_medication_details" character varying,
                "obstetric_complication" boolean,
                "obstetric_complication_details" "public"."opd_medical_histories_obstetric_complication_details_enum" array,
                "past_obstetric_complication_other" character varying,
                "previous_surgery" boolean NOT NULL,
                "previous_surgery_details" character varying,
                "appointmentServiceId" integer,
                CONSTRAINT "REL_4d3c4cf25dbcaaf8aa2e1f858a" UNIQUE ("appointmentServiceId"),
                CONSTRAINT "PK_7dda6fab8cc99ab924e870b2278" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_diagnosis_patientfinaldiagnosis_enum" AS ENUM('Available', 'Requires a follow-up')
        `);
        await queryRunner.query(`
            CREATE TABLE "opd_diagnosis" (
                "id" SERIAL NOT NULL,
                "patientFinalDiagnosis" "public"."opd_diagnosis_patientfinaldiagnosis_enum" NOT NULL,
                "final_diagnosis" jsonb,
                "otherFinalDiagnosis" character varying,
                "appointment_service_id" integer,
                CONSTRAINT "REL_a0927a0326d385147c73203a7d" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_7d63180709f254685ffa4b46fb6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."opd_vital_assessments_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "opd_vital_assessments" (
                "id" SERIAL NOT NULL,
                "weight" double precision NOT NULL DEFAULT '0',
                "height" double precision NOT NULL DEFAULT '0',
                "body_mass_index" double precision NOT NULL DEFAULT '0',
                "change_in_weight" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "systolic_bp" double precision,
                "diastolic_bp" double precision,
                "temperature" double precision NOT NULL DEFAULT '0',
                "respiratory_rate" double precision NOT NULL DEFAULT '0',
                "blood_group" "public"."opd_vital_assessments_blood_group_enum",
                "appointment_service_id" integer,
                CONSTRAINT "REL_eed8833c2c8c35d4fbdb549f93" UNIQUE ("appointment_service_id"),
                CONSTRAINT "PK_aeb695190423836b9ded8c06b78" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."other_prescriptions_category_enum" AS ENUM('Medicine', 'Supplement')
        `);
        await queryRunner.query(`
            CREATE TABLE "other_prescriptions" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "medicine_dosage" character varying(20),
                "medicine_duration" integer,
                "quantity" integer,
                "medicine_instruction" character varying(255),
                "category" "public"."other_prescriptions_category_enum",
                "updated_by" integer,
                "appointment_service_id" integer,
                "visit_id" integer,
                CONSTRAINT "PK_7051d08cc1cedb89938afcec603" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."appointment_services_status_enum" AS ENUM(
                'registered',
                'pending',
                'in_progress',
                'paused',
                'completed',
                'referred_in',
                'referred_out'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."appointment_services_delivery_progress_status_enum" AS ENUM(
                'False labor',
                'Continue',
                'Refer to CEmONC facility',
                'LAMA',
                'Discharged'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "appointment_services" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "status" "public"."appointment_services_status_enum" NOT NULL DEFAULT 'pending',
                "delivery_progress_status" "public"."appointment_services_delivery_progress_status_enum",
                "updated_by" integer,
                "patient_id" integer,
                "appointment_id" integer,
                "service_id" integer,
                CONSTRAINT "PK_8423f59b66c157533b4df8b0459" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_appt_services_composite" ON "appointment_services" ("appointment_id", "status")
        `);
        await queryRunner.query(`
            CREATE TABLE "delivery_patients" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "appointment_service_id" integer,
                "mother_id" integer,
                "child_id" integer,
                "facility_id" integer,
                CONSTRAINT "REL_025011c04efc022e7fb425e361" UNIQUE ("child_id"),
                CONSTRAINT "PK_a87853c57f9cf054f03d71dd9d3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."facilities_level_of_care_enum" AS ENUM('Primary', 'Secondary', 'Tertiary', 'Office')
        `);
        await queryRunner.query(`
            CREATE TABLE "facilities" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "code" numeric,
                "uc_id" integer,
                "facility_type" character varying(10),
                "managed_by" character varying(10),
                "is_24_7" boolean DEFAULT false,
                "bmu" boolean DEFAULT false,
                "otp" boolean DEFAULT false,
                "nsc" boolean DEFAULT false,
                "lat" double precision,
                "long" double precision,
                "level_of_care" "public"."facilities_level_of_care_enum",
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "district_id" integer,
                CONSTRAINT "PK_2e6c685b2e1195e6d6394a22bc7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "facility_name_index" ON "facilities" ("name")
        `);
        await queryRunner.query(`
            CREATE INDEX "facility_code_index" ON "facilities" ("code")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_personal_infos_gender_enum" AS ENUM('Male', 'Female', 'Other')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_personal_infos_blood_type_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_personal_infos_marital_status_enum" AS ENUM(
                'Single',
                'Married',
                'Widowed',
                'Divorced',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_personal_infos" (
                "id" SERIAL NOT NULL,
                "cnic" character varying(13) NOT NULL,
                "dob" date NOT NULL,
                "gender" "public"."user_personal_infos_gender_enum" NOT NULL,
                "contact" character varying(15) NOT NULL,
                "address" text NOT NULL,
                "qualifications" character varying(255),
                "specialization" character varying(255),
                "emergency_contact" character varying(15),
                "blood_type" "public"."user_personal_infos_blood_type_enum",
                "marital_status" "public"."user_personal_infos_marital_status_enum" NOT NULL,
                "nationality" character varying(100) NOT NULL,
                "religion" character varying(25) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer,
                CONSTRAINT "REL_07bf05814da7271f937c6e8c66" UNIQUE ("user_id"),
                CONSTRAINT "PK_9fefa19e94d05bf09465598a83d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patient_queues_status_enum" AS ENUM(
                'registered',
                'pending',
                'in_progress',
                'paused',
                'completed',
                'referred_in',
                'referred_out'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_queues" (
                "id" SERIAL NOT NULL,
                "status" "public"."patient_queues_status_enum" NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "patient_id" integer,
                "doctor_id" integer,
                "appointment_id" integer,
                CONSTRAINT "REL_671242a11ef6d0e93f455334e9" UNIQUE ("appointment_id"),
                CONSTRAINT "PK_e6dffee5d7ebf54597881483eb3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_queues_doctor_id" ON "patient_queues" ("doctor_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_queues_appointment_id" ON "patient_queues" ("appointment_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_queues_patient_id" ON "patient_queues" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "medical_histories" (
                "id" SERIAL NOT NULL,
                "allergies" jsonb,
                "previous_illness" jsonb,
                "addictions" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                "doctor_id" integer,
                CONSTRAINT "REL_346f79a689d013533a8b6f1c7d" UNIQUE ("patient_id"),
                CONSTRAINT "PK_8b0170de8abb52639e20c046533" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "appointment_doctors" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "is_primary" boolean NOT NULL DEFAULT false,
                "updated_by" integer,
                "appointment_id" integer,
                "doctor_id" integer,
                CONSTRAINT "UQ_5a3f8af3a5904da2d7793e37d98" UNIQUE ("appointment_id", "doctor_id"),
                CONSTRAINT "PK_c02843a5c65b18debd7d34e51ac" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_status_enum" AS ENUM('pending', 'approved', 'rejected')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying(255) NOT NULL,
                "division_id" integer NOT NULL,
                "district_id" integer NOT NULL,
                "taluka_id" integer NOT NULL,
                "uc_id" integer NOT NULL,
                "status" "public"."users_status_enum" NOT NULL DEFAULT 'pending',
                "access_token" text,
                "must_change_password" boolean NOT NULL DEFAULT false,
                "latitude" double precision,
                "longitude" double precision,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "role_id" integer,
                "facility_id" integer,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_users_facility_id" ON "users" ("facility_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_users_role_id" ON "users" ("role_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "follow_ups" (
                "id" SERIAL NOT NULL,
                "visit_date" date NOT NULL,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                "doctor_id" integer,
                "service_id" integer,
                CONSTRAINT "PK_d510aabdff2ec7fdc67a1092157" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patient_additional_infos_marital_status_enum" AS ENUM(
                'Single',
                'Married',
                'Widowed',
                'Divorced',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patient_additional_infos_blood_group_enum" AS ENUM(
                'A +ve',
                'A -ve',
                'B +ve',
                'B -ve',
                'AB +ve',
                'AB -ve',
                'O +ve',
                'O -ve'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_additional_infos" (
                "id" SERIAL NOT NULL,
                "marital_status" "public"."patient_additional_infos_marital_status_enum" NOT NULL,
                "blood_group" "public"."patient_additional_infos_blood_group_enum",
                "guardian_name" character varying(50),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                CONSTRAINT "REL_ffe243ca7e7339c1aeadceb16f" UNIQUE ("patient_id"),
                CONSTRAINT "PK_cde748ee150c7befe663038cc99" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_additional_info" ON "patient_additional_infos" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patient_social_determinants_years_of_education_enum" AS ENUM(
                'No formal education',
                'Primary',
                'Secondary',
                'Intermediate',
                'Diploma',
                'Bachelor or higher'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_social_determinants" (
                "id" SERIAL NOT NULL,
                "dwelling_type" character varying(255),
                "occupation_head_of_household" character varying(255),
                "household_members_count" integer,
                "mother_tongue" character varying(15),
                "years_of_education" "public"."patient_social_determinants_years_of_education_enum",
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                CONSTRAINT "REL_55957570d72987e24d4447f976" UNIQUE ("patient_id"),
                CONSTRAINT "PK_88c73db48326198f7739cb3cc8f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_social_det" ON "patient_social_determinants" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patient_immunisations_status_enum" AS ENUM(
                'Pending',
                'Scheduled',
                'Administered',
                'Defaulter',
                'Expired',
                'Closed',
                'REFUSED',
                'RETRO',
                'RETRO_DATE_MISSING',
                'VACCINATED',
                'SCHEDULED'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_immunisations" (
                "id" SERIAL NOT NULL,
                "status" "public"."patient_immunisations_status_enum" NOT NULL DEFAULT 'Pending',
                "next_due_date" date,
                "remarks" text,
                "updated" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                CONSTRAINT "REL_79b793c1c2249e59087e624570" UNIQUE ("patient_id"),
                CONSTRAINT "PK_67f0e7d49e0b9c7d58e43b62bfb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_pi_next_due_date" ON "patient_immunisations" ("next_due_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_pi_status" ON "patient_immunisations" ("status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."immunisation_cards_place_of_delivery_enum" AS ENUM(
                'Public health facility',
                'Private health facility',
                'Informal delivery center',
                'Home',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."immunisation_cards_level_of_care_enum" AS ENUM('Primary', 'Secondary', 'Tertiary', 'Office')
        `);
        await queryRunner.query(`
            CREATE TABLE "immunisation_cards" (
                "id" SERIAL NOT NULL,
                "place_of_delivery" "public"."immunisation_cards_place_of_delivery_enum",
                "districtId" character varying(255),
                "talukaId" character varying(255),
                "level_of_care" "public"."immunisation_cards_level_of_care_enum",
                "facility_id" character varying,
                "other_facility_name" character varying(255),
                "immunisation_card_available" boolean,
                "immunisation_card_provided" boolean,
                "patient_id" integer,
                CONSTRAINT "REL_070fe1a19c42911f88c1811691" UNIQUE ("patient_id"),
                CONSTRAINT "PK_4fdf14eaa16a0435ed90e9e2411" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisation_cards_patient_id" ON "immunisation_cards" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patients_cnic_provider_enum" AS ENUM(
                'Self',
                'Mother',
                'Father',
                'Sibling',
                'Spouse',
                'Guardian',
                'Uncle/Aunt (blood-relation)',
                'CNIC Not Available',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patients_nationality_status_enum" AS ENUM('Pakistani', 'Non-Pakistani')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patients_registration_type_enum" AS ENUM(
                'Internal',
                'Delivery',
                'Outreach',
                'Private',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patients_gender_enum" AS ENUM('Male', 'Female', 'Other')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."patients_phone_provider_enum" AS ENUM(
                'Self',
                'Mother',
                'Father',
                'Sibling',
                'Spouse',
                'Guardian',
                'Uncle/Aunt (blood-relation)',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patients" (
                "id" SERIAL NOT NULL,
                "cnic_provider" "public"."patients_cnic_provider_enum" NOT NULL,
                "nationality_status" "public"."patients_nationality_status_enum" NOT NULL DEFAULT 'Pakistani',
                "cnic" character varying(20),
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "dob" date NOT NULL,
                "immunisation_number" character varying(20),
                "mobile_hash" character varying(255),
                "registration_type" "public"."patients_registration_type_enum",
                "gender" "public"."patients_gender_enum" NOT NULL,
                "phone_provider" "public"."patients_phone_provider_enum" NOT NULL DEFAULT 'Self',
                "phone_number" character varying(15) NOT NULL,
                "address" text NOT NULL,
                "division_id" integer NOT NULL,
                "district_id" integer NOT NULL,
                "facility_id" integer,
                "taluka_id" integer NOT NULL,
                "uc_id" integer,
                "mr_no" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_46095e49eae456e34bca592ab81" UNIQUE ("mr_no"),
                CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e85d7621a5f92d115a77fa2b5e" ON "patients" ("cnic")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9d1297a7e4cea1d695fc050eec" ON "patients" ("phone_number")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_46095e49eae456e34bca592ab8" ON "patients" ("mr_no")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patients_uc_id" ON "patients" ("uc_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patients_created_at" ON "patients" ("created_at")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_patients_mobile_hash" ON "patients" ("mobile_hash")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_patients_immunisation_number" ON "patients" ("immunisation_number")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_patients_cnic_self" ON "patients" ("cnic")
            WHERE "cnic_provider" = 'Self'
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."appointments_status_enum" AS ENUM(
                'registered',
                'pending',
                'in_progress',
                'paused',
                'completed',
                'referred_in',
                'referred_out'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "appointments" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "token_number" character varying,
                "patient_id" integer NOT NULL,
                "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'pending',
                "visit_id" integer,
                "updated_by" integer,
                "doctor_id" integer,
                "facility_id" integer,
                CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_patient_id" ON "appointments" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_doctor_id" ON "appointments" ("doctor_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_visit" ON "appointments" ("visit_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vital_assessments_dehydration_level_enum" AS ENUM('Mild', 'Moderate', 'Severe')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vital_assessments_family_planning_methods_enum" AS ENUM(
                'Rubber Condom',
                'COC',
                'POP',
                'ECP',
                '3 months Inj Depo',
                '3 months Inj Sayana Press',
                'Copper-T',
                'Multiload',
                'Jadelle',
                'Implanon',
                'Implanon NXT',
                'Tubal ligation (CS for female)',
                'Vasectomy (CS for male)'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "vital_assessments" (
                "id" SERIAL NOT NULL,
                "weight" double precision NOT NULL DEFAULT '0',
                "height" double precision NOT NULL DEFAULT '0',
                "body_mass_index" double precision NOT NULL DEFAULT '0',
                "pulse" double precision NOT NULL DEFAULT '0',
                "systolic_bp" double precision,
                "diastolic_bp" double precision,
                "temperature" double precision NOT NULL DEFAULT '0',
                "respiratory_rate" double precision NOT NULL DEFAULT '0',
                "spo2" double precision,
                "is_anemic" boolean,
                "is_dehydrated" boolean,
                "dehydration_level" "public"."vital_assessments_dehydration_level_enum",
                "cough_gt_2_weeks" boolean,
                "family_planning_user" boolean,
                "family_planning_methods" "public"."vital_assessments_family_planning_methods_enum" array,
                "appointment_id" integer,
                "visit_id" integer,
                CONSTRAINT "REL_6dee8a49c78f683170c8af59cd" UNIQUE ("appointment_id"),
                CONSTRAINT "REL_a6f03b4f434e7bb20b22c34491" UNIQUE ("visit_id"),
                CONSTRAINT "PK_fccd89ba809c91c77dfdf91b35e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_vital_assessments_appt" ON "vital_assessments" ("appointment_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_vital_assessments_visit" ON "vital_assessments" ("visit_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "token_counters" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "last_token" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_17c24b8920f262769b26fe4e7d6" UNIQUE ("date"),
                CONSTRAINT "PK_dac12327920bfda2328afd6bad4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "telehealth_consultation_notes" (
                "id" SERIAL NOT NULL,
                "request_id" integer NOT NULL,
                "patient_id" integer NOT NULL,
                "appointment_id" integer,
                "consultant_doctor_id" integer NOT NULL,
                "primary_doctor_id" integer,
                "note" text NOT NULL,
                "submitted_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "REL_2ed1125f6f2573986d82587eba" UNIQUE ("request_id"),
                CONSTRAINT "PK_0f3eed5728d7c942a496f69d7bb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."telehealth_requests_status_enum" AS ENUM(
                'pending',
                'accepted',
                'rejected',
                'cancelled',
                'in_session',
                'completed'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "telehealth_requests" (
                "id" SERIAL NOT NULL,
                "patient_id" integer NOT NULL,
                "appointment_service_id" integer NOT NULL,
                "requesting_doctor_id" integer NOT NULL,
                "consultant_doctor_id" integer NOT NULL,
                "specialty" character varying(255),
                "reason" text NOT NULL,
                "status" "public"."telehealth_requests_status_enum" NOT NULL DEFAULT 'pending',
                "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
                "responded_at" TIMESTAMP,
                "accepted_at" TIMESTAMP,
                "rejected_at" TIMESTAMP,
                "cancelled_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "rejected_reason" text,
                "cancel_reason" text,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_837af98c74dc45b5c3376f0c5f8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."telehealth_sessions_provider_enum" AS ENUM('google_meet')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."telehealth_sessions_status_enum" AS ENUM('pending', 'active', 'ended', 'failed')
        `);
        await queryRunner.query(`
            CREATE TABLE "telehealth_sessions" (
                "id" SERIAL NOT NULL,
                "request_id" integer NOT NULL,
                "provider" "public"."telehealth_sessions_provider_enum" NOT NULL DEFAULT 'google_meet',
                "meeting_url" text,
                "external_meeting_id" character varying(255),
                "status" "public"."telehealth_sessions_status_enum" NOT NULL DEFAULT 'pending',
                "requesting_doctor_id" integer NOT NULL,
                "consultant_doctor_id" integer NOT NULL,
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "metadata" jsonb,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_5278d32e9e95f2a2cc87b9b8bc7" UNIQUE ("request_id"),
                CONSTRAINT "REL_5278d32e9e95f2a2cc87b9b8bc" UNIQUE ("request_id"),
                CONSTRAINT "PK_16b8226eeef7fa971abbce5ee0d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id" SERIAL NOT NULL,
                "payload" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "role_id" integer,
                CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "unassigned_patients" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                "facility_id" integer,
                CONSTRAINT "PK_f6262c25e8733ece045a3bf3700" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_unassigned_patients_facility_id" ON "unassigned_patients" ("facility_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_unassigned_patients_patient_id" ON "unassigned_patients" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_type_of_service_enum" AS ENUM(
                'OPD',
                'ANC',
                'DELIVERY',
                'PNC',
                'FAMILY_PLANNING',
                'IMMUNISATION',
                'NUTRITION',
                'MEDICINE_DISPENSING',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_whichchildrequiredreferral_enum" AS ENUM('FIRST_CHILD', 'SECOND_CHILD', 'THIRD_CHILD')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_mothercomplications_enum" AS ENUM(
                'Categorized as high risk during ANC',
                'Anaemia/low HB',
                'Hypertension',
                'Preeclampsia',
                'Eclampsia',
                'Ectopic pregnancy',
                'Placenta previa',
                'Antepartum haemorrhage',
                'Chorioamnionitis',
                'Preterm labor',
                'Fetopelvic disproportion',
                'Nuchal cord',
                'Obstructed labor',
                'Shoulder dystocia',
                'Prolapsed umbilical cord',
                'Uterine rupture',
                'Amniotic fluid embolism',
                'Meconium passed',
                'Perinatal asphyxia',
                'Intrauterine death',
                'Inverted uterus',
                'Postpartum haemorrhage',
                'Puerperal Sepsis',
                'Other',
                'None'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_childcomplications_enum" AS ENUM(
                'Low APGAR score',
                'No spontaneous movement',
                'Stopped breastfeeding well',
                'Hypothermia',
                'Fever',
                'Fast breathing (breathing rate >60/min)',
                'Severe chest in-drawing',
                'History of convulsions',
                'Jaundice',
                'Underweight',
                'Other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_level_of_care_enum" AS ENUM('Primary', 'Secondary', 'Tertiary', 'Office')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."referrals_type_enum" AS ENUM('internal', 'external')
        `);
        await queryRunner.query(`
            CREATE TABLE "referrals" (
                "id" SERIAL NOT NULL,
                "refer_out_reason" text,
                "type_of_service" "public"."referrals_type_of_service_enum",
                "whoRequiresReferral" character varying(50),
                "whichChildRequiredReferral" "public"."referrals_whichchildrequiredreferral_enum" array,
                "motherComplications" "public"."referrals_mothercomplications_enum" array,
                "childComplications" "public"."referrals_childcomplications_enum" array,
                "level_of_care" "public"."referrals_level_of_care_enum",
                "type" "public"."referrals_type_enum" NOT NULL DEFAULT 'internal',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "patient_id" integer,
                "referred_from_id" integer,
                "referred_to_id" integer,
                "district_id" integer,
                "facility_id" integer,
                CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_daily_rollups" (
                "id" BIGSERIAL NOT NULL,
                "rollup_date" date NOT NULL,
                "aggregation_type" character varying(20) NOT NULL,
                "dimension_id" integer NOT NULL DEFAULT '0',
                "patient_count" bigint NOT NULL DEFAULT '0',
                "male_count" bigint NOT NULL DEFAULT '0',
                "female_count" bigint NOT NULL DEFAULT '0',
                "other_count" bigint NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "uq_patient_daily_rollup_date_type_dimension" UNIQUE (
                    "rollup_date",
                    "aggregation_type",
                    "dimension_id"
                ),
                CONSTRAINT "PK_03c340bf27d99a034b051b3fb2d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_daily_rollup_lookup" ON "patient_daily_rollups" (
                "aggregation_type",
                "dimension_id",
                "rollup_date"
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_recipients" (
                "id" SERIAL NOT NULL,
                "notificationId" integer,
                "userId" integer,
                "roleId" integer,
                CONSTRAINT "PK_bd5b25c456987261a38c762b223" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "message" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_notifications" (
                "id" SERIAL NOT NULL,
                "read" boolean NOT NULL DEFAULT false,
                "read_at" TIMESTAMP,
                "notificationId" integer,
                "userId" integer,
                CONSTRAINT "PK_569622b0fd6e6ab3661de985a2b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_request_items" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "requested_qty" integer NOT NULL,
                "approved_qty" integer,
                "updated_by" integer,
                "request_id" integer,
                "medicine_id" integer,
                CONSTRAINT "PK_82a80623bda1f8b40e67d676aa1" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."medicine_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'AMENDED')
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_requests" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "status" "public"."medicine_requests_status_enum" NOT NULL DEFAULT 'PENDING',
                "request_date" TIMESTAMP NOT NULL,
                "approved_date" TIMESTAMP,
                "remarks" text,
                "updated_by" integer,
                "doctor_id" integer,
                "facility_id" integer,
                "approved_by" integer,
                CONSTRAINT "PK_fd12e996b61a84c3c72dfdb648d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "doctor_medicine_stocks" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "quantity" integer NOT NULL,
                "updated_by" integer,
                "doctor_id" integer,
                "facility_id" integer,
                "medicine_variant_id" integer,
                CONSTRAINT "PK_255364218092df39fe1122a0467" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."leave_status_enum" AS ENUM('Pending', 'Approved')
        `);
        await queryRunner.query(`
            CREATE TABLE "leave" (
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" integer NOT NULL DEFAULT '1',
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "facility_id" integer NOT NULL,
                "start_date" date NOT NULL,
                "end_date" date NOT NULL,
                "reason" text,
                "status" "public"."leave_status_enum" NOT NULL DEFAULT 'Pending',
                "updated_by" integer,
                CONSTRAINT "PK_501f6ea368365d2a40b1660e16b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_vaccine_status_snapshots" (
                "id" BIGSERIAL NOT NULL,
                "patient_id" integer NOT NULL,
                "vaccine_id" integer NOT NULL,
                "status" character varying(50) NOT NULL,
                "date_administered" date,
                "next_due_date" date,
                "calculated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "uq_patient_vaccine_status_snapshot" UNIQUE ("patient_id", "vaccine_id"),
                CONSTRAINT "PK_4ec3d48e2e4cfb86bba9dc75bd5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_vaccine_status_patient_updated" ON "patient_vaccine_status_snapshots" ("patient_id", "updated_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_vaccine_status_updated_at" ON "patient_vaccine_status_snapshots" ("updated_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_vaccine_status_patient" ON "patient_vaccine_status_snapshots" ("patient_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "patient_immunisation_daily_rollups" (
                "id" BIGSERIAL NOT NULL,
                "rollup_date" date NOT NULL,
                "facility_id" integer NOT NULL DEFAULT '0',
                "uc_id" integer NOT NULL DEFAULT '0',
                "status" character varying(50) NOT NULL,
                "remarks_bucket" character varying(20) NOT NULL,
                "immunisation_count" bigint NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "uq_patient_immunisation_daily_rollup_filters" UNIQUE (
                    "rollup_date",
                    "facility_id",
                    "uc_id",
                    "status",
                    "remarks_bucket"
                ),
                CONSTRAINT "PK_7dfc0298bc04976959117f9a626" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_patient_immunisation_daily_rollup_lookup" ON "patient_immunisation_daily_rollups" (
                "facility_id",
                "uc_id",
                "status",
                "remarks_bucket",
                "rollup_date"
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "immunisation_rollup_seen_vaccines" (
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
            CREATE TABLE "immunisation_rollup_seen_patients" (
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
            CREATE TABLE "immunisation_rollup_checkpoint" (
                "job_name" character varying(100) NOT NULL,
                "last_processed_id" bigint NOT NULL DEFAULT '0',
                "high_watermark_id" bigint NOT NULL DEFAULT '0',
                "completed" boolean NOT NULL DEFAULT false,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bdb9ecc05836f8f3576e55120ab" PRIMARY KEY ("job_name")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "immunisation_daily_rollups" (
                "id" BIGSERIAL NOT NULL,
                "rollup_date" date NOT NULL,
                "aggregation_type" character varying(20) NOT NULL,
                "dimension_id" integer NOT NULL DEFAULT '0',
                "dose_count" bigint NOT NULL DEFAULT '0',
                "distinct_patient_count" bigint NOT NULL DEFAULT '0',
                "distinct_vaccine_count" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "uq_immunisation_daily_rollup_date_type_dimension" UNIQUE (
                    "rollup_date",
                    "aggregation_type",
                    "dimension_id"
                ),
                CONSTRAINT "PK_0cabba4ff5f32c76b466f036334" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_immunisation_daily_rollup_lookup" ON "immunisation_daily_rollups" (
                "aggregation_type",
                "dimension_id",
                "rollup_date"
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "doctor_visit_rollup_checkpoint" (
                "job_name" character varying(100) NOT NULL,
                "last_processed_id" bigint NOT NULL DEFAULT '0',
                "high_watermark_id" bigint NOT NULL DEFAULT '0',
                "completed" boolean NOT NULL DEFAULT false,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_b0dbab61d9ab7db5f21cce88b66" PRIMARY KEY ("job_name")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "doctor_visit_daily_rollups" (
                "id" BIGSERIAL NOT NULL,
                "rollup_date" date NOT NULL,
                "aggregation_type" character varying(20) NOT NULL,
                "doctor_id" integer NOT NULL,
                "visit_count" bigint NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "uq_doctor_visit_daily_rollup_date_type_doctor" UNIQUE ("rollup_date", "aggregation_type", "doctor_id"),
                CONSTRAINT "PK_0c598883f4f6eef11fcf80a8b81" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_doctor_visit_daily_rollup_lookup" ON "doctor_visit_daily_rollups" ("aggregation_type", "doctor_id", "rollup_date")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."commodity_request_items_purpose_enum" AS ENUM(
                'STAFF ON CALL DUTY',
                'EMERGENCY USE',
                'STOCK REFILL'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."commodity_request_items_status_enum" AS ENUM(
                'PENDING',
                'APPROVED',
                'REJECTED',
                'PARTIALLY_FULFILLED'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "commodity_request_items" (
                "id" SERIAL NOT NULL,
                "medicineVariantId" integer NOT NULL,
                "quantityRequested" integer NOT NULL,
                "quantityDispensed" integer,
                "purpose" "public"."commodity_request_items_purpose_enum" NOT NULL,
                "status" "public"."commodity_request_items_status_enum" NOT NULL DEFAULT 'PENDING',
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "commodity_request_id" integer,
                "medicine_variant_id" integer,
                CONSTRAINT "PK_98f33e317b3cedcc335a63ced58" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."commodity_requests_initiatorrole_enum" AS ENUM(
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
            CREATE TYPE "public"."commodity_requests_issuedto_enum" AS ENUM(
                'super_admin',
                'admin',
                'facility_incharge',
                'registration_clerk',
                'sba',
                'medical_officer_male',
                'medical_officer_female',
                'vaccinator',
                'dispenser'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."commodity_requests_status_enum" AS ENUM(
                'PENDING',
                'APPROVED',
                'REJECTED',
                'PARTIALLY_FULFILLED'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "commodity_requests" (
                "id" SERIAL NOT NULL,
                "initiatorRole" "public"."commodity_requests_initiatorrole_enum" NOT NULL,
                "requesterId" integer NOT NULL,
                "facility_id" integer,
                "requesterName" character varying,
                "issuedTo" "public"."commodity_requests_issuedto_enum",
                "issuedToStaffId" integer,
                "status" "public"."commodity_requests_status_enum" NOT NULL DEFAULT 'PENDING',
                "processedById" integer,
                "approvedBy" character varying,
                "rejectedBy" character varying,
                "processedAt" TIMESTAMP,
                "rejectionReason" text,
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8c20e7d65bdb902b7ad49cb9533" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "clients" (
                "id" SERIAL NOT NULL,
                "client_key" character varying(128) NOT NULL,
                "client_name" character varying(120) NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "allowed_ips" text array NOT NULL DEFAULT '{}',
                CONSTRAINT "UQ_def868eaa27d1a9a2c136af18e0" UNIQUE ("client_key"),
                CONSTRAINT "UQ_22f7e5f9138149a624c88dfcc84" UNIQUE ("client_name"),
                CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "facility_id" integer,
                "method" character varying(10) NOT NULL,
                "route" character varying(300) NOT NULL,
                "body" jsonb,
                "params" jsonb,
                "query" jsonb,
                "ip" character varying(100),
                "status_code" integer,
                "execution_time_ms" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."attendance_status_enum" AS ENUM('Checked In', 'Checked Out')
        `);
        await queryRunner.query(`
            CREATE TABLE "attendance" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "facility_id" integer,
                "check_in_time" TIMESTAMP NOT NULL,
                "latitude" double precision,
                "longitude" double precision,
                "check_out_time" TIMESTAMP,
                "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'Checked In',
                "is_mobile" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_attendance_facility_id" ON "attendance" ("facility_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_attendance_user_id" ON "attendance" ("user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "permissions"
            ADD CONSTRAINT "FK_f10931e7bb05a3b434642ed2797" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "divisions"
            ADD CONSTRAINT "FK_54ade1d0baf374851d0f72a6949" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ucs"
            ADD CONSTRAINT "FK_3abc6589798d9dc95c5d828d6da" FOREIGN KEY ("taluka_id") REFERENCES "talukas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "talukas"
            ADD CONSTRAINT "FK_5680bf3712816d0960ffb5fcaf6" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "districts"
            ADD CONSTRAINT "FK_b0f53665358e2fee2fd290d115f" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
        await queryRunner.query(`
            ALTER TABLE "family_plannings"
            ADD CONSTRAINT "FK_9f559ec533d787d6fdca61129da" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "family_plannings"
            ADD CONSTRAINT "FK_a27a1ffef87c853b4bd20197886" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "family_plannings"
            ADD CONSTRAINT "FK_e7da41a790a440a64b938862c31" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "previous_pregnancies"
            ADD CONSTRAINT "FK_3359ae65dc0ed6dc0106b3a51b5" FOREIGN KEY ("pregnancy_info_id") REFERENCES "anc_pregnancy_infos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_pregnancy_infos"
            ADD CONSTRAINT "FK_14a602a36836b7fa975e0ea75a5" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories"
            ADD CONSTRAINT "FK_7dd558ad7446a1250ac684a3b73" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "diagnosis"
            ADD CONSTRAINT "FK_2cf4b6c60eabaf155b39d174680" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "visits"
            ADD CONSTRAINT "FK_f9c96a7f69031d2c15280efce45" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "visits"
            ADD CONSTRAINT "FK_536e1fece6179617590857aec67" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "visits"
            ADD CONSTRAINT "FK_5054db93135a6d966fd3939caa6" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "visits"
            ADD CONSTRAINT "FK_0d4a11043d1ce4e4eb506bf5aa0" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_vitals"
            ADD CONSTRAINT "FK_da12b2c66aaa8121de589de3e62" FOREIGN KEY ("emergency_patient_id") REFERENCES "emergency_patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes"
            ADD CONSTRAINT "FK_90dc179c88f5912da50d07bdf04" FOREIGN KEY ("emergency_patient_id") REFERENCES "emergency_patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes"
            ADD CONSTRAINT "FK_d20df814abad316f107c2902104" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes"
            ADD CONSTRAINT "FK_dcdd37c3d3b3fb298790aa26cbf" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_patients"
            ADD CONSTRAINT "FK_b7305abac05e925a5b033211527" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_patients"
            ADD CONSTRAINT "FK_51359844b972c1d52b41116730c" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_3c13afd63e9e47afaf1d099d3a8" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_d6593526eeaf5c00f85d5404cae" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_ec8441af65844c3f555d4c7897b" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_ac1fb4fa5ce5d0b083343422d75" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_594e274b66aa6871be03df0aa18" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers"
            ADD CONSTRAINT "FK_ebf0046a3d4cf290e1a4d94ac50" FOREIGN KEY ("emergency_patient_id") REFERENCES "emergency_patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items"
            ADD CONSTRAINT "FK_147a3178fb05fa1df9b007fe575" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items"
            ADD CONSTRAINT "FK_23dcace0e05a6d211c4f716b390" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items"
            ADD CONSTRAINT "FK_31ce9f0f6df7dbf1971c9798eb6" FOREIGN KEY ("dispense_id") REFERENCES "dispensers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items"
            ADD CONSTRAINT "FK_c48cc8ff971c785e3378d9f54e9" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items"
            ADD CONSTRAINT "FK_de6aa0255c3e033dfc48f6623a7" FOREIGN KEY ("batch_id") REFERENCES "medicine_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches"
            ADD CONSTRAINT "FK_94beb41850e01c3433ee3a9b90e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches"
            ADD CONSTRAINT "FK_dad21e528eab024dc5ba4164352" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches"
            ADD CONSTRAINT "FK_7cdd2a2b8394b08d44d360751ca" FOREIGN KEY ("variant_id") REFERENCES "medicine_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches"
            ADD CONSTRAINT "FK_a851280adb899669caeba6714e9" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches"
            ADD CONSTRAINT "FK_498e85135a75aae5beecac59f4a" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count"
            ADD CONSTRAINT "FK_26b214eb9944a945c2d35acf9a3" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count"
            ADD CONSTRAINT "FK_fd82384f7b9bfd0764f89f9738b" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count"
            ADD CONSTRAINT "FK_6a5aea9892e27070524a7a7752a" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_variants"
            ADD CONSTRAINT "FK_47c01c77151e4a9a78fc4a62c29" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_8b46fdc4a903b002fdfe30e2287" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_cc04cb0b0c7ebac24d87d8d9771" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_d2b3852a98783b047a303a06cdf" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_d6e24e1d2db61f07ee0574cad2c" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_a6578313f14ea989bb422597ff8" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions"
            ADD CONSTRAINT "FK_2d1f899105e5bd055213351dafc" FOREIGN KEY ("emergency_patient_id") REFERENCES "emergency_patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ultrasounds"
            ADD CONSTRAINT "FK_8959cd79025ba83639ddb595ee5" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ctgs"
            ADD CONSTRAINT "FK_260f7c006913f3ad8fa86665454" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses"
            ADD CONSTRAINT "FK_62dfce3414d862a0b2fe6d3020e" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses"
            ADD CONSTRAINT "FK_ecc7ab691cd43fe7089e2cd1728" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses"
            ADD CONSTRAINT "FK_0098fc1604bd696b774bb1649bd" FOREIGN KEY ("immunisation_id") REFERENCES "immunisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses"
            ADD CONSTRAINT "FK_0e7fe2b0734324e6b4479db582b" FOREIGN KEY ("vaccinated_by") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments"
            ADD CONSTRAINT "FK_ef4f0f51b16e778753311c09dee" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments"
            ADD CONSTRAINT "FK_b2f691639982b1f6fe1eb0e0a71" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments"
            ADD CONSTRAINT "FK_eb20fcaddb34c00607889621afc" FOREIGN KEY ("immunisation_id") REFERENCES "immunisations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisations"
            ADD CONSTRAINT "FK_96addee717f48f5e7a9256627ee" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisations"
            ADD CONSTRAINT "FK_930e47210e7e08c898fbe6c09c0" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_breastfeedings"
            ADD CONSTRAINT "FK_a4a1b2c98287c1a4f70bdd274ab" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_family_plannings"
            ADD CONSTRAINT "FK_d830d7738e618724c708950ec54" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_postpartum_nutritions"
            ADD CONSTRAINT "FK_ef874cb15833934d5a8f013beb8" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_vital_assessments"
            ADD CONSTRAINT "FK_fbefd11976c992ff22bbd2233eb" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_vital_assessments"
            ADD CONSTRAINT "FK_ac857bc342f77d1ed789f0da25c" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pre_delivery_assessments"
            ADD CONSTRAINT "FK_7ee545f4e212654c1d277ea7f1b" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "post_delivery_assessments"
            ADD CONSTRAINT "FK_5cdb98d5f58f055fc0422b62a06" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "discharge_details"
            ADD CONSTRAINT "FK_95dfa6d5de58f1648c547bcd765" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details"
            ADD CONSTRAINT "FK_d8b09113bc462324b2e02663c92" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details"
            ADD CONSTRAINT "FK_fa31152e787683f91d6bfd962c4" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details"
            ADD CONSTRAINT "FK_14f5e45636775cb2633b2eb606b" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_service_info"
            ADD CONSTRAINT "FK_bde19e9da041478f8f8d0906111" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_vital_assessments"
            ADD CONSTRAINT "FK_74e722a19d5033b880f0726ef4f" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_medical_histories"
            ADD CONSTRAINT "FK_4d3c4cf25dbcaaf8aa2e1f858ae" FOREIGN KEY ("appointmentServiceId") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_diagnosis"
            ADD CONSTRAINT "FK_a0927a0326d385147c73203a7da" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_vital_assessments"
            ADD CONSTRAINT "FK_eed8833c2c8c35d4fbdb549f93c" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions"
            ADD CONSTRAINT "FK_7b831064a7386a83353af9cdb86" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions"
            ADD CONSTRAINT "FK_6dd250f33b08365001227b0a078" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions"
            ADD CONSTRAINT "FK_c084c4531ff94f0365d8f2bd2b0" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions"
            ADD CONSTRAINT "FK_60937e891c7163b7eb70e09e3f8" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services"
            ADD CONSTRAINT "FK_c0125f683316693b22591e87ea9" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services"
            ADD CONSTRAINT "FK_d016a7765f514c76cbc0533881d" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services"
            ADD CONSTRAINT "FK_4cb2d4406ef9d812bb990bd03eb" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services"
            ADD CONSTRAINT "FK_923e323e598280a0454e1d1b7cf" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services"
            ADD CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients"
            ADD CONSTRAINT "FK_2bbed23df2c4a18003fc52eceeb" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients"
            ADD CONSTRAINT "FK_639cd5aa7124b1f0b30081c0de3" FOREIGN KEY ("mother_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients"
            ADD CONSTRAINT "FK_025011c04efc022e7fb425e3619" FOREIGN KEY ("child_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients"
            ADD CONSTRAINT "FK_4384e24164dc92437c908e8f6f3" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities"
            ADD CONSTRAINT "FK_48f83eadd61bf57e3afa5d62ab6" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities"
            ADD CONSTRAINT "FK_150acd5514c979b700415e47451" FOREIGN KEY ("uc_id") REFERENCES "ucs"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_personal_infos"
            ADD CONSTRAINT "FK_07bf05814da7271f937c6e8c668" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues"
            ADD CONSTRAINT "FK_3dc214934ec16fb7e3f0626678a" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues"
            ADD CONSTRAINT "FK_06476c3769036a66cdee21dfcf3" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues"
            ADD CONSTRAINT "FK_671242a11ef6d0e93f455334e92" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_histories"
            ADD CONSTRAINT "FK_346f79a689d013533a8b6f1c7dd" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_histories"
            ADD CONSTRAINT "FK_499c19b31792aaab9186e8b0768" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors"
            ADD CONSTRAINT "FK_5895511abab1295035aaebee53d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors"
            ADD CONSTRAINT "FK_2a2e17826845e80b67ee605bab5" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors"
            ADD CONSTRAINT "FK_e2d918dbb247c4b8099c46f8d06" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors"
            ADD CONSTRAINT "FK_2c44888e5aca23ddd12fbac181d" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_5cce3415d144173ca33ed1d8626" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_46cb7d993da1fac77fca2cbb79e" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_efc03fc2a5902ef17fb8a2bdcc2" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_55eb90d9891fe65a9bc31a524aa" FOREIGN KEY ("taluka_id") REFERENCES "talukas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_74685c30b5a37f87d49d1240b84" FOREIGN KEY ("uc_id") REFERENCES "ucs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups"
            ADD CONSTRAINT "FK_998be7cf5b7cd4e63e58332944a" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups"
            ADD CONSTRAINT "FK_706b235bf92eb5cd320fe519f47" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups"
            ADD CONSTRAINT "FK_b9035a2a73d3502d7dc99111ffd" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_additional_infos"
            ADD CONSTRAINT "FK_ffe243ca7e7339c1aeadceb16f1" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_social_determinants"
            ADD CONSTRAINT "FK_55957570d72987e24d4447f9761" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_immunisations"
            ADD CONSTRAINT "FK_79b793c1c2249e59087e624570b" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_cards"
            ADD CONSTRAINT "FK_070fe1a19c42911f88c18116910" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_d7ca5e722b384f282042d92f4c1" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_513848484c6f8b4144dda24aa2d" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_94a5d22901092a3dd14b5b38d69" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "FK_e99a186016ddb879dfbce84606c" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "vital_assessments"
            ADD CONSTRAINT "FK_6dee8a49c78f683170c8af59cde" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "vital_assessments"
            ADD CONSTRAINT "FK_a6f03b4f434e7bb20b22c344914" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes"
            ADD CONSTRAINT "FK_2ed1125f6f2573986d82587ebaa" FOREIGN KEY ("request_id") REFERENCES "telehealth_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes"
            ADD CONSTRAINT "FK_fa9a0cf4205c0266c2d5d114dfe" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes"
            ADD CONSTRAINT "FK_f9147e4f16d328e2ea34000844b" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes"
            ADD CONSTRAINT "FK_c658b490409fa18bd1ebbce3031" FOREIGN KEY ("consultant_doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes"
            ADD CONSTRAINT "FK_a5b950a17fbaa8519fa4f4c3de8" FOREIGN KEY ("primary_doctor_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests"
            ADD CONSTRAINT "FK_73e75c4b2e6084770b3ec2b98c4" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests"
            ADD CONSTRAINT "FK_fa85c993b5c4d76e2fb975acdbd" FOREIGN KEY ("appointment_service_id") REFERENCES "appointment_services"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests"
            ADD CONSTRAINT "FK_ad1b83c376210ead7a80ee82305" FOREIGN KEY ("requesting_doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests"
            ADD CONSTRAINT "FK_e40bbb9629eb5655fe5314779d4" FOREIGN KEY ("consultant_doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions"
            ADD CONSTRAINT "FK_5278d32e9e95f2a2cc87b9b8bc7" FOREIGN KEY ("request_id") REFERENCES "telehealth_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions"
            ADD CONSTRAINT "FK_398a04e44f9746ed187d4551e88" FOREIGN KEY ("requesting_doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions"
            ADD CONSTRAINT "FK_ad4e9c1464128eec9966e4cdccd" FOREIGN KEY ("consultant_doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "unassigned_patients"
            ADD CONSTRAINT "FK_06e624b9269c68c08ecf0ce4c6a" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "unassigned_patients"
            ADD CONSTRAINT "FK_ec9e05a69209daabbb172db7ccf" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals"
            ADD CONSTRAINT "FK_bb61873c1c10fe8662f540f0625" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals"
            ADD CONSTRAINT "FK_a2f9143659795c2a4879b793200" FOREIGN KEY ("referred_from_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals"
            ADD CONSTRAINT "FK_ccc840e93284e8c54ef5e50420c" FOREIGN KEY ("referred_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals"
            ADD CONSTRAINT "FK_d7038c2cab97164b25a3e677352" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals"
            ADD CONSTRAINT "FK_52f51bbbe6f57208a6dd67d6a00" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients"
            ADD CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients"
            ADD CONSTRAINT "FK_452385a8220b8053ab65317ffa6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients"
            ADD CONSTRAINT "FK_3852dc04e40c1ebb8ec68d9a050" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_notifications"
            ADD CONSTRAINT "FK_01a2c65f414d36cfe6f5d950fb2" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_notifications"
            ADD CONSTRAINT "FK_cb22b968fe41a9f8b219327fde8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items"
            ADD CONSTRAINT "FK_d71005634e895dac56b7f25271e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items"
            ADD CONSTRAINT "FK_8d0b9c007bbe940c0a806076fe7" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items"
            ADD CONSTRAINT "FK_6bbac5f4d3b675e6c300ac932c3" FOREIGN KEY ("request_id") REFERENCES "medicine_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items"
            ADD CONSTRAINT "FK_36e840f0045268394d87adb403e" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests"
            ADD CONSTRAINT "FK_bbe816d3460fa9742d90b9ae622" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests"
            ADD CONSTRAINT "FK_e490aa656af5b8145cafdcfcecc" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests"
            ADD CONSTRAINT "FK_1d02c062584fa28dfe3a84baf2f" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests"
            ADD CONSTRAINT "FK_a9d3fdf680dfa21de66f2b6db5f" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests"
            ADD CONSTRAINT "FK_8666574dd429e9dbdcd00b6b785" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks"
            ADD CONSTRAINT "FK_e7ff487b363087432db9d9f4249" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks"
            ADD CONSTRAINT "FK_160126473a82b3eb52289ce66dc" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks"
            ADD CONSTRAINT "FK_96b23f6b306b734a427d236eff9" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks"
            ADD CONSTRAINT "FK_fd71808dd06f9be94ae3b8bd286" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks"
            ADD CONSTRAINT "FK_25f52a67f58bb0c690f9ae602e3" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave"
            ADD CONSTRAINT "FK_e99a7775f91cc9c2f5ed4425b9b" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave"
            ADD CONSTRAINT "FK_31e38385083b349a8c05d35ed83" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave"
            ADD CONSTRAINT "FK_bd5bb1ea0d8b3498b0e52e51e65" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "leave"
            ADD CONSTRAINT "FK_756b33bec5a59e20784f94e8e76" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_vaccine_status_snapshots"
            ADD CONSTRAINT "FK_29d6fc48bbb96791d0eeb40899e" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_vaccine_status_snapshots"
            ADD CONSTRAINT "FK_b611d78c40a20203dc28d313e9f" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_request_items"
            ADD CONSTRAINT "FK_f56256e1b9e1f69718fcbec6214" FOREIGN KEY ("commodity_request_id") REFERENCES "commodity_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_request_items"
            ADD CONSTRAINT "FK_a60364bc96d03bdf62d08fea5b9" FOREIGN KEY ("medicine_variant_id") REFERENCES "medicine_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_requests"
            ADD CONSTRAINT "FK_6c6357ef32344a0a23597797b15" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_cdb2157a793c1edb481dc84d570" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance"
            ADD CONSTRAINT "FK_0bedbcc8d5f9b9ec4979f519597" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance"
            ADD CONSTRAINT "FK_a466f376de67d76a3b5d7c84c2b" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "attendance" DROP CONSTRAINT "FK_a466f376de67d76a3b5d7c84c2b"
        `);
        await queryRunner.query(`
            ALTER TABLE "attendance" DROP CONSTRAINT "FK_0bedbcc8d5f9b9ec4979f519597"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cdb2157a793c1edb481dc84d570"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_requests" DROP CONSTRAINT "FK_6c6357ef32344a0a23597797b15"
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_request_items" DROP CONSTRAINT "FK_a60364bc96d03bdf62d08fea5b9"
        `);
        await queryRunner.query(`
            ALTER TABLE "commodity_request_items" DROP CONSTRAINT "FK_f56256e1b9e1f69718fcbec6214"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_vaccine_status_snapshots" DROP CONSTRAINT "FK_b611d78c40a20203dc28d313e9f"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_vaccine_status_snapshots" DROP CONSTRAINT "FK_29d6fc48bbb96791d0eeb40899e"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave" DROP CONSTRAINT "FK_756b33bec5a59e20784f94e8e76"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave" DROP CONSTRAINT "FK_bd5bb1ea0d8b3498b0e52e51e65"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave" DROP CONSTRAINT "FK_31e38385083b349a8c05d35ed83"
        `);
        await queryRunner.query(`
            ALTER TABLE "leave" DROP CONSTRAINT "FK_e99a7775f91cc9c2f5ed4425b9b"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks" DROP CONSTRAINT "FK_25f52a67f58bb0c690f9ae602e3"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks" DROP CONSTRAINT "FK_fd71808dd06f9be94ae3b8bd286"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks" DROP CONSTRAINT "FK_96b23f6b306b734a427d236eff9"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks" DROP CONSTRAINT "FK_160126473a82b3eb52289ce66dc"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_medicine_stocks" DROP CONSTRAINT "FK_e7ff487b363087432db9d9f4249"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests" DROP CONSTRAINT "FK_8666574dd429e9dbdcd00b6b785"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests" DROP CONSTRAINT "FK_a9d3fdf680dfa21de66f2b6db5f"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests" DROP CONSTRAINT "FK_1d02c062584fa28dfe3a84baf2f"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests" DROP CONSTRAINT "FK_e490aa656af5b8145cafdcfcecc"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_requests" DROP CONSTRAINT "FK_bbe816d3460fa9742d90b9ae622"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items" DROP CONSTRAINT "FK_36e840f0045268394d87adb403e"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items" DROP CONSTRAINT "FK_6bbac5f4d3b675e6c300ac932c3"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items" DROP CONSTRAINT "FK_8d0b9c007bbe940c0a806076fe7"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_request_items" DROP CONSTRAINT "FK_d71005634e895dac56b7f25271e"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_cb22b968fe41a9f8b219327fde8"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_01a2c65f414d36cfe6f5d950fb2"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_3852dc04e40c1ebb8ec68d9a050"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_452385a8220b8053ab65317ffa6"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b"
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals" DROP CONSTRAINT "FK_52f51bbbe6f57208a6dd67d6a00"
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals" DROP CONSTRAINT "FK_d7038c2cab97164b25a3e677352"
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals" DROP CONSTRAINT "FK_ccc840e93284e8c54ef5e50420c"
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals" DROP CONSTRAINT "FK_a2f9143659795c2a4879b793200"
        `);
        await queryRunner.query(`
            ALTER TABLE "referrals" DROP CONSTRAINT "FK_bb61873c1c10fe8662f540f0625"
        `);
        await queryRunner.query(`
            ALTER TABLE "unassigned_patients" DROP CONSTRAINT "FK_ec9e05a69209daabbb172db7ccf"
        `);
        await queryRunner.query(`
            ALTER TABLE "unassigned_patients" DROP CONSTRAINT "FK_06e624b9269c68c08ecf0ce4c6a"
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions" DROP CONSTRAINT "FK_ad4e9c1464128eec9966e4cdccd"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions" DROP CONSTRAINT "FK_398a04e44f9746ed187d4551e88"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_sessions" DROP CONSTRAINT "FK_5278d32e9e95f2a2cc87b9b8bc7"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests" DROP CONSTRAINT "FK_e40bbb9629eb5655fe5314779d4"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests" DROP CONSTRAINT "FK_ad1b83c376210ead7a80ee82305"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests" DROP CONSTRAINT "FK_fa85c993b5c4d76e2fb975acdbd"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_requests" DROP CONSTRAINT "FK_73e75c4b2e6084770b3ec2b98c4"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes" DROP CONSTRAINT "FK_a5b950a17fbaa8519fa4f4c3de8"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes" DROP CONSTRAINT "FK_c658b490409fa18bd1ebbce3031"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes" DROP CONSTRAINT "FK_f9147e4f16d328e2ea34000844b"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes" DROP CONSTRAINT "FK_fa9a0cf4205c0266c2d5d114dfe"
        `);
        await queryRunner.query(`
            ALTER TABLE "telehealth_consultation_notes" DROP CONSTRAINT "FK_2ed1125f6f2573986d82587ebaa"
        `);
        await queryRunner.query(`
            ALTER TABLE "vital_assessments" DROP CONSTRAINT "FK_a6f03b4f434e7bb20b22c344914"
        `);
        await queryRunner.query(`
            ALTER TABLE "vital_assessments" DROP CONSTRAINT "FK_6dee8a49c78f683170c8af59cde"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_e99a186016ddb879dfbce84606c"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_94a5d22901092a3dd14b5b38d69"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_3330f054416745deaa2cc130700"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_513848484c6f8b4144dda24aa2d"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments" DROP CONSTRAINT "FK_d7ca5e722b384f282042d92f4c1"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_cards" DROP CONSTRAINT "FK_070fe1a19c42911f88c18116910"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_immunisations" DROP CONSTRAINT "FK_79b793c1c2249e59087e624570b"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_social_determinants" DROP CONSTRAINT "FK_55957570d72987e24d4447f9761"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_additional_infos" DROP CONSTRAINT "FK_ffe243ca7e7339c1aeadceb16f1"
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_b9035a2a73d3502d7dc99111ffd"
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_706b235bf92eb5cd320fe519f47"
        `);
        await queryRunner.query(`
            ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_998be7cf5b7cd4e63e58332944a"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_74685c30b5a37f87d49d1240b84"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_55eb90d9891fe65a9bc31a524aa"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_efc03fc2a5902ef17fb8a2bdcc2"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_46cb7d993da1fac77fca2cbb79e"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_5cce3415d144173ca33ed1d8626"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors" DROP CONSTRAINT "FK_2c44888e5aca23ddd12fbac181d"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors" DROP CONSTRAINT "FK_e2d918dbb247c4b8099c46f8d06"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors" DROP CONSTRAINT "FK_2a2e17826845e80b67ee605bab5"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_doctors" DROP CONSTRAINT "FK_5895511abab1295035aaebee53d"
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_histories" DROP CONSTRAINT "FK_499c19b31792aaab9186e8b0768"
        `);
        await queryRunner.query(`
            ALTER TABLE "medical_histories" DROP CONSTRAINT "FK_346f79a689d013533a8b6f1c7dd"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues" DROP CONSTRAINT "FK_671242a11ef6d0e93f455334e92"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues" DROP CONSTRAINT "FK_06476c3769036a66cdee21dfcf3"
        `);
        await queryRunner.query(`
            ALTER TABLE "patient_queues" DROP CONSTRAINT "FK_3dc214934ec16fb7e3f0626678a"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_personal_infos" DROP CONSTRAINT "FK_07bf05814da7271f937c6e8c668"
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities" DROP CONSTRAINT "FK_150acd5514c979b700415e47451"
        `);
        await queryRunner.query(`
            ALTER TABLE "facilities" DROP CONSTRAINT "FK_48f83eadd61bf57e3afa5d62ab6"
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients" DROP CONSTRAINT "FK_4384e24164dc92437c908e8f6f3"
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients" DROP CONSTRAINT "FK_025011c04efc022e7fb425e3619"
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients" DROP CONSTRAINT "FK_639cd5aa7124b1f0b30081c0de3"
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_patients" DROP CONSTRAINT "FK_2bbed23df2c4a18003fc52eceeb"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_923e323e598280a0454e1d1b7cf"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_4cb2d4406ef9d812bb990bd03eb"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_d016a7765f514c76cbc0533881d"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointment_services" DROP CONSTRAINT "FK_c0125f683316693b22591e87ea9"
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions" DROP CONSTRAINT "FK_60937e891c7163b7eb70e09e3f8"
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions" DROP CONSTRAINT "FK_c084c4531ff94f0365d8f2bd2b0"
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions" DROP CONSTRAINT "FK_6dd250f33b08365001227b0a078"
        `);
        await queryRunner.query(`
            ALTER TABLE "other_prescriptions" DROP CONSTRAINT "FK_7b831064a7386a83353af9cdb86"
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_vital_assessments" DROP CONSTRAINT "FK_eed8833c2c8c35d4fbdb549f93c"
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_diagnosis" DROP CONSTRAINT "FK_a0927a0326d385147c73203a7da"
        `);
        await queryRunner.query(`
            ALTER TABLE "opd_medical_histories" DROP CONSTRAINT "FK_4d3c4cf25dbcaaf8aa2e1f858ae"
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_vital_assessments" DROP CONSTRAINT "FK_74e722a19d5033b880f0726ef4f"
        `);
        await queryRunner.query(`
            ALTER TABLE "nutrition_service_info" DROP CONSTRAINT "FK_bde19e9da041478f8f8d0906111"
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details" DROP CONSTRAINT "FK_14f5e45636775cb2633b2eb606b"
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details" DROP CONSTRAINT "FK_fa31152e787683f91d6bfd962c4"
        `);
        await queryRunner.query(`
            ALTER TABLE "referral_details" DROP CONSTRAINT "FK_d8b09113bc462324b2e02663c92"
        `);
        await queryRunner.query(`
            ALTER TABLE "discharge_details" DROP CONSTRAINT "FK_95dfa6d5de58f1648c547bcd765"
        `);
        await queryRunner.query(`
            ALTER TABLE "post_delivery_assessments" DROP CONSTRAINT "FK_5cdb98d5f58f055fc0422b62a06"
        `);
        await queryRunner.query(`
            ALTER TABLE "pre_delivery_assessments" DROP CONSTRAINT "FK_7ee545f4e212654c1d277ea7f1b"
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_vital_assessments" DROP CONSTRAINT "FK_ac857bc342f77d1ed789f0da25c"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_vital_assessments" DROP CONSTRAINT "FK_fbefd11976c992ff22bbd2233eb"
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_postpartum_nutritions" DROP CONSTRAINT "FK_ef874cb15833934d5a8f013beb8"
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_family_plannings" DROP CONSTRAINT "FK_d830d7738e618724c708950ec54"
        `);
        await queryRunner.query(`
            ALTER TABLE "pnc_breastfeedings" DROP CONSTRAINT "FK_a4a1b2c98287c1a4f70bdd274ab"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisations" DROP CONSTRAINT "FK_930e47210e7e08c898fbe6c09c0"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisations" DROP CONSTRAINT "FK_96addee717f48f5e7a9256627ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments" DROP CONSTRAINT "FK_eb20fcaddb34c00607889621afc"
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments" DROP CONSTRAINT "FK_b2f691639982b1f6fe1eb0e0a71"
        `);
        await queryRunner.query(`
            ALTER TABLE "newborn_assessments" DROP CONSTRAINT "FK_ef4f0f51b16e778753311c09dee"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses" DROP CONSTRAINT "FK_0e7fe2b0734324e6b4479db582b"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses" DROP CONSTRAINT "FK_0098fc1604bd696b774bb1649bd"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses" DROP CONSTRAINT "FK_ecc7ab691cd43fe7089e2cd1728"
        `);
        await queryRunner.query(`
            ALTER TABLE "immunisation_doses" DROP CONSTRAINT "FK_62dfce3414d862a0b2fe6d3020e"
        `);
        await queryRunner.query(`
            ALTER TABLE "ctgs" DROP CONSTRAINT "FK_260f7c006913f3ad8fa86665454"
        `);
        await queryRunner.query(`
            ALTER TABLE "ultrasounds" DROP CONSTRAINT "FK_8959cd79025ba83639ddb595ee5"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_2d1f899105e5bd055213351dafc"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_a6578313f14ea989bb422597ff8"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_d6e24e1d2db61f07ee0574cad2c"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_d2b3852a98783b047a303a06cdf"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_cc04cb0b0c7ebac24d87d8d9771"
        `);
        await queryRunner.query(`
            ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_8b46fdc4a903b002fdfe30e2287"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_variants" DROP CONSTRAINT "FK_47c01c77151e4a9a78fc4a62c29"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count" DROP CONSTRAINT "FK_6a5aea9892e27070524a7a7752a"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count" DROP CONSTRAINT "FK_fd82384f7b9bfd0764f89f9738b"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_count" DROP CONSTRAINT "FK_26b214eb9944a945c2d35acf9a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches" DROP CONSTRAINT "FK_498e85135a75aae5beecac59f4a"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches" DROP CONSTRAINT "FK_a851280adb899669caeba6714e9"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches" DROP CONSTRAINT "FK_7cdd2a2b8394b08d44d360751ca"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches" DROP CONSTRAINT "FK_dad21e528eab024dc5ba4164352"
        `);
        await queryRunner.query(`
            ALTER TABLE "medicine_batches" DROP CONSTRAINT "FK_94beb41850e01c3433ee3a9b90e"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_de6aa0255c3e033dfc48f6623a7"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_c48cc8ff971c785e3378d9f54e9"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_31ce9f0f6df7dbf1971c9798eb6"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_23dcace0e05a6d211c4f716b390"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_147a3178fb05fa1df9b007fe575"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_ebf0046a3d4cf290e1a4d94ac50"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_594e274b66aa6871be03df0aa18"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_ac1fb4fa5ce5d0b083343422d75"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_ec8441af65844c3f555d4c7897b"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_d6593526eeaf5c00f85d5404cae"
        `);
        await queryRunner.query(`
            ALTER TABLE "dispensers" DROP CONSTRAINT "FK_3c13afd63e9e47afaf1d099d3a8"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_patients" DROP CONSTRAINT "FK_51359844b972c1d52b41116730c"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_patients" DROP CONSTRAINT "FK_b7305abac05e925a5b033211527"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes" DROP CONSTRAINT "FK_dcdd37c3d3b3fb298790aa26cbf"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes" DROP CONSTRAINT "FK_d20df814abad316f107c2902104"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_outcomes" DROP CONSTRAINT "FK_90dc179c88f5912da50d07bdf04"
        `);
        await queryRunner.query(`
            ALTER TABLE "emergency_vitals" DROP CONSTRAINT "FK_da12b2c66aaa8121de589de3e62"
        `);
        await queryRunner.query(`
            ALTER TABLE "visits" DROP CONSTRAINT "FK_0d4a11043d1ce4e4eb506bf5aa0"
        `);
        await queryRunner.query(`
            ALTER TABLE "visits" DROP CONSTRAINT "FK_5054db93135a6d966fd3939caa6"
        `);
        await queryRunner.query(`
            ALTER TABLE "visits" DROP CONSTRAINT "FK_536e1fece6179617590857aec67"
        `);
        await queryRunner.query(`
            ALTER TABLE "visits" DROP CONSTRAINT "FK_f9c96a7f69031d2c15280efce45"
        `);
        await queryRunner.query(`
            ALTER TABLE "diagnosis" DROP CONSTRAINT "FK_2cf4b6c60eabaf155b39d174680"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_medical_surgical_histories" DROP CONSTRAINT "FK_7dd558ad7446a1250ac684a3b73"
        `);
        await queryRunner.query(`
            ALTER TABLE "anc_pregnancy_infos" DROP CONSTRAINT "FK_14a602a36836b7fa975e0ea75a5"
        `);
        await queryRunner.query(`
            ALTER TABLE "previous_pregnancies" DROP CONSTRAINT "FK_3359ae65dc0ed6dc0106b3a51b5"
        `);
        await queryRunner.query(`
            ALTER TABLE "family_plannings" DROP CONSTRAINT "FK_e7da41a790a440a64b938862c31"
        `);
        await queryRunner.query(`
            ALTER TABLE "family_plannings" DROP CONSTRAINT "FK_a27a1ffef87c853b4bd20197886"
        `);
        await queryRunner.query(`
            ALTER TABLE "family_plannings" DROP CONSTRAINT "FK_9f559ec533d787d6fdca61129da"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT "FK_74bbbb213ecc45e9444e3145b2b"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT "FK_37ea84a080a4b47133471852d54"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT "FK_f69a57030f0d995b65098f84d37"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_services" DROP CONSTRAINT "FK_ac4d6845272cbe1fbbf153a4c88"
        `);
        await queryRunner.query(`
            ALTER TABLE "districts" DROP CONSTRAINT "FK_b0f53665358e2fee2fd290d115f"
        `);
        await queryRunner.query(`
            ALTER TABLE "talukas" DROP CONSTRAINT "FK_5680bf3712816d0960ffb5fcaf6"
        `);
        await queryRunner.query(`
            ALTER TABLE "ucs" DROP CONSTRAINT "FK_3abc6589798d9dc95c5d828d6da"
        `);
        await queryRunner.query(`
            ALTER TABLE "divisions" DROP CONSTRAINT "FK_54ade1d0baf374851d0f72a6949"
        `);
        await queryRunner.query(`
            ALTER TABLE "permissions" DROP CONSTRAINT "FK_f10931e7bb05a3b434642ed2797"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_attendance_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_attendance_facility_id"
        `);
        await queryRunner.query(`
            DROP TABLE "attendance"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."attendance_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
        await queryRunner.query(`
            DROP TABLE "clients"
        `);
        await queryRunner.query(`
            DROP TABLE "commodity_requests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."commodity_requests_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."commodity_requests_issuedto_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."commodity_requests_initiatorrole_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "commodity_request_items"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."commodity_request_items_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."commodity_request_items_purpose_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_doctor_visit_daily_rollup_lookup"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_visit_daily_rollups"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_visit_rollup_checkpoint"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisation_daily_rollup_lookup"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_daily_rollups"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_rollup_checkpoint"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_rollup_seen_patients"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_rollup_seen_vaccines"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_immunisation_daily_rollup_lookup"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_immunisation_daily_rollups"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_vaccine_status_patient"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_vaccine_status_updated_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_vaccine_status_patient_updated"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_vaccine_status_snapshots"
        `);
        await queryRunner.query(`
            DROP TABLE "leave"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."leave_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_medicine_stocks"
        `);
        await queryRunner.query(`
            DROP TABLE "medicine_requests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."medicine_requests_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "medicine_request_items"
        `);
        await queryRunner.query(`
            DROP TABLE "user_notifications"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TABLE "notification_recipients"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_daily_rollup_lookup"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_daily_rollups"
        `);
        await queryRunner.query(`
            DROP TABLE "referrals"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_level_of_care_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_childcomplications_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_mothercomplications_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_whichchildrequiredreferral_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referrals_type_of_service_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_unassigned_patients_patient_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_unassigned_patients_facility_id"
        `);
        await queryRunner.query(`
            DROP TABLE "unassigned_patients"
        `);
        await queryRunner.query(`
            DROP TABLE "role_permissions"
        `);
        await queryRunner.query(`
            DROP TABLE "telehealth_sessions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."telehealth_sessions_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."telehealth_sessions_provider_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "telehealth_requests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."telehealth_requests_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "telehealth_consultation_notes"
        `);
        await queryRunner.query(`
            DROP TABLE "token_counters"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_vital_assessments_visit"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_vital_assessments_appt"
        `);
        await queryRunner.query(`
            DROP TABLE "vital_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."vital_assessments_family_planning_methods_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."vital_assessments_dehydration_level_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_appointments_visit"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_appointments_doctor_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_appointments_patient_id"
        `);
        await queryRunner.query(`
            DROP TABLE "appointments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."appointments_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."uq_patients_cnic_self"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."uq_patients_immunisation_number"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."uq_patients_mobile_hash"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patients_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patients_uc_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_46095e49eae456e34bca592ab8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9d1297a7e4cea1d695fc050eec"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e85d7621a5f92d115a77fa2b5e"
        `);
        await queryRunner.query(`
            DROP TABLE "patients"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patients_phone_provider_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patients_gender_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patients_registration_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patients_nationality_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patients_cnic_provider_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisation_cards_patient_id"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_cards"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."immunisation_cards_level_of_care_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."immunisation_cards_place_of_delivery_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_pi_status"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_pi_next_due_date"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_immunisations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patient_immunisations_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_social_det"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_social_determinants"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patient_social_determinants_years_of_education_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_additional_info"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_additional_infos"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patient_additional_infos_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patient_additional_infos_marital_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "follow_ups"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_users_role_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_users_facility_id"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "appointment_doctors"
        `);
        await queryRunner.query(`
            DROP TABLE "medical_histories"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_queues_patient_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_queues_appointment_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_patient_queues_doctor_id"
        `);
        await queryRunner.query(`
            DROP TABLE "patient_queues"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."patient_queues_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "user_personal_infos"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_personal_infos_marital_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_personal_infos_blood_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_personal_infos_gender_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."facility_code_index"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."facility_name_index"
        `);
        await queryRunner.query(`
            DROP TABLE "facilities"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."facilities_level_of_care_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "delivery_patients"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_appt_services_composite"
        `);
        await queryRunner.query(`
            DROP TABLE "appointment_services"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."appointment_services_delivery_progress_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."appointment_services_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "other_prescriptions"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."other_prescriptions_category_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "opd_vital_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_vital_assessments_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "opd_diagnosis"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_diagnosis_patientfinaldiagnosis_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "opd_medical_histories"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_medical_histories_obstetric_complication_details_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_medical_histories_allergy_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_medical_histories_associated_conditions_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."opd_medical_histories_presenting_complaints_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "nutrition_vital_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."nutrition_vital_assessments_edema_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "nutrition_service_info"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."nutrition_service_info_reason_for_admission_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."nutrition_service_info_patient_coming_from_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "referral_details"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_typeofreferral_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_typeofservice_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_levelofcare_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_childcomplications_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_mothercomplications_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."referral_details_whorequiresreferral_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "discharge_details"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."discharge_details_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."discharge_details_dischargechecklist_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "post_delivery_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_causeofdeath_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_complications_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_immediatesteps_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_symptomsassessment_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_mothercondition_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_reasonforcsection_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."post_delivery_assessments_typeofdelivery_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "pre_delivery_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_symptomsassessment_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_amnioticfluidcolor_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_hourssincerupture_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_high_risk_signs_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pre_delivery_assessments_trimester_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "pnc_vital_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pnc_vital_assessments_warning_signs_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pnc_vital_assessments_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "anc_vital_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_vital_assessments_warning_signs_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_vital_assessments_albumin_urine_dipstick_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_vital_assessments_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "pnc_postpartum_nutritions"
        `);
        await queryRunner.query(`
            DROP TABLE "pnc_family_plannings"
        `);
        await queryRunner.query(`
            DROP TABLE "pnc_breastfeedings"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."pnc_breastfeedings_breastfeeding_issues_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisations_patient_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisations_appointment_service_id"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisations"
        `);
        await queryRunner.query(`
            DROP TABLE "newborn_assessments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."newborn_assessments_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."newborn_assessments_causeofdeath_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."newborn_assessments_symptomsassessment_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."newborn_assessments_condition_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."newborn_assessments_sex_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisation_doses_vaccinated_by"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisation_doses_immunisation_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_immunisation_doses_patient_id"
        `);
        await queryRunner.query(`
            DROP TABLE "immunisation_doses"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."immunisation_doses_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_054d432c65b71b1e87436e310b"
        `);
        await queryRunner.query(`
            DROP TABLE "vaccines"
        `);
        await queryRunner.query(`
            DROP TABLE "ctgs"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ctgs_ctg_reporting_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "ultrasounds"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ultrasounds_placenta_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ultrasounds_attitude_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ultrasounds_fetal_presentation_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ultrasounds_fetal_movement_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."ultrasounds_type_of_pregnancy_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "prescriptions"
        `);
        await queryRunner.query(`
            DROP TABLE "medicine_variants"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."medicine_variants_unit_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "medicine_count"
        `);
        await queryRunner.query(`
            DROP TABLE "medicines"
        `);
        await queryRunner.query(`
            DROP TABLE "medicine_batches"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."medicine_batches_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "dispense_items"
        `);
        await queryRunner.query(`
            DROP TABLE "dispensers"
        `);
        await queryRunner.query(`
            DROP TABLE "emergency_patients"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_patients_service_required_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_patients_blood_group_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_patients_sex_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_patients_nationality_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_patients_identity_provider_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "emergency_outcomes"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_outcomes_type_of_service_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_outcomes_level_of_care_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emergency_outcomes_outcome_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "emergency_vitals"
        `);
        await queryRunner.query(`
            DROP TABLE "visits"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."visits_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "diagnosis"
        `);
        await queryRunner.query(`
            DROP TABLE "anc_medical_surgical_histories"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_medical_surgical_histories_allergy_details_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_past_obstetric_complication_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_medical_surgical_histories_previous_illness_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "anc_pregnancy_infos"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_pregnancy_infos_trimester_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."anc_pregnancy_infos_reason_for_edit_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "previous_pregnancies"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."previous_pregnancies_complication_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."previous_pregnancies_mode_of_delivery_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."previous_pregnancies_outcome_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."previous_pregnancies_place_of_delivery_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "family_plannings"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_removal_reason_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_insertion_period_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_client_category_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_service_category_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_previous_fp_methods_used_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_total_pregnancy_since_last_period_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."family_plannings_client_type_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "services"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_37ea84a080a4b47133471852d5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_74bbbb213ecc45e9444e3145b2"
        `);
        await queryRunner.query(`
            DROP TABLE "user_services"
        `);
        await queryRunner.query(`
            DROP TABLE "districts"
        `);
        await queryRunner.query(`
            DROP TABLE "talukas"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."uc_name_index"
        `);
        await queryRunner.query(`
            DROP TABLE "ucs"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9f6740ab8384ad72ec1da19a66"
        `);
        await queryRunner.query(`
            DROP TABLE "divisions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5c78199072262966fb68b71809"
        `);
        await queryRunner.query(`
            DROP TABLE "provinces"
        `);
        await queryRunner.query(`
            DROP TABLE "roles"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."roles_name_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_permissions_role_id"
        `);
        await queryRunner.query(`
            DROP TABLE "permissions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_permissions_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_permissions_permission_id"
        `);
        await queryRunner.query(`
            DROP TABLE "user_permissions"
        `);
    }

}
