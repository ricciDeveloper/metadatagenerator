import { eq, desc } from 'drizzle-orm';
import { getDb } from '../database/connection';
import { projects, jobs, jobUrls } from '../database/schema';
import { ProjectEntity } from '../../domain/entities/ProjectEntity';
import { JobEntity } from '../../domain/entities/JobEntity';
import { JobUrlEntity } from '../../domain/entities/JobUrlEntity';
import { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { JobRepository } from '../../domain/repositories/JobRepository';
import { JobUrlRepository } from '../../domain/repositories/JobUrlRepository';

export class DrizzleProjectRepository implements ProjectRepository {
  async save(project: ProjectEntity): Promise<void> {
    const db = getDb();
    await db
      .insert(projects)
      .values({
        id: project.id,
        name: project.name,
        domain: project.domain,
        description: project.description,
        seoConfig: project.seoConfig,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: project.name,
          domain: project.domain,
          description: project.description,
          seoConfig: project.seoConfig,
          updatedAt: project.updatedAt,
        },
      });
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const db = getDb();
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return new ProjectEntity({
      id: row.id,
      name: row.name,
      domain: row.domain,
      description: row.description || '',
      seoConfig: row.seoConfig,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findAll(): Promise<ProjectEntity[]> {
    const db = getDb();
    const result = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return result.map(
      row =>
        new ProjectEntity({
          id: row.id,
          name: row.name,
          domain: row.domain,
          description: row.description || '',
          seoConfig: row.seoConfig,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, id));
  }
}

export class DrizzleJobRepository implements JobRepository {
  async save(job: JobEntity): Promise<void> {
    const db = getDb();
    await db
      .insert(jobs)
      .values({
        id: job.id,
        projectId: job.projectId,
        status: job.status,
        totalUrls: job.totalUrls,
        processedUrls: job.processedUrls,
        successCount: job.successCount,
        failedCount: job.failedCount,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })
      .onConflictDoUpdate({
        target: jobs.id,
        set: {
          status: job.status,
          processedUrls: job.processedUrls,
          successCount: job.successCount,
          failedCount: job.failedCount,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        },
      });
  }

  async findById(id: string): Promise<JobEntity | null> {
    const db = getDb();
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (result.length === 0) return null;
    const row = result[0];
    return new JobEntity({
      id: row.id,
      projectId: row.projectId,
      urls: [], // URLs fetched via JobUrlRepository
      status: row.status as any,
      totalUrls: row.totalUrls,
      processedUrls: row.processedUrls,
      successCount: row.successCount,
      failedCount: row.failedCount,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    });
  }

  async findByProjectId(projectId: string): Promise<JobEntity[]> {
    const db = getDb();
    const result = await db.select().from(jobs).where(eq(jobs.projectId, projectId)).orderBy(desc(jobs.createdAt));
    return result.map(
      row =>
        new JobEntity({
          id: row.id,
          projectId: row.projectId,
          urls: [],
          status: row.status as any,
          totalUrls: row.totalUrls,
          processedUrls: row.processedUrls,
          successCount: row.successCount,
          failedCount: row.failedCount,
          createdAt: row.createdAt,
          startedAt: row.startedAt,
          completedAt: row.completedAt,
        })
    );
  }

  async findAll(limit = 50): Promise<JobEntity[]> {
    const db = getDb();
    const result = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
    return result.map(
      row =>
        new JobEntity({
          id: row.id,
          projectId: row.projectId,
          urls: [],
          status: row.status as any,
          totalUrls: row.totalUrls,
          processedUrls: row.processedUrls,
          successCount: row.successCount,
          failedCount: row.failedCount,
          createdAt: row.createdAt,
          startedAt: row.startedAt,
          completedAt: row.completedAt,
        })
    );
  }

  async updateProgress(
    jobId: string,
    processedUrls: number,
    successCount: number,
    failedCount: number,
    status: string
  ): Promise<void> {
    const db = getDb();
    const isFinished = status === 'COMPLETED' || status === 'FAILED';
    await db
      .update(jobs)
      .set({
        processedUrls,
        successCount,
        failedCount,
        status,
        ...(isFinished ? { completedAt: new Date() } : {}),
      })
      .where(eq(jobs.id, jobId));
  }
}

export class DrizzleJobUrlRepository implements JobUrlRepository {
  async saveBatch(urlsList: JobUrlEntity[]): Promise<void> {
    if (urlsList.length === 0) return;
    const db = getDb();
    await db.insert(jobUrls).values(
      urlsList.map(u => ({
        id: u.id,
        jobId: u.jobId,
        url: u.url,
        status: u.status,
        originalTitle: u.originalTitle,
        originalH1: u.originalH1,
        generatedTitle: u.generatedTitle,
        titleLength: u.titleLength,
        generatedDescription: u.generatedDescription,
        descriptionLength: u.descriptionLength,
        attempts: u.attempts,
        error: u.error,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))
    );
  }

  async update(u: JobUrlEntity): Promise<void> {
    const db = getDb();
    await db
      .update(jobUrls)
      .set({
        status: u.status,
        originalTitle: u.originalTitle,
        originalH1: u.originalH1,
        generatedTitle: u.generatedTitle,
        titleLength: u.titleLength,
        generatedDescription: u.generatedDescription,
        descriptionLength: u.descriptionLength,
        attempts: u.attempts,
        error: u.error,
        updatedAt: u.updatedAt,
      })
      .where(eq(jobUrls.id, u.id));
  }

  async findByJobId(jobId: string): Promise<JobUrlEntity[]> {
    const db = getDb();
    const result = await db.select().from(jobUrls).where(eq(jobUrls.jobId, jobId)).orderBy(jobUrls.createdAt);
    return result.map(
      row =>
        new JobUrlEntity({
          id: row.id,
          jobId: row.jobId,
          url: row.url,
          status: row.status as any,
          originalTitle: row.originalTitle,
          originalH1: row.originalH1,
          generatedTitle: row.generatedTitle,
          titleLength: row.titleLength,
          generatedDescription: row.generatedDescription,
          descriptionLength: row.descriptionLength,
          attempts: row.attempts,
          error: row.error,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
    );
  }

  async findPendingByJobId(jobId: string, limit: number): Promise<JobUrlEntity[]> {
    const db = getDb();
    const result = await db
      .select()
      .from(jobUrls)
      .where(eq(jobUrls.jobId, jobId))
      .limit(limit);
    
    return result
      .filter(row => row.status === 'PENDING' || row.status === 'PROCESSING')
      .map(
        row =>
          new JobUrlEntity({
            id: row.id,
            jobId: row.jobId,
            url: row.url,
            status: row.status as any,
            originalTitle: row.originalTitle,
            originalH1: row.originalH1,
            generatedTitle: row.generatedTitle,
            titleLength: row.titleLength,
            generatedDescription: row.generatedDescription,
            descriptionLength: row.descriptionLength,
            attempts: row.attempts,
            error: row.error,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          })
      );
  }
}
