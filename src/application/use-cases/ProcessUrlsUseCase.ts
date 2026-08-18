import { AIKeyManager } from '../../domain/services/AIKeyManager.ts';
import { ProcessUrlMetadataUseCase, ProcessUrlResponse } from './ProcessUrlMetadataUseCase.ts';
import { DEFAULT_SEO_CONFIG, SeoConfig } from '../../domain/value-objects/SeoConfig.ts';

export interface ProcessUrlsRequest {
  urls: string[];
  apiKeys: string[];
  model?: string;
  customPrompt?: string;
  concurrency?: number;
  seoConfig?: SeoConfig;
}

export interface ProcessUrlsResponse {
  results: ProcessUrlResponse[];
  processedCount: number;
  successCount: number;
  failedCount: number;
}

export class ProcessUrlsUseCase {
  constructor(private processUrlMetadataUseCase: ProcessUrlMetadataUseCase) {}

  async execute(request: ProcessUrlsRequest): Promise<ProcessUrlsResponse> {
    const urls = Array.from(new Set(request.urls.map(url => url.trim()).filter(Boolean))).slice(0, 200);
    const keyManager = new AIKeyManager(request.apiKeys);
    const concurrency = Math.min(Math.max(request.concurrency || 3, 1), 5);
    const results: ProcessUrlResponse[] = [];
    const queue = [...urls];

    const processUrl = async (url: string) => {
      let lastError = 'Todas as API keys estão indisponíveis.';
      while (true) {
        let activeKey: string;
        try {
          activeKey = keyManager.getActiveKey();
        } catch (error: any) {
          return { url, success: false, attempts: 0, error: error.message || lastError };
        }

        try {
          return await this.processUrlMetadataUseCase.execute({
            url,
            apiKey: activeKey,
            model: request.model,
            customPrompt: request.customPrompt,
            seoConfig: request.seoConfig || DEFAULT_SEO_CONFIG,
          });
        } catch (error: any) {
          const status = error.status || error.statusCode || 500;
          lastError = `Gemini Provider Error: ${error.message || 'Erro desconhecido'}`;
          keyManager.recordError(activeKey, status);
        }
      }
    };

    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (url) results.push(await processUrl(url));
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));

    return {
      results: urls.map(url => results.find(result => result.url === url)!).filter(Boolean),
      processedCount: results.length,
      successCount: results.filter(result => result.success).length,
      failedCount: results.filter(result => !result.success).length,
    };
  }
}
