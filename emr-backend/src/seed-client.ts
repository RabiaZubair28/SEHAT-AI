import { NestFactory } from '@nestjs/core';
import { ClientSeeder } from './seeder/client/client.seeder';
import { ClientSeederModule } from './seeder/client/client-seeder.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    ClientSeederModule,
  );

  const seeder = appContext.get(ClientSeeder);
  await seeder.seed();

  await appContext.close();
}

bootstrap();
