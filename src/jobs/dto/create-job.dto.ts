import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { JobFileType } from '../job-file-type.enum';

export class CreateJobDto {
  @ApiProperty({ description: 'Original file name to appear in job tracking.', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ description: 'File size in bytes (max 5GB).', minimum: 1, maximum: 5368709120, type: Number })
  @IsInt()
  @Min(1)
  @Max(5368709120)
  fileSize!: number;

  @ApiProperty({ enum: JobFileType, description: 'Type of media submitted for processing.' })
  @IsEnum(JobFileType)
  fileType!: JobFileType;

  @ApiPropertyOptional({ description: 'Webhook callback URL invoked once job completes or fails.'})
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackUrl?: string;
}
