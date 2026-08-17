import { JobLimitExceededError } from '../../shared/errors/DomainErrors.ts';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobProps {
  id?: string;
  projectId: string;
  urls: string[];
  status?: JobStatus;
  totalUrls?: number;
  processedUrls?: number;
  successCount?: number;
  failedCount?: number;
  createdAt?: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export class JobEntity {
  public readonly id: string;
  public readonly projectId: string;
  public readonly urls: string[];
  public status: JobStatus;
  public totalUrls: number;
  public processedUrls: number;
  public successCount: number;
  public failedCount: number;
  public createdAt: Date;
  public startedAt: Date | null;
  public completedAt: Date | null;

  constructor(props: JobProps) {
    this.id = props.id || crypto.randomUUID();
    this.projectId = props.projectId;
    this.urls = props.urls;
    this.status = props.status || 'PENDING';
    this.totalUrls = props.totalUrls !== undefined ? props.totalUrls : props.urls.length;
    this.processedUrls = props.processedUrls || 0;
    this.successCount = props.successCount || 0;
    this.failedCount = props.failedCount || 0;
    this.createdAt = props.createdAt || new Date();
    this.startedAt = props.startedAt || null;
    this.completedAt = props.completedAt || null;
  }

  static create(projectId: string, rawUrls: string[], maxUrls = 200): JobEntity {
    const normalizedUrls = Array.from(
      new Set(
        rawUrls
          .map(u => u.trim())
          .filter(u => u.length > 0)
      )
    );

    if (normalizedUrls.length > maxUrls) {
      throw new JobLimitExceededError(maxUrls);
    }

    return new JobEntity({
      projectId,
      urls: normalizedUrls,
      totalUrls: normalizedUrls.length
    });
  }

  recordResult(success: boolean): void {
    if (this.status === 'PENDING') {
      this.status = 'PROCESSING';
      this.startedAt = new Date();
    }

    this.processedUrls += 1;
    if (success) {
      this.successCount += 1;
    } else {
      this.failedCount += 1;
    }

    if (this.processedUrls >= this.totalUrls) {
      this.status = 'COMPLETED';
      this.completedAt = new Date();
    }
  }
}
