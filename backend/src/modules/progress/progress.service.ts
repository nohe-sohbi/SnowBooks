import { Injectable } from '@nestjs/common';
import { ProgressGateway } from './progress.gateway';
import { JobProgress } from '@/common/interfaces/job.interface';

@Injectable()
export class ProgressService {
  constructor(private progressGateway: ProgressGateway) {}

  sendProgress(jobId: string, progress: JobProgress) {
    this.progressGateway.sendProgressUpdate(jobId, progress);
  }

  sendCompletion(jobId: string, result: any) {
    this.progressGateway.sendJobCompletion(jobId, result);
  }

  sendError(jobId: string, error: string) {
    this.progressGateway.sendJobError(jobId, error);
  }

  getSubscriptionStats() {
    return this.progressGateway.getSubscriptionStats();
  }
}
