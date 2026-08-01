import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3200',
    'http://localhost:3100',
    'https://dev.anylicence.com',
    'https://devadmin.anylicence.com',
    'https://anylicence.com.au',
    'https://www.anylicence.com.au',
    'https://webadmin.anylicence.com.au'
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.useStaticAssets(
    join(__dirname, '..', 'uploads'),
    {
      prefix: '/media/',
      // Add this block to fix CORS for static files
      setHeaders: (res, path, stat) => {
        const origin = res.req.headers.origin;
        if (allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
      }
    },
  );

  await app.listen(3100);
}
bootstrap();
