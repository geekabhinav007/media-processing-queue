import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { ListJobsQueryDto, ListJobsResponseDto } from './dto/list-jobs.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a job.' })
  @ApiCreatedResponse({ description: 'Job created successfully.', type: JobResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed for request body.' })
  async createJob(@Body() dto: CreateJobDto): Promise<JobResponseDto> {
    const job = await this.jobsService.createJob(dto);
    return JobResponseDto.fromEntity(job);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a job by its ID.' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID).' })
  @ApiOkResponse({ description: 'Job retrieved successfully.', type: JobResponseDto })
  @ApiNotFoundResponse({ description: 'Job not found.' })
  async getJob(@Param('id', new ParseUUIDPipe()) id: string): Promise<JobResponseDto> {
    const job = await this.jobsService.getJobById(id);
    return JobResponseDto.fromEntity(job);
  }

  @Get()
  @ApiOperation({ summary: 'List jobs with pagination and optional filters.' })
  @ApiOkResponse({ description: 'Jobs retrieved with pagination metadata.', type: ListJobsResponseDto })
  @ApiBadRequestResponse({ description: 'Query parameters failed validation.' })
  async listJobs(@Query() query: ListJobsQueryDto): Promise<ListJobsResponseDto> {
    const result = await this.jobsService.listJobs(query);
    return ListJobsResponseDto.fromEntities(result.data, result.total, result.page, result.limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a pending job.' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID).' })
  @ApiNoContentResponse({ description: 'Job cancelled successfully.' })
  @ApiNotFoundResponse({ description: 'Job not found.' })
  @ApiConflictResponse({ description: 'Job cannot be cancelled in its current state.' })
  @HttpCode(204)
  async cancelJob(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.jobsService.cancelJob(id);
  }
}
