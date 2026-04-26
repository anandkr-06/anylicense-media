import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { VirusScanService } from './virus-scan.service';
import { safeUnlink } from 'src/utils/file.util';

@Controller('upload')
export class UploadController {
  constructor(private readonly virusScanService: VirusScanService) {}

  // ✅ SINGLE FILE UPLOAD
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileFor') fileFor: string,
  ) {
    if (!fileFor) {
      throw new BadRequestException('fileFor is required');
    }

    if (!file) {
      throw new BadRequestException('File upload failed');
    }
    
    try {
      //const isInfected = await this.virusScanService.scanFile(file.path);
      const isInfected = await Promise.race([
        this.virusScanService.scanFile(file.path),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 10000),
        ),
      ]);
      if (isInfected) {

        // await fs.promises.unlink(file.path);

        await safeUnlink(file.path);

        return {
          status: 'error',
          message: 'File contains virus and was removed',
        };
      }

      return {
        message: 'File uploaded successfully',
        fileFor,
        filename: file.filename,
        path: file.path,
        status: 'success',
      };
    } 
    catch (err) {
      if (file?.path) {
        await safeUnlink(file.path);
      }
    
      if (err instanceof Error && err.message === 'Scan timeout') {
        throw new BadRequestException('File scan timeout, try again');
      }
    
      throw new BadRequestException('Virus scan failed, upload rejected');
    }
  }

  // ✅ MULTIPLE FILE UPLOAD
  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files'),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fileFor') fileFor: string,
  ) {

    if (!fileFor) {
  throw new BadRequestException('fileFor is required');
}
    
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // const isInfected = await this.virusScanService.scanFile(file.path);
          const isInfected = await Promise.race([
            this.virusScanService.scanFile(file.path),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('Scan timeout')), 10000),
            ),
          ]);

          if (isInfected) {
            // await fs.promises.unlink(file.path);
            await safeUnlink(file.path);
            return null;
          }

          return {
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
          };
        } 
        catch (err) {
          if (file?.path) {
            await safeUnlink(file.path);
          }
        
          if (err instanceof Error && err.message === 'Scan timeout') {
            throw new BadRequestException('File scan timeout, try again');
          }
        
          throw new BadRequestException('Virus scan failed, upload rejected');
        }
      }
    ),
    );

    const cleanFiles = results.filter(Boolean);

    return {
      message: 'Files processed',
      fileFor,
      safeFiles: cleanFiles.length,
      totalFiles: files.length,
      files: cleanFiles,
      status: 'success',
    };
  }
  
}