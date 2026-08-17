import { ProjectEntity } from '../../domain/entities/ProjectEntity.ts';
import { JobEntity } from '../../domain/entities/JobEntity.ts';
import { JobUrlEntity } from '../../domain/entities/JobUrlEntity.ts';
import { ProjectRepository } from '../../domain/repositories/ProjectRepository.ts';
import { JobRepository } from '../../domain/repositories/JobRepository.ts';
import { JobUrlRepository } from '../../domain/repositories/JobUrlRepository.ts';

export class InMemoryProjectRepository implements ProjectRepository {
  private projectsMap = new Map<string, ProjectEntity>();

  async save(project: ProjectEntity): Promise<void> {
    this.projectsMap.set(project.id, project);
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    return this.projectsMap.get(id) || null;
  }

  async findAll(): Promise<ProjectEntity[]> {
    return Array.from(this.projectsMap.values());
  }

  async delete(id: string): Promise<void> {
    this.projectsMap.delete(id);
  }
}

export class InMemoryJobRepository implements JobRepository {
  private jobsMap = new Map<string, JobEntity>();

  async save(job: JobEntity): Promise<void> {
    this.jobsMap.set(job.id, job);
  }

  async findById(id: string): Promise<JobEntity | null> {
    return this.jobsMap.get(id) || null;
  }

  async findByProjectId(projectId: string): Promise<JobEntity[]> {
    return Array.from(this.jobsMap.values()).filter(j => j.projectId === projectId);
  }

  async findAll(limit = 50): Promise<JobEntity[]> {
    return Array.from(this.jobsMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async updateProgress(
    jobId: string,
    processedUrls: number,
    successCount: number,
    failedCount: number,
    status: string
  ): Promise<void> {
    const job = this.jobsMap.get(jobId);
    if (job) {
      job.processedUrls = processedUrls;
      job.successCount = successCount;
      job.failedCount = failedCount;
      job.status = status as any;
      if (status === 'COMPLETED' || status === 'FAILED') {
        job.completedAt = new Date();
      }
    }
  }
}

export class InMemoryJobUrlRepository implements JobUrlRepository {
  private urlsMap = new Map<string, JobUrlEntity>();

  async saveBatch(urls: JobUrlEntity[]): Promise<void> {
    for (const urlEntity of urls) {
      this.urlsMap.set(urlEntity.id, urlEntity);
    }
  }

  async update(urlEntity: JobUrlEntity): Promise<void> {
    this.urlsMap.set(urlEntity.id, urlEntity);
  }

  async findByJobId(jobId: string): Promise<JobUrlEntity[]> {
    return Array.from(this.urlsMap.values()).filter(u => u.jobId === jobId);
  }

  async findPendingByJobId(jobId: string, limit: number): Promise<JobUrlEntity[]> {
    return Array.from(this.urlsMap.values())
      .filter(u => u.jobId === jobId && (u.status === 'PENDING' || u.status === 'PROCESSING'))
      .slice(0, limit);
  }
}
