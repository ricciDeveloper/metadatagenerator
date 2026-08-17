import { JobEntity } from '../entities/JobEntity.ts';

export interface JobRepository {
  save(job: JobEntity): Promise<void>;
  findById(id: string): Promise<JobEntity | null>;
  findByProjectId(projectId: string): Promise<JobEntity[]>;
  findAll(limit?: number): Promise<JobEntity[]>;
  updateProgress(jobId: string, processedUrls: number, successCount: number, failedCount: number, status: string): Promise<void>;
}
