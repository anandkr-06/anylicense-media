import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
              return cb(new Error('Authorization header missing'), 'null');
            }

            const [, token] = authHeader.split(' ');
            if (!process.env.JWT_SECRET) {
              return cb(new Error('JWT secret is not defined'), 'null');
            }
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

            const userId = decoded.userId;
            const fileFor = req.body.fileFor;

            if (!userId || !fileFor) {
              return cb(new Error('Invalid upload context'), 'null');
            }

            const uploadPath = `./uploads/${userId}/${fileFor}`;
            fs.mkdirSync(uploadPath, { recursive: true });

            cb(null, uploadPath);
          } catch (err) {
            cb(new Error('Invalid or expired token'), 'null');
          }
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
      // 🔹 Limit max file size to 5 MB
      limits: {
        fileSize: 1 * 1024 * 1024, // 5MB
      },
      // 🔹 Optional: validate file type
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/msword', // DOC
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new Error(
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
})
export class UploadModule {}

