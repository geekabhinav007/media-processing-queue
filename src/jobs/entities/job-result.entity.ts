import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { JobEntity } from './job.entity';

@Entity({ name: 'job_results' })
export class JobResultEntity {
  @PrimaryColumn({ name: 'job_id', type: 'uuid' })
  jobId!: string;

  @OneToOne(() => JobEntity, (job) => job.result, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: JobEntity;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'output_format', type: 'varchar', length: 32, nullable: true })
  outputFormat: string | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
