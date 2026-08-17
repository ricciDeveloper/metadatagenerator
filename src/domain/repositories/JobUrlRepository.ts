import { JobUrlEntity } from '../entities/JobUrlEntity.ts';

export interface JobUrlRepository {
  saveBatch(urls: JobUrlEntity[]): Promise<void>;
  update(urlEntity: JobUrlEntity): Promise<void>;
  findByJobId(jobId: string): Promise<JobUrlEntity[]>;
  findPendingByJobId(jobId: string, limit: number): Promise<JobUrlEntity[]>;
}
