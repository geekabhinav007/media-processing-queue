import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule } from '../queue/queue.module';
import { JobEntity } from '../jobs/entities/job.entity';
import { JobResultEntity } from '../jobs/entities/job-result.entity';
import { createTypeOrmOptions } from '../config/typeorm.config';
import { JobProcessor } from './worker.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => createTypeOrmOptions(config),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([JobEntity, JobResultEntity]),
    QueueModule,
  ],
  providers: [JobProcessor],
})
export class WorkerModule {}
