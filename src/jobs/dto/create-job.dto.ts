import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { JobFileType } from '../job-file-type.enum';

export class CreateJobDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsInt()
  @Min(1)
  @Max(5368709120)
  fileSize!: number;

  @IsEnum(JobFileType)
  fileType!: JobFileType;

  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackUrl?: string;
}
