import { JobFileType } from '../jobs/job-file-type.enum';

export interface ProcessJobPayload {
  jobId: string;
  fileName: string;
  fileSize: number;
  fileType: JobFileType;
  callbackUrl: string | null;
}
