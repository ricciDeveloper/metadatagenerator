import { PageScraper } from '../../domain/providers/PageScraper.ts';
import { AIProvider } from '../../domain/providers/AIProvider.ts';
import { PromptEngine, PageContent } from '../../domain/services/PromptEngine.ts';
import { MetadataValidator } from '../../domain/services/MetadataValidator.ts';
import { SeoConfig } from '../../domain/value-objects/SeoConfig.ts';

export interface ProcessUrlRequest {
  url: string;
  apiKey: string;
  seoConfig: SeoConfig;
  model?: string;
  customPrompt?: string;
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
  hasWarning?: boolean;
  warning?: string;
  warnings?: string[];
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
    let lastGenerated: {
      title: string;
      description: string;
      validationErrors: string[];
      validationWarnings: string[];
    } | null = null;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const prompt = this.promptEngine.buildPrompt(pageContent, request.seoConfig, request.customPrompt);
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
            hasWarning: false,
          };
        }

        // If the metadata is otherwise valid but does not fulfill the exact character limits, remember it as a warning candidate
        const fatalErrors = validation.errors.filter(
          err => !err.includes('below minimum') && !err.includes('exceeds maximum')
        );

        if (generated?.title?.trim() && generated?.description?.trim() && fatalErrors.length === 0) {
          lastGenerated = {
            title: generated.title.trim(),
            description: generated.description.trim(),
            validationErrors: validation.errors,
            validationWarnings: validation.warnings,
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

    // If metadata was generated but exceeded length or constraints after retries, keep content with warning flag
    if (lastGenerated && lastGenerated.title && lastGenerated.description) {
      const warningList = lastGenerated.validationWarnings.length > 0
        ? lastGenerated.validationWarnings
        : lastGenerated.validationErrors;

      return {
        url: request.url,
        success: true,
        originalTitle: pageContent.title,
        originalH1: pageContent.h1,
        title: lastGenerated.title,
        titleLength: lastGenerated.title.length,
        description: lastGenerated.description,
        descriptionLength: lastGenerated.description.length,
        attempts,
        hasWarning: true,
        warning: warningList.join('; '),
        warnings: warningList,
      };
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
