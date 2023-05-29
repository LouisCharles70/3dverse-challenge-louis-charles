import { Injectable } from '@nestjs/common';
import { FileSystemService } from '@app/file-system';
import * as fs from 'fs';
import * as _ from 'lodash';
import { Vector3 } from './app.types';

@Injectable()
export class AppService {
  constructor(private readonly fileSystemService: FileSystemService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async uploadFile(file: Express.Multer.File) {
    const fileName = await this.fileSystemService.uploadFile(file);

    return this.getFile(fileName);
  }

  async listFiles() {
    return this.fileSystemService.listFiles();
  }

  async getFile(fileName: string) {
    return this.fileSystemService.getFile(fileName);
  }

  async transformFile(
    fileName: string,
    scale: Vector3,
    offset: Vector3,
  ): Promise<Buffer> {
    if (!scale) {
      scale = { x: 1, y: 1, z: 1 };
    }

    if (!offset) {
      offset = { x: 0, y: 0, z: 0 };
    }

    const filePath = './temp/' + fileName;
    await this.fileSystemService.downloadFile(fileName, filePath);

    const transformationRequired =
      !_.isEqual(scale, { x: 1, y: 1, z: 1 }) ||
      !_.isEqual(offset, { x: 0, y: 0, z: 0 });
    if (!transformationRequired) {
      return fs.promises.readFile(filePath);
    }

    return await this.fileSystemService.transformFile(
      filePath,
      this.computeVertex,
      scale,
      offset,
    );
  }

  computeVertex(line: string, scale: Vector3, offset: Vector3) {
    const parts = line.trim().split(/\s+/);
    const lineIsAVertex = parts[0] === 'v';

    if (lineIsAVertex) {
      const vertex: Vector3 = {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3]),
      };

      const transformedVertex = [
        vertex.x * scale.x + offset.x,
        vertex.y * scale.y + offset.y,
        vertex.z * scale.z + offset.z,
      ];

      return 'v ' + transformedVertex.join(' ');
    }

    return line;
  }

  async renameFile(oldFileName: string, newFileName: string) {
    return this.fileSystemService.renameFile(oldFileName, newFileName);
  }

  async deleteFile(fileName: string) {
    return this.fileSystemService.deleteFile(fileName);
  }
}
