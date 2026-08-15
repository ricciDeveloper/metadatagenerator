import { describe, it, expect } from 'vitest';
import { ExportJobCsvUseCase } from '../../src/application/use-cases/ExportJobCsvUseCase';
import { InMemoryJobUrlRepository } from '../../src/infrastructure/repositories/InMemoryRepositories';
import { JobUrlEntity } from '../../src/domain/entities/JobUrlEntity';

describe('ExportJobCsvUseCase', () => {
  it('should generate properly escaped CSV output for job URL results', async () => {
    const repo = new InMemoryJobUrlRepository();
    const jobId = 'job-123';

    const url1 = new JobUrlEntity({
      jobId,
      url: 'https://example.com/item-1',
      status: 'SUCCESS',
      generatedTitle: 'Title "Com Aspas" e, Vírgulas',
      titleLength: 30,
      generatedDescription: 'Description com\nQuebra de linha',
      descriptionLength: 35,
    });

    const url2 = new JobUrlEntity({
      jobId,
      url: 'https://example.com/item-2',
      status: 'FAILED',
      error: 'Erro de conexao',
    });

    await repo.saveBatch([url1, url2]);

    const useCase = new ExportJobCsvUseCase(repo);
    const csv = await useCase.execute(jobId);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('URL,META_TITLE,TITLE_LENGTH,META_DESCRIPTION,DESCRIPTION_LENGTH,STATUS,ERROR');
    expect(csv).toContain('"Title ""Com Aspas"" e, Vírgulas"');
    expect(csv).toContain('"SUCCESS"');
    expect(csv).toContain('"FAILED"');
  });
});
