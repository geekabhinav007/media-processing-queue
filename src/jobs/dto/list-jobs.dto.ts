import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JobStatus } from '../job-status.enum';
import { JobFileType } from '../job-file-type.enum';
import { JobEntity } from '../entities/job.entity';
import { JobResponseDto } from './job-response.dto';

export class ListJobsQueryDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsEnum(JobFileType)
  fileType?: JobFileType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginationMeta {
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;

  static create(total: number, page: number, limit: number): PaginationMeta {
    const meta = new PaginationMeta();
    meta.total = total;
    meta.page = page;
    meta.limit = limit;
    meta.totalPages = Math.max(1, Math.ceil(total / limit));
    return meta;
  }
}

export class ListJobsResponseDto {
  data!: JobResponseDto[];
  meta!: PaginationMeta;

  static fromEntities(entities: JobEntity[], total: number, page: number, limit: number): ListJobsResponseDto {
    const dto = new ListJobsResponseDto();
    dto.data = entities.map((entity) => JobResponseDto.fromEntity(entity));
    dto.meta = PaginationMeta.create(total, page, limit);
    return dto;
  }
}
