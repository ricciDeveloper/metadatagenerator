import { describe, it, expect, vi } from 'vitest';
import { ProcessJobBatchUseCase } from '../../src/application/use-cases/ProcessJobBatchUseCase';
import { InMemoryProjectRepository, InMemoryJobRepository, InMemoryJobUrlRepository } from '../../src/infrastructure/repositories/InMemoryRepositories';
import { ProjectEntity } from '../../src/domain/entities/ProjectEntity';
import { JobEntity } from '../../src/domain/entities/JobEntity';
import { JobUrlEntity } from '../../src/domain/entities/JobUrlEntity';

describe('ProcessJobBatchUseCase', () => {
  it('should process pending URLs using AIKeyManager and update progress', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const jobRepo = new InMemoryJobRepository();
    const jobUrlRepo = new InMemoryJobUrlRepository();

    const project = ProjectEntity.createWithPreset('Test Project', 'https://example.com', 'ecommerce');
    await projectRepo.save(project);

    const job = JobEntity.create(project.id, ['https://example.com/p1', 'https://example.com/p2']);
    await jobRepo.save(job);

    const url1 = new JobUrlEntity({ jobId: job.id, url: 'https://example.com/p1' });
    const url2 = new JobUrlEntity({ jobId: job.id, url: 'https://example.com/p2' });
    await jobUrlRepo.saveBatch([url1, url2]);

    const mockProcessSingle = {
      execute: vi.fn().mockImplementation(async (req) => ({
        url: req.url,
        success: true,
        title: 'Title ' + req.url.slice(-2),
        titleLength: 52,
        description: 'Description ' + req.url.slice(-2),
        descriptionLength: 152,
        attempts: 1
      }))
    };

    const useCase = new ProcessJobBatchUseCase(
      projectRepo,
      jobRepo,
      jobUrlRepo,
      mockProcessSingle as any
    );

    const result = await useCase.execute({
      jobId: job.id,
      apiKeys: ['key-1', 'key-2'],
      concurrency: 2,
      batchSize: 10
    });

    expect(result.processedCount).toBe(2);
    expect(result.successCount).toBe(2);

    const updatedJob = await jobRepo.findById(job.id);
    expect(updatedJob?.status).toBe('COMPLETED');
    expect(updatedJob?.processedUrls).toBe(2);
  });
});
