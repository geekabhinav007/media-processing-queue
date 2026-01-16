import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobEntity } from '../entities/job.entity';
import { JobResultEntity } from '../entities/job-result.entity';
import { JobStatus } from '../job-status.enum';
import { JobFileType } from '../job-file-type.enum';

export class JobResultResponseDto {
  @ApiPropertyOptional({ description: 'Timestamp when processing completed.', type: String, format: 'date-time', nullable: true })
  processedAt: string | null;
  @ApiPropertyOptional({ description: 'Output format produced by the worker.', nullable: true })
  outputFormat: string | null;
  @ApiPropertyOptional({ description: 'Duration of the processed media (in seconds).', nullable: true, type: Number })
  duration: number | null;
  @ApiPropertyOptional({ description: 'metadata produced by the worker.', nullable: true, type: Object })
  metadata: Record<string, unknown> | null;

  static fromEntity(entity: JobResultEntity | undefined): JobResultResponseDto | undefined {
    if (!entity) {
      return undefined;
    }

    const dto = new JobResultResponseDto();
    dto.processedAt = entity.processedAt ? entity.processedAt.toISOString() : null;
    dto.outputFormat = entity.outputFormat;
    dto.duration = entity.duration;
    dto.metadata = entity.metadata ?? null;
    return dto;
  }
}

export class JobResponseDto {
  @ApiProperty({ description: 'Job ID (UUID).' })
  id!: string;
  @ApiProperty({ description: 'Original file name.' })
  fileName!: string;
  @ApiProperty({ description: 'File size in bytes.', type: Number })
  fileSize!: number;
  @ApiProperty({ enum: JobFileType })
  fileType!: JobFileType;
  @ApiProperty({ enum: JobStatus })
  status!: JobStatus;
  @ApiProperty({ description: 'Worker progress percentage.', type: Number })
  progress!: number;
  @ApiPropertyOptional({ description: 'Webhook callback URL if supplied by client.', nullable: true })
  callbackUrl: string | null;
  @ApiProperty({ description: 'Creation timestamp.', type: String, format: 'date-time' })
  createdAt!: string;
  @ApiProperty({ description: 'Last update timestamp.', type: String, format: 'date-time' })
  updatedAt!: string;
  @ApiPropertyOptional({ type: () => JobResultResponseDto, nullable: true })
  result?: JobResultResponseDto;

  static fromEntity(entity: JobEntity): JobResponseDto {
    const dto = new JobResponseDto();
    dto.id = entity.id;
    dto.fileName = entity.fileName;
    dto.fileSize = entity.fileSize;
    dto.fileType = entity.fileType;
    dto.status = entity.status;
    dto.progress = entity.progress;
    dto.callbackUrl = entity.callbackUrl ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    dto.result = JobResultResponseDto.fromEntity(entity.result);
    return dto;
  }
}
