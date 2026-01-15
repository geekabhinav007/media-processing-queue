import 'dotenv/config';
import { DataSource } from 'typeorm';
import { JobEntity } from '../jobs/entities/job.entity';
import { JobResultEntity } from '../jobs/entities/job-result.entity';

const isTestEnv = false; //nodeEnv === 'test';
const migrationsPath = 'src/migrations/*.ts';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [JobEntity, JobResultEntity],
  migrations: [migrationsPath],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true' && !isTestEnv,
});

export default dataSource;
