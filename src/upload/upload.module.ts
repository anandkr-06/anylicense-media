import { Module, BadRequestException } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { VirusScanService } from './virus-scan.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';


@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
              return cb(
                new BadRequestException('Authorization header missing'),
                undefined as any,
              );
            }

            const parts = authHeader.split(' ');
            if (parts.length !== 2) {
              return cb(
                new BadRequestException('Invalid auth header'),
                undefined as any,
              );
            }

            const token = parts[1];

            let decoded: any;
            const secret = process.env.JWT_SECRET;

            if (!secret) {
              throw new Error('JWT_SECRET is not defined in environment variables');
            }

            try {
              decoded = jwt.verify(token, secret);
            } catch {
              return cb(
                new BadRequestException('Invalid or expired token'),
                undefined as any,
              );
            }

            const userId = decoded.userId;

// 🔒 sanitize userId
const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');

            const fileFor = req.body.fileFor;

            if (!userId || !fileFor) {
              return cb(
                new BadRequestException('Invalid upload context'),
                undefined as any,
              );
            }

            const safeFileFor = fileFor.replace(/[^a-zA-Z0-9_-]/g, '');
            // const uploadPath = join('./uploads', userId, safeFileFor);
            const uploadPath = join('./uploads', safeUserId, safeFileFor);

            fs.mkdirSync(uploadPath, { recursive: true });

            cb(null, uploadPath); // ✅ success
          } catch (err) {
            cb(
              new BadRequestException('Failed to create upload path'),
              undefined as any,
            );
          }
        },

        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}${extname(file.originalname)}`;

          cb(null, uniqueName);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },

      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Invalid file type. Allowed: JPG, PNG, PDF, DOC, DOCX',
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  ],

  controllers: [UploadController],
  providers: [VirusScanService],
  exports: [VirusScanService],
})
export class UploadModule { }