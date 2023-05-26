import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseArrayPipe,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { DownloadResponse } from '@google-cloud/storage';
import { ObjFile } from './app.types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-file')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 1000 * 1000 }),
          new FileTypeValidator({ fileType: 'obj' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.appService.uploadFile(file);
  }

  @Get('list-files')
  listFiles(): Promise<ObjFile[]> {
    return this.appService.listFiles();
  }

  @Get('get-file/:fileName')
  getFile(@Param('fileName') fileName: string) {
    return this.appService.getFile(fileName);
  }

  @Get('transform-file/:fileName')
  async transformFile(
    @Param('fileName') fileName: string,
    @Query('scale') scale?: string,
    @Query('offset') offset?: string,
  ): Promise<StreamableFile> {
    const file = await this.appService.transformFile(
      fileName,
      scale && JSON.parse(scale),
      offset && JSON.parse(offset),
    );

    return new StreamableFile(file);
  }

  @Patch('rename-file/:oldFileName')
  renameFile(
    @Param('oldFileName') oldFileName: string,
    @Body() body: { fileName: string },
  ): Promise<string> {
    if (!body?.fileName) {
      throw new BadRequestException('A file ame is required...');
    }

    return this.appService.renameFile(oldFileName, body.fileName);
  }

  @Delete('delete-file/:fileName')
  deleteFile(@Param('fileName') fileName: string) {
    return this.appService.deleteFile(fileName);
  }
}
