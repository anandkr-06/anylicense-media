import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {

  // SINGLE FILE
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileFor') fileFor: string,
    @Req() req: any,
  ) {
    if (!file) {
      return {
        status: 'error',
        message: 'File upload failed (size too large or invalid type)',
      };
    }
    const userId = req.headers['authorization']
      ? undefined 
      : 'Unknown';

    // But since Multer already verified JWT, userId can also come from decoded token
    return {
      message: 'File uploaded successfully',
      fileFor,
      userId,
      filename: file.filename,
      path: file.path,
    };
  }

  // MULTIPLE FILES
  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('fileFor') fileFor: string,
    @Req() req: any,
  ) {
    const userId = req.headers['authorization']
      ? undefined 
      : 'Unknown';
    return {
      message: 'Multiple files uploaded',
      fileFor,
      userId,
      count: files.length,
      files: files.map(file => ({
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      })),
    };
  }
}
