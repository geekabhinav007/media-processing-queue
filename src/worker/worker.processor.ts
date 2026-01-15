import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Worker, QueueEvents, Job } from 'bullmq';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/entities/job.entity';
import { JobResultEntity } from '../jobs/entities/job-result.entity';
import { REDIS_CONNECTION_TOKEN } from '../queue/queue.constants';
import { ProcessJobPayload } from '../queue/job.types';
import { JobStatus } from '../jobs/job-status.enum';
import Redis from 'ioredis';

@Injectable()
export class JobProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobProcessor.name);
  private worker: Worker<ProcessJobPayload> | null = null;
  private queueEvents: QueueEvents | null = null;

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobsRepository: Repository<JobEntity>,
    @InjectRepository(JobResultEntity)
    private readonly resultsRepository: Repository<JobResultEntity>,
    @Inject(REDIS_CONNECTION_TOKEN)
    private readonly redisConnection: Redis,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const queueName = this.configService.get<string>('BULL_QUEUE_NAME');
    if (!queueName) {
      throw new Error('BULL_QUEUE_NAME must be defined');
    }

    this.logger.log(`Starting worker for queue ${queueName}`);

    this.queueEvents = new QueueEvents(queueName, {
      connection: this.redisConnection.duplicate(),
    });

    this.worker = new Worker<ProcessJobPayload>(
      queueName,
      async (job) => this.handleJob(job),
      {
        connection: this.redisConnection.duplicate(),
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err?.message}`, err?.stack);
    });

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed.`);
    });

    this.queueEvents.on('waiting', ({ jobId }) => {
      this.logger.debug(`Job ${jobId} waiting to be processed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.warn(`Job ${jobId} failed: ${failedReason}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.worker?.close(),
      this.queueEvents?.close(),
    ]);
  }

  private async handleJob(job: Job<ProcessJobPayload>): Promise<void> {
    const { jobId } = job.data;

    const jobEntity = await this.jobsRepository.findOne({ where: { id: jobId } });
    if (!jobEntity) {
      this.logger.warn(`Job ${jobId} not found in database; marking queue job as failed.`);
      throw new Error('Job not found');
    }

    if (jobEntity.status === JobStatus.CANCELLED) {
      this.logger.warn(`Job ${jobId} already cancelled; skipping.`);
      return;
    }

    jobEntity.status = JobStatus.PROCESSING;
    jobEntity.lockedAt = new Date();
    jobEntity.progress = 5;
    await this.jobsRepository.save(jobEntity);

    await this.simulateProcessing(job, jobEntity);
  }

  private async simulateProcessing(job: Job<ProcessJobPayload>, jobEntity: JobEntity): Promise<void> {
    const stages = [25, 60, 100];

    for (const stage of stages) {
      await job.updateProgress(stage);
      jobEntity.progress = stage;
      await this.jobsRepository.save(jobEntity);
      await this.delay(1000);
    }

    jobEntity.status = JobStatus.COMPLETED;
    jobEntity.lockedAt = null;
    jobEntity.progress = 100;

    await this.jobsRepository.save(jobEntity);

    await this.resultsRepository.save(
      this.resultsRepository.create({
        jobId: jobEntity.id,
        processedAt: new Date(),
        outputFormat: 'hls',
        duration: 120,
        metadata: {
          note: 'Simulated worker output',
        },
      }),
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
