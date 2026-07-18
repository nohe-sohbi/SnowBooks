// Thrown when processing stops because the user cancelled the job.
// Distinct from real failures so the processor can mark the job CANCELLED
// (not FAILED) and skip Bull's automatic retries.
export class JobCancelledError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} was cancelled`);
    this.name = 'JobCancelledError';
  }
}
