import { MigrationInterface, QueryRunner } from 'typeorm';

export class NutritionAdvisorPreviewPermission1792700000000
  implements MigrationInterface
{
  name = 'NutritionAdvisorPreviewPermission1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "permissions" AS permission
      SET "payload" = COALESCE(permission."payload", '[]'::jsonb) ||
        '[{"name":"Preview Nutrition Advisor overview","route":"/nutrition-advisor/:appointment_service_id/overview","guards":["JwtUserAuthGuard"],"method":"POST","module":"Nutrition Advisor","description":"Preview patient findings and targets using proposed preferences."}]'::jsonb
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(permission."payload", '[]'::jsonb)) AS entries(item)
        WHERE item->>'route' = '/nutrition-advisor/:appointment_service_id/overview'
          AND item->>'method' = 'GET'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(permission."payload", '[]'::jsonb)) AS entries(item)
        WHERE item->>'route' = '/nutrition-advisor/:appointment_service_id/overview'
          AND item->>'method' = 'POST'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "permissions" AS permission
      SET "payload" = (
        SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM jsonb_array_elements(COALESCE(permission."payload", '[]'::jsonb)) AS entries(item)
        WHERE NOT (
          item->>'name' = 'Preview Nutrition Advisor overview'
          AND item->>'route' = '/nutrition-advisor/:appointment_service_id/overview'
          AND item->>'method' = 'POST'
        )
      )
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(permission."payload", '[]'::jsonb)) AS entries(item)
        WHERE item->>'name' = 'Preview Nutrition Advisor overview'
          AND item->>'route' = '/nutrition-advisor/:appointment_service_id/overview'
          AND item->>'method' = 'POST'
      )
    `);
  }
}
