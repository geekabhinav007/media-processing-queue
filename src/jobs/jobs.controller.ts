import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { ListJobsQueryDto, ListJobsResponseDto } from './dto/list-jobs.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  // Create a new job
  async createJob(@Body() dto: CreateJobDto): Promise<JobResponseDto> {
    const job = await this.jobsService.createJob(dto);
    return JobResponseDto.fromEntity(job);
  }

  @Get(':id')
  // Get job by ID
  async getJob(@Param('id', new ParseUUIDPipe()) id: string): Promise<JobResponseDto> {
    const job = await this.jobsService.getJobById(id);
    return JobResponseDto.fromEntity(job);
  }

  @Get()
  // List jobs with pagination and filtering
  async listJobs(@Query() query: ListJobsQueryDto): Promise<ListJobsResponseDto> {
    const result = await this.jobsService.listJobs(query);
    return ListJobsResponseDto.fromEntities(result.data, result.total, result.page, result.limit);
  }

  @Delete(':id')
  // Cancel a job by ID
  @HttpCode(204)
  async cancelJob(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.jobsService.cancelJob(id);
  }
}
