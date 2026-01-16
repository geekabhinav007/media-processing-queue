import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JobStatus } from '../job-status.enum';
import { JobFileType } from '../job-file-type.enum';
import { JobEntity } from '../entities/job.entity';
import { JobResponseDto } from './job-response.dto';

export class ListJobsQueryDto {
  @ApiPropertyOptional({ enum: JobStatus, description: 'Filter jobs by current status.' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ enum: JobFileType, description: 'Filter by file type.' })
  @IsOptional()
  @IsEnum(JobFileType)
  fileType?: JobFileType;

  @ApiPropertyOptional({ description: 'Page number (1-based).', minimum: 1, default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (max 100).', minimum: 1, maximum: 100, default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginationMeta {
  @ApiProperty({ description: 'Total number of records matching filters.', type: Number })
  total!: number;
  @ApiProperty({ description: 'Current page number.', type: Number })
  page!: number;
  @ApiProperty({ description: 'Items per page for this result.', type: Number })
  limit!: number;
  @ApiProperty({ description: 'Computed total pages for given limit.', type: Number })
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
  @ApiProperty({ type: () => [JobResponseDto] })
  data!: JobResponseDto[];
  @ApiProperty({ type: () => PaginationMeta })
  meta!: PaginationMeta;

  static fromEntities(entities: JobEntity[], total: number, page: number, limit: number): ListJobsResponseDto {
    const dto = new ListJobsResponseDto();
    dto.data = entities.map((entity) => JobResponseDto.fromEntity(entity));
    dto.meta = PaginationMeta.create(total, page, limit);
    return dto;
  }
}
