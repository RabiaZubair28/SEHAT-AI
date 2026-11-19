import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private cacheDisabled = false;

  constructor(private readonly configService: ConfigService) {}

  async getOrSetJson<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cachedValue = await this.getJson<T>(key);

    if (cachedValue.hit) {
      return cachedValue.value;
    }

    const freshValue = await loader();
    await this.setJson(key, freshValue, ttlSeconds);
    return freshValue;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const client = await this.getReadyClient();

    if (!client) {
      return;
    }

    try {
      let cursor = '0';

      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          '100',
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.disableCache(
        `Failed to invalidate Redis keys for prefix "${prefix}": ${this.formatError(error)}`,
      );
    }
  }

  buildKey(prefix: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return prefix;
    }

    const serializedParams = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${this.normalizeValue(value)}`)
      .join('&');

    return `${prefix}:${serializedParams}`;
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  private async getJson<T>(
    key: string,
  ): Promise<{ hit: true; value: T } | { hit: false }> {
    const client = await this.getReadyClient();

    if (!client) {
      return { hit: false };
    }

    try {
      const value = await client.get(key);

      if (value === null) {
        return { hit: false };
      }

      return {
        hit: true,
        value: JSON.parse(value) as T,
      };
    } catch (error) {
      this.disableCache(
        `Failed to read key "${key}" from Redis: ${this.formatError(error)}`,
      );
      return { hit: false };
    }
  }

  private async setJson<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    const client = await this.getReadyClient();

    if (!client) {
      return;
    }

    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.disableCache(
        `Failed to write key "${key}" to Redis: ${this.formatError(error)}`,
      );
    }
  }

  private async getReadyClient(): Promise<Redis | null> {
    if (this.cacheDisabled || !this.isCacheEnabled()) {
      return null;
    }

    if (!this.client) {
      this.client = this.createClient();
    }

    if (this.client.status === 'ready') {
      return this.client;
    }

    if (this.client.status === 'connecting' || this.client.status === 'connect') {
      return this.client;
    }

    try {
      await this.client.connect();
      return this.client;
    } catch (error) {
      this.disableCache(
        `Failed to connect to Redis: ${this.formatError(error)}`,
      );
      return null;
    }
  }

  private createClient(): Redis {
    const baseOptions: RedisOptions = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      retryStrategy: () => null,
    };

    const redisUrl = this.configService.get<string>('REDIS_URL');

    const client = redisUrl
      ? new Redis(redisUrl, baseOptions)
      : new Redis({
          ...baseOptions,
          host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: Number(this.configService.get<string>('REDIS_PORT', '6379')),
          db: Number(this.configService.get<string>('REDIS_DB', '0')),
          password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        });

    client.on('error', (error) => {
      if (!this.cacheDisabled) {
        this.logger.warn(`Redis error: ${this.formatError(error)}`);
      }
    });

    return client;
  }

  private isCacheEnabled(): boolean {
    const rawValue = this.configService.get<string>('REDIS_ENABLED', 'true');
    return rawValue.toLowerCase() !== 'false';
  }

  private disableCache(reason: string): void {
    if (this.cacheDisabled) {
      return;
    }

    this.cacheDisabled = true;
    this.logger.warn(`${reason} Falling back to database reads.`);

    if (this.client) {
      this.client.disconnect();
    }
  }

  private normalizeValue(value: unknown): string {
    if (value === undefined || value === null || value === '') {
      return 'null';
    }

    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item)).join(',');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
