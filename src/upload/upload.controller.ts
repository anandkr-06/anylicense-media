import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  
  @Controller('upload')
  export class UploadController {
  
    @Post('file')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(
      @UploadedFile() file: Express.Multer.File,
      @Body('fileFor') fileFor: string,
    ) {
      return {
        message: 'File uploaded successfully',
        fileFor,
        filename: file.filename,
        path: file.path,
      };
    }
  }
  