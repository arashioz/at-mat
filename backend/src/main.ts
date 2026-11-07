import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('At-Mat API')
    .setDescription('API مدیریت پخش: ادمین، مدیر فروش، بازاریاب، راننده و عامل پخش')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3010;
  const host = process.env.HOST ?? '127.0.0.1';
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}/api`);
  console.log(`Swagger docs: http://${host}:${port}/docs`);
}

bootstrap();
