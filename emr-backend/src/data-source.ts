import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { isAppEnvironmentLocal } from './common/app.constants';

dotenv.config();

function getPositiveNumberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function createDataSource(isSeeder = false) {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '**/*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations/*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
    /**
     * Enabling logging: 'all' with maxQueryExecutionTime would log the same
     * query twice (once as [QUERY], once as [SLOW QUERY]). Omitting the
     * 'query' level logs each slow query exactly once with its execution time.
     */
    logging: isAppEnvironmentLocal ? ['warn'] : false,
    logger: isAppEnvironmentLocal ? 'file' : undefined,
    maxQueryExecutionTime: isAppEnvironmentLocal ? 0.001 : undefined,
    extra: {
      max: getPositiveNumberEnv('DB_POOL_MAX', isSeeder ? 2 : 10),
      idleTimeoutMillis: getPositiveNumberEnv('DB_POOL_IDLE_TIMEOUT_MS', 30000),
      connectionTimeoutMillis: getPositiveNumberEnv(
        'DB_POOL_CONNECTION_TIMEOUT_MS',
        5000,
      ),
    },
  });
}

export const dataSource = createDataSource();
