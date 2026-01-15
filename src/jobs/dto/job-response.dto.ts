import { JobEntity } from '../entities/job.entity';
import { JobResultEntity } from '../entities/job-result.entity';
import { JobStatus } from '../job-status.enum';
import { JobFileType } from '../job-file-type.enum';

export class JobResultResponseDto {
  processedAt: string | null;
  outputFormat: string | null;
  duration: number | null;
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
  id!: string;
  fileName!: string;
  fileSize!: number;
  fileType!: JobFileType;
  status!: JobStatus;
  progress!: number;
  callbackUrl: string | null;
  createdAt!: string;
  updatedAt!: string;
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
