import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/entities/job.entity';
import { JobResultEntity } from '../jobs/entities/job-result.entity';

export const createTypeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => {
  const url = config.get<string>('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL must be defined');
  }

  return {
    type: 'postgres',
    url,
    entities: [JobEntity, JobResultEntity],
    autoLoadEntities: true,
    synchronize: config.get('DB_SYNCHRONIZE') === 'true',
    logging: config.get('DB_LOGGING') === 'true',
  };
};
