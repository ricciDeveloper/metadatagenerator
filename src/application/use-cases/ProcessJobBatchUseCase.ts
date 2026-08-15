import { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { JobRepository } from '../../domain/repositories/JobRepository';
import { JobUrlRepository } from '../../domain/repositories/JobUrlRepository';
import { ProcessUrlMetadataUseCase, ProcessUrlResponse } from './ProcessUrlMetadataUseCase';
import { AIKeyManager } from '../../domain/services/AIKeyManager';
import { JobNotFoundError, ProjectNotFoundError } from '../../shared/errors/DomainErrors';

export interface ProcessJobBatchRequest {
  jobId: string;
  apiKeys: string[];
  concurrency?: number;
  batchSize?: number;
  model?: string;
}

export interface ProcessJobBatchResponse {
  jobId: string;
  processedCount: number;
  successCount: number;
  failedCount: number;
  remainingCount: number;
  jobStatus: string;
}

export class ProcessJobBatchUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private jobRepository: JobRepository,
    private jobUrlRepository: JobUrlRepository,
    private processUrlMetadataUseCase: ProcessUrlMetadataUseCase
  ) {}

  async execute(request: ProcessJobBatchRequest): Promise<ProcessJobBatchResponse> {
    const job = await this.jobRepository.findById(request.jobId);
    if (!job) {
      throw new JobNotFoundError(request.jobId);
    }

    const project = await this.projectRepository.findById(job.projectId);
    if (!project) {
      throw new ProjectNotFoundError(job.projectId);
    }

    const keyManager = new AIKeyManager(request.apiKeys);
    const concurrency = request.concurrency || Number(process.env.MAX_CONCURRENCY) || 3;
    const batchSize = request.batchSize || 50;

    const pendingUrls = await this.jobUrlRepository.findPendingByJobId(job.id, batchSize);

    if (pendingUrls.length === 0) {
      return {
        jobId: job.id,
        processedCount: 0,
        successCount: job.successCount,
        failedCount: job.failedCount,
        remainingCount: 0,
        jobStatus: job.status,
      };
    }

    let processedBatchCount = 0;
    let successBatchCount = 0;
    let failedBatchCount = 0;

    // Process chunk using controlled concurrency pool
    const processQueue = [...pendingUrls];

    while (processQueue.length > 0) {
      const activeChunk = processQueue.splice(0, concurrency);

      await Promise.all(
        activeChunk.map(async (jobUrlEntity) => {
          jobUrlEntity.status = 'PROCESSING';
          jobUrlEntity.attempts += 1;
          await this.jobUrlRepository.update(jobUrlEntity);

          let activeKey: string;
          try {
            activeKey = keyManager.getActiveKey();
          } catch (keyErr: any) {
            jobUrlEntity.recordFailure(keyErr.message || 'All API keys unavailable');
            await this.jobUrlRepository.update(jobUrlEntity);
            failedBatchCount++;
            processedBatchCount++;
            job.recordResult(false);
            return;
          }

          try {
            const result: ProcessUrlResponse = await this.processUrlMetadataUseCase.execute({
              url: jobUrlEntity.url,
              apiKey: activeKey,
              seoConfig: project.seoConfig,
              model: request.model,
            });

            processedBatchCount++;
            if (result.success && result.title && result.description) {
              jobUrlEntity.recordSuccess(result.title, result.description);
              jobUrlEntity.originalTitle = result.originalTitle || null;
              jobUrlEntity.originalH1 = result.originalH1 || null;
              successBatchCount++;
              job.recordResult(true);
            } else {
              jobUrlEntity.recordFailure(result.error || 'Failed to generate valid metadata');
              failedBatchCount++;
              job.recordResult(false);
            }
          } catch (error: any) {
            // Handle rate limit / auth errors with AIKeyManager
            const status = error.status || error.statusCode || 500;
            keyManager.recordError(activeKey, status);

            jobUrlEntity.recordFailure(`AI Provider Error (${status}): ${error.message}`);
            failedBatchCount++;
            job.recordResult(false);
          }

          await this.jobUrlRepository.update(jobUrlEntity);
        })
      );
    }

    // Persist job progress
    await this.jobRepository.updateProgress(
      job.id,
      job.processedUrls,
      job.successCount,
      job.failedCount,
      job.status
    );

    const remainingPending = await this.jobUrlRepository.findPendingByJobId(job.id, 1);

    return {
      jobId: job.id,
      processedCount: processedBatchCount,
      successCount: job.successCount,
      failedCount: job.failedCount,
      remainingCount: remainingPending.length,
      jobStatus: job.status,
    };
  }
}
