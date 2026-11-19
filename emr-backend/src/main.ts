import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ACCESS_TOKEN, ADMIN_ACCESS_TOKEN } from './common/app.constants';
import { getAllowedOrigins } from './common/utils/cors.util';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  app.use(cookieParser());

  app.useLogger(app.get(Logger));

  if (!(process.env.SWAGGER_ALLOWED_HOSTS ?? '').includes(process.env.APP_HOST ?? '')) {
    app.use(helmet());
  }
  app.setGlobalPrefix('api');

  // CORS Configuration
  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addCookieAuth(ACCESS_TOKEN)
    .addCookieAuth(ADMIN_ACCESS_TOKEN)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger/docs', app, document, {
    swaggerOptions: {
      withCredentials: true,
      syntaxHighlight: {
        activated: false,
      },
    },
  });

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
