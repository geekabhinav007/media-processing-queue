import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../job-status.enum';
import { JobFileType } from '../job-file-type.enum';
import { JobResultEntity } from './job-result.entity';

@Entity({ name: 'jobs' })
@Index(['status', 'fileType', 'createdAt'])
@Index(['createdAt'])
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({
    name: 'file_size',
    type: 'bigint',
    transformer: {
      to: (value?: number | null) => (typeof value === 'number' ? value.toString() : value ?? null),
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  fileSize!: number;

  @Column({ name: 'file_type', type: 'varchar', length: 16 })
  fileType!: JobFileType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ type: 'smallint', default: 0 })
  progress!: number;

  @Column({ type: 'smallint', default: 0 })
  priority!: number;

  @Column({ name: 'callback_url', type: 'text', nullable: true })
  callbackUrl: string | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => JobResultEntity, (result) => result.job)
  result?: JobResultEntity;
}
