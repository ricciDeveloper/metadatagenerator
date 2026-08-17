import { ProjectRepository } from '../../domain/repositories/ProjectRepository.ts';
import { JobRepository } from '../../domain/repositories/JobRepository.ts';
import { JobUrlRepository } from '../../domain/repositories/JobUrlRepository.ts';
import { InMemoryProjectRepository, InMemoryJobRepository, InMemoryJobUrlRepository } from '../../infrastructure/repositories/InMemoryRepositories.ts';
import { DrizzleProjectRepository, DrizzleJobRepository, DrizzleJobUrlRepository } from '../../infrastructure/repositories/DrizzleRepositories.ts';
import { AxiosCheerioPageScraper } from '../../infrastructure/scraper/AxiosCheerioPageScraper.ts';
import { GeminiProvider } from '../../infrastructure/ai/GeminiProvider.ts';
import { PromptEngine } from '../../domain/services/PromptEngine.ts';
import { MetadataValidator } from '../../domain/services/MetadataValidator.ts';
import { ProcessUrlMetadataUseCase } from '../../application/use-cases/ProcessUrlMetadataUseCase.ts';
import { ProcessJobBatchUseCase } from '../../application/use-cases/ProcessJobBatchUseCase.ts';
import { ExportJobCsvUseCase } from '../../application/use-cases/ExportJobCsvUseCase.ts';

// Singletons / Instances
let projectRepo: ProjectRepository;
let jobRepo: JobRepository;
let jobUrlRepo: JobUrlRepository;

export function getRepositories() {
  if (!projectRepo) {
    if (process.env.DATABASE_URL) {
      projectRepo = new DrizzleProjectRepository();
      jobRepo = new DrizzleJobRepository();
      jobUrlRepo = new DrizzleJobUrlRepository();
    } else {
      console.warn('[Container] Using In-Memory Repositories (DATABASE_URL not set)');
      projectRepo = new InMemoryProjectRepository();
      jobRepo = new InMemoryJobRepository();
      jobUrlRepo = new InMemoryJobUrlRepository();
    }
  }
  return { projectRepo, jobRepo, jobUrlRepo };
}

export function getUseCases() {
  const { projectRepo, jobRepo, jobUrlRepo } = getRepositories();
  const scraper = new AxiosCheerioPageScraper();
  const aiProvider = new GeminiProvider();
  const promptEngine = new PromptEngine();
  const validator = new MetadataValidator();

  const processUrlMetadataUseCase = new ProcessUrlMetadataUseCase(
    scraper,
    aiProvider,
    promptEngine,
    validator
  );

  const processJobBatchUseCase = new ProcessJobBatchUseCase(
    projectRepo,
    jobRepo,
    jobUrlRepo,
    processUrlMetadataUseCase
  );

  const exportJobCsvUseCase = new ExportJobCsvUseCase(jobUrlRepo);

  return {
    projectRepo,
    jobRepo,
    jobUrlRepo,
    processJobBatchUseCase,
    exportJobCsvUseCase,
  };
}
