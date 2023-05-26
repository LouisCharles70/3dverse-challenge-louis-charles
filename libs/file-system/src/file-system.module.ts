import { Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [FileSystemService],
  exports: [FileSystemService],
})
export class FileSystemModule {}
