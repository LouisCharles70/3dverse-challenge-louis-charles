import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bucket, Storage, File } from '@google-cloud/storage';
import { ObjFile } from '../../../src/app.types';

@Injectable()
export class FileSystemService {
  private bucket: Bucket;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const storage = new Storage();

    this.bucketName = this.configService.get<string>('gcs.bucket');
    this.bucket = storage.bucket(this.bucketName);
  }

  async listFiles(): Promise<ObjFile[]> {
    const [files] = await this.bucket.getFiles();

    return files.map((file: File) => this.mapFileToObjFile(file));
  }

  mapFileToObjFile(file: File): ObjFile {
    return {
      id: file.metadata.name,
      name: file.metadata.name,
      size: file.metadata.size,
      creation_date: file.metadata.timeCreated,
      url: file.metadata.mediaLink,
    };
  }

  async getFile(fileName) {
    return this.bucket.file(fileName);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const blobName = this.getBlobName(file.originalname);
      const blob = this.bucket.file(blobName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      blobStream.on('error', (err) => {
        reject(err.message);
      });

      blobStream.on('finish', () => {
        resolve(blobName);
      });

      blobStream.end(file.buffer);
    });
  }

  async downloadFile(fileName: string, destination = fileName) {
    return this.bucket.file(fileName).download({
      destination,
    });
  }

  async renameFile(oldFileName: string, newFileName: string): Promise<string> {
    const [file] = await this.bucket
      .file(oldFileName)
      .rename(this.getBlobName(newFileName));

    return file.name;
  }

  async deleteFile(fileName: string) {
    await this.bucket.file(fileName).delete();

    return `${fileName} successfully deleted!`;
  }

  getBlobName(fileName: string) {
    const timestampRegex = /^\d{13}-/;

    if (timestampRegex.test(fileName)) {
      fileName = fileName.replace(timestampRegex, '');
    }

    return `${Date.now()}-${fileName}`;
  }
}
