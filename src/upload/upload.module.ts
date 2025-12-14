import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
            console.log('BODY:', req.body);   // 👈 ADD THIS
            console.log('FILE:', file.originalname);
          
            const fileFor = req.body?.fileFor;
          
            const allowedFolders = ['profile', 'invoice', 'document'];
            if (!fileFor || !allowedFolders.includes(fileFor)) {
              return cb(new Error('Invalid fileFor'), '');
            }
          
            const uploadPath = `./uploads/${fileFor}`;
          
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
          
            cb(null, uploadPath);
          },
          
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
