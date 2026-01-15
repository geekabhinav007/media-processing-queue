import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs.dto';
import { JobStatus } from './job-status.enum';
import { Queue } from 'bullmq';
import { JOB_QUEUE_TOKEN } from '../queue/queue.constants';
import { ProcessJobPayload } from '../queue/job.types';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @Inject(JOB_QUEUE_TOKEN)
    private readonly jobQueue: Queue<ProcessJobPayload>,
  ) {}

  // Create a new job
  async createJob(dto: CreateJobDto): Promise<JobEntity> {
    const job = this.jobRepository.create({
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      fileType: dto.fileType,
      callbackUrl: dto.callbackUrl ?? null,
      status: JobStatus.PENDING,
      progress: 0,
    });

    // Save job to DB
    const savedJob = await this.jobRepository.save(job);

    const payload: ProcessJobPayload = {
      jobId: savedJob.id,
      fileName: savedJob.fileName,
      fileSize: savedJob.fileSize,
      fileType: savedJob.fileType,
      callbackUrl: savedJob.callbackUrl,
    };

    // Add job to the processing queue

    await this.jobQueue.add(
      'process-job',
      payload,
      { jobId: savedJob.id },
    );
    
    // Return the saved job entity
    return savedJob;
  }

  // Get a job by ID
  async getJobById(id: string): Promise<JobEntity> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['result'],
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return job;
  }

  // List Jobs

  async listJobs(query: ListJobsQueryDto): Promise<{ data: JobEntity[]; total: number; page: number; limit: number }> {
   
    // pagination logic
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.result', 'result')
      .orderBy('job.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

      // filtering logic for status and fileType

    if (query.status) {
      qb.andWhere('job.status = :status', { status: query.status });
    }

    if (query.fileType) {
      qb.andWhere('job.fileType = :fileType', { fileType: query.fileType });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

    // Cancel the job
  async cancelJob(id: string): Promise<JobEntity> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (![JobStatus.PENDING, JobStatus.PROCESSING].includes(job.status)) {
      throw new ConflictException('Only pending or processing jobs can be cancelled');
    }

    job.status = JobStatus.CANCELLED;
    job.progress = job.progress ?? 0;
    job.lockedAt = null;

    await this.jobQueue.remove(job.id).catch(() => undefined);

    return this.jobRepository.save(job);
  }
}
