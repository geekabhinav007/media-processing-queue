import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobStatus } from './job-status.enum';
import { JobFileType } from './job-file-type.enum';

describe('JobsController (validation)', () => {
  let app: INestApplication;
  const jobsService = {
    createJob: jest.fn().mockImplementation(() => ({
      id: 'job-id',
      status: JobStatus.PENDING,
      fileName: 'video.mp4',
      fileSize: 1024,
      fileType: JobFileType.VIDEO,
      progress: 0,
      callbackUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      result: null,
    })),
  } as Partial<JobsService>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: jobsService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an unsupported fileType with HTTP 400', async () => {
    const payload = {
      fileName: 'bad.txt',
      fileSize: 1234,
      fileType: 'DOCUMENT',
    };

    const response = await request(app.getHttpServer()).post('/jobs').send(payload);

    expect(response.status).toBe(400);
    const messages = Array.isArray(response.body.message) ? response.body.message : [response.body.message];
    expect(messages.some((msg: string) => msg.includes('fileType must be one of the following values'))).toBe(true);
    expect(jobsService.createJob).not.toHaveBeenCalled();
  });
});
