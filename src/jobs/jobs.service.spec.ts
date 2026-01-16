import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobsService } from './jobs.service';
import { JobEntity } from './entities/job.entity';
import { JobStatus } from './job-status.enum';
import { Queue } from 'bullmq';
import { JOB_QUEUE_TOKEN } from '../queue/queue.constants';
import { CreateJobDto } from './dto/create-job.dto';
import { JobFileType } from './job-file-type.enum';
import { ProcessJobPayload } from '../queue/job.types';

const mockJobRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueue = () => ({
  add: jest.fn(),
  remove: jest.fn(),
});

// Tests for JobsService
describe('JobsService', () => {
  let service: JobsService;
  let repository: jest.Mocked<Repository<JobEntity>>;
  let queue: jest.Mocked<Queue<ProcessJobPayload>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(JobEntity),
          useFactory: mockJobRepository,
        },
        {
          provide: JOB_QUEUE_TOKEN,
          useFactory: mockQueue,
        },
      ],
    }).compile();

    service = module.get(JobsService);
    repository = module.get(getRepositoryToken(JobEntity));
    queue = module.get(JOB_QUEUE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    // Tests for createJob method
    it('persists the job with PENDING status and enqueues a process job', async () => {
      const dto: CreateJobDto = {
        fileName: 'video.mp4',
        fileSize: 1024,
        fileType: JobFileType.VIDEO,
      };

      const createdJob = { ...dto } as JobEntity;
      const savedJob = {
        ...createdJob,
        id: 'uuid-123',
        status: JobStatus.PENDING,
        progress: 0,
        callbackUrl: null,
      } as JobEntity;

      repository.create.mockReturnValue(createdJob);
      repository.save.mockResolvedValue(savedJob);

      const result = await service.createJob(dto);

      expect(repository.create).toHaveBeenCalledWith({
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        fileType: dto.fileType,
        callbackUrl: null,
        status: JobStatus.PENDING,
        progress: 0,
      });

      expect(repository.save).toHaveBeenCalledWith(createdJob);
      expect(queue.add).toHaveBeenCalledWith(
        'process-job',
        {
          jobId: savedJob.id,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          fileType: dto.fileType,
          callbackUrl: null,
        },
        { jobId: savedJob.id },
      );

      expect(result).toEqual(savedJob);
    });
  });

  describe('cancelJob', () => {
    // Tests for cancelJob method
    it('throws when job not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.cancelJob('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(queue.remove).not.toHaveBeenCalled();
    });

    it('throws conflict when job already completed', async () => {
      const job = { id: 'job', status: JobStatus.COMPLETED } as JobEntity;
      repository.findOne.mockResolvedValue(job);

      await expect(service.cancelJob('job')).rejects.toBeInstanceOf(ConflictException);
      expect(queue.remove).not.toHaveBeenCalled();
    });

    it('marks job as cancelled and removes queued job', async () => {
      const job = {
        id: 'job-1',
        status: JobStatus.PENDING,
        progress: 0,
        lockedAt: null,
      } as JobEntity;
      repository.findOne.mockResolvedValue(job);
      repository.save.mockResolvedValue({ ...job, status: JobStatus.CANCELLED });

      queue.remove.mockResolvedValue(1);

      const result = await service.cancelJob('job-1');

      expect(queue.remove).toHaveBeenCalledWith('job-1');
      expect(repository.save).toHaveBeenCalledWith({
        ...job,
        status: JobStatus.CANCELLED,
        progress: 0,
        lockedAt: null,
      });
      expect(result.status).toBe(JobStatus.CANCELLED);
    });
  });

  describe('listJobs', () => {
    it('applies pagination defaults and filters', async () => {
      const getManyAndCount = jest.fn().mockResolvedValue([[{ id: 'job' } as JobEntity], 1]);
      const addStatusWhere = jest.fn().mockReturnThis();
      const addFileTypeWhere = jest.fn().mockReturnThis();

      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn(function (this: any) {
          return this;
        }),
        getManyAndCount,
      };

      repository.createQueryBuilder.mockReturnValue(qb);

      const query = { status: JobStatus.PENDING, fileType: JobFileType.VIDEO, page: 2, limit: 5 };
      const result = await service.listJobs(query);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('job');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('job.result', 'result');
      expect(qb.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.andWhere).toHaveBeenCalledWith('job.status = :status', { status: JobStatus.PENDING });
      expect(qb.andWhere).toHaveBeenCalledWith('job.fileType = :fileType', { fileType: JobFileType.VIDEO });
      expect(getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({ data: [{ id: 'job' }], total: 1, page: 2, limit: 5 });
    });
  });
});
