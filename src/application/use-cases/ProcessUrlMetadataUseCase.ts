import { PageScraper } from '../../domain/providers/PageScraper';
import { AIProvider } from '../../domain/providers/AIProvider';
import { PromptEngine, PageContent } from '../../domain/services/PromptEngine';
import { MetadataValidator } from '../../domain/services/MetadataValidator';
import { SeoConfig } from '../../domain/value-objects/SeoConfig';

export interface ProcessUrlRequest {
  url: string;
  apiKey: string;
  seoConfig: SeoConfig;
  model?: string;
  maxRetries?: number;
}

export interface ProcessUrlResponse {
  url: string;
  success: boolean;
  originalTitle?: string;
  originalH1?: string;
  title?: string;
  titleLength?: number;
  description?: string;
  descriptionLength?: number;
  attempts: number;
  error?: string;
}

export class ProcessUrlMetadataUseCase {
  constructor(
    private scraper: PageScraper,
    private aiProvider: AIProvider,
    private promptEngine: PromptEngine,
    private validator: MetadataValidator
  ) {}

  async execute(request: ProcessUrlRequest): Promise<ProcessUrlResponse> {
    const maxRetries = request.maxRetries ?? 3;
    let pageContent: PageContent;

    try {
      pageContent = await this.scraper.scrape(request.url);
    } catch (error: any) {
      return {
        url: request.url,
        success: false,
        attempts: 0,
        error: `Scraping error: ${error.message || 'Unknown network error'}`
      };
    }

    let attempts = 0;
    let lastErrors: string[] = [];

    while (attempts < maxRetries) {
      attempts++;
      try {
        const prompt = this.promptEngine.buildPrompt(pageContent, request.seoConfig);
        const generated = await this.aiProvider.generateMetadata(prompt, {
          apiKey: request.apiKey,
          model: request.model,
        });

        const validation = this.validator.validate(generated, request.seoConfig, pageContent.h1);

        if (validation.isValid) {
          return {
            url: request.url,
            success: true,
            originalTitle: pageContent.title,
            originalH1: pageContent.h1,
            title: generated.title,
            titleLength: generated.title.length,
            description: generated.description,
            descriptionLength: generated.description.length,
            attempts,
          };
        }

        lastErrors = validation.errors;
      } catch (error: any) {
        lastErrors = [error.message || 'AI Provider Error'];
        // Rethrow rate limit or API key error so parent runner can handle key rotation
        if (error.status === 429 || error.status === 401 || error.status === 403) {
          throw error;
        }
      }
    }

    return {
      url: request.url,
      success: false,
      originalTitle: pageContent.title,
      originalH1: pageContent.h1,
      attempts,
      error: `Exceeded maximum metadata generation retries (${maxRetries}). Errors: ${lastErrors.join('; ')}`
    };
  }
}
