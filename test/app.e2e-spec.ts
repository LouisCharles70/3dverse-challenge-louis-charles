import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { faker } from '@faker-js/faker';
import { ObjFile } from '../src/app.types';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  let gcsFiles: ObjFile[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const { body } = await request(app.getHttpServer())
      .get('/list-files')
      .expect(200);
    gcsFiles = body;
    if (!gcsFiles.length) {
      await request(app.getHttpServer())
        .post('/upload-file')
        .set('Content-Type', 'multipart/form-data')
        .attach('file', 'test/data/House.obj')
        .expect(201);

      throw new Error('No files in GCS');
    }
  });

  it('can upload a file', async () => {
    const { body: file } = await request(app.getHttpServer())
      .post('/upload-file')
      .set('Content-Type', 'multipart/form-data')
      .attach('file', 'test/data/House.obj')
      .expect(201);

    expect(file.name).toEqual(expect.any(String));
  });

  it('can list files', async () => {
    const response = await request(app.getHttpServer())
      .get('/list-files')
      .expect(200);

    const files = response.body;
    expect(files.length).toBeGreaterThan(0);
    files.forEach(({ id, name, size, creation_date }) => {
      expect(id).toEqual(expect.any(String));
      expect(name).toEqual(expect.any(String));
      expect(size).toEqual(expect.any(String));
      expect(new Date(creation_date).getTime()).toEqual(expect.any(Number));
    });
  });

  it('can get a file', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/get-file/' + gcsFiles[0].name)
      .expect(200);

    expect(body.name).toEqual(gcsFiles[0].name);
  });

  it('can transform a file', async () => {
    const fileName = gcsFiles[0].name;

    const scale = JSON.stringify({ x: 1, y: 100, z: 100 });
    const offset = JSON.stringify({ x: 100, y: 100, z: 100 });

    const url =
      '/transform-file/' + fileName + '?scale=' + scale + '&offset=' + offset;
    const { body } = await request(app.getHttpServer()).get(url);

    const lines = body.toString().split('\n');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('can rename a file', async () => {
    const fakeName = faker.company.name();

    const { text } = await request(app.getHttpServer())
      .patch('/rename-file/' + gcsFiles[0].name)
      .send({
        fileName: fakeName,
      })
      .expect(200);

    expect(text).toContain(fakeName);
  });

  it('can delete a file', async () => {
    const { text } = await request(app.getHttpServer())
      .delete('/delete-file/' + gcsFiles[0].name)
      .expect(200);

    expect(text).toEqual(`${gcsFiles[0].name} successfully deleted!`);
  });
});
