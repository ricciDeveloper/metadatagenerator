import { AxiosCheerioPageScraper } from '../../infrastructure/scraper/AxiosCheerioPageScraper.ts';
import { GeminiProvider } from '../../infrastructure/ai/GeminiProvider.ts';
import { PromptEngine } from '../../domain/services/PromptEngine.ts';
import { MetadataValidator } from '../../domain/services/MetadataValidator.ts';
import { ProcessUrlMetadataUseCase } from '../../application/use-cases/ProcessUrlMetadataUseCase.ts';
import { ProcessUrlsUseCase } from '../../application/use-cases/ProcessUrlsUseCase.ts';

export function getUseCases() {
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

  return {
    processUrlsUseCase: new ProcessUrlsUseCase(processUrlMetadataUseCase),
  };
}
