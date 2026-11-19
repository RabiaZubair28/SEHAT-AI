import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder/seeder.service';
import { SeederModule } from './seeder/seeder.module';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);

  const seeder = appContext.get(SeederService);
  await seeder.seed();

  await appContext.close();
}

bootstrap();
