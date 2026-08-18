import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — cho phép Frontend Next.js kết nối
  app.enableCors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL || '*'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true,
  });

  // Validation toàn cục
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger UI — http://localhost:3001/api/docs
  const config = new DocumentBuilder()
    .setTitle('🏠 Smart Dormitory API')
    .setDescription('API hệ thống quản lý Ký Túc Xá Thông Minh')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 Smart Dormitory Backend running on http://localhost:${port}`);
  console.log(`📖 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket ready for Frontend connections\n`);
}
bootstrap();
