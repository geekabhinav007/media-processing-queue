import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { JOB_QUEUE_TOKEN, REDIS_CONNECTION_TOKEN } from './queue.constants';

const redisProvider: Provider = {
  provide: REDIS_CONNECTION_TOKEN,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const url = configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error('REDIS_URL must be defined');
    }

    const redis = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    return redis;
  },
};

const queueProvider: Provider = {
  provide: JOB_QUEUE_TOKEN,
  inject: [ConfigService, REDIS_CONNECTION_TOKEN],
  useFactory: (configService: ConfigService, connection: Redis) => {
    const queueName = configService.get<string>('BULL_QUEUE_NAME');
    if (!queueName) {
      throw new Error('BULL_QUEUE_NAME must be defined');
    }

    return new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [redisProvider, queueProvider],
  exports: [redisProvider, queueProvider],
})
export class QueueModule {}
