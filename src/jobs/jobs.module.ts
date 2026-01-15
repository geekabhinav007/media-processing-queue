import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobEntity } from './entities/job.entity';
import { JobResultEntity } from './entities/job-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, JobResultEntity])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
