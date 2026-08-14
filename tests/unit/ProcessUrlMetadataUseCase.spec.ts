import { describe, it, expect, vi } from 'vitest';
import { ProcessUrlMetadataUseCase } from '../../src/application/use-cases/ProcessUrlMetadataUseCase';
import { MetadataValidator } from '../../src/domain/services/MetadataValidator';
import { PromptEngine } from '../../src/domain/services/PromptEngine';
import { DEFAULT_SEO_CONFIG } from '../../src/domain/value-objects/SeoConfig';

describe('ProcessUrlMetadataUseCase', () => {
  const validator = new MetadataValidator();
  const promptEngine = new PromptEngine();

  it('should retry generation up to maxRetries when validator fails', async () => {
    let callCount = 0;

    const mockScraper = {
      scrape: vi.fn().mockResolvedValue({
        url: 'https://example.com/item',
        title: 'Original Title',
        h1: 'Original H1',
        bodyText: 'Body text content for testing'
      })
    };

    const mockAiProvider = {
      generateMetadata: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // 1st attempt: Invalid short title
          return { title: 'Short', description: 'B'.repeat(152) };
        }
        // 2nd attempt: Valid title & description
        return { title: 'A'.repeat(52), description: 'B'.repeat(152) };
      })
    };

    const useCase = new ProcessUrlMetadataUseCase(
      mockScraper,
      mockAiProvider,
      promptEngine,
      validator
    );

    const result = await useCase.execute({
      url: 'https://example.com/item',
      apiKey: 'test-key',
      seoConfig: DEFAULT_SEO_CONFIG,
      maxRetries: 3
    });

    expect(result.success).toBe(true);
    expect(callCount).toBe(2); // Retried once and succeeded
    expect(result.title).toBe('A'.repeat(52));
  });

  it('should return failure if maxRetries exceeded without valid metadata', async () => {
    const mockScraper = {
      scrape: vi.fn().mockResolvedValue({
        url: 'https://example.com/item',
        title: 'Original Title',
        h1: 'Original H1',
        bodyText: 'Body text content'
      })
    };

    const mockAiProvider = {
      generateMetadata: vi.fn().mockResolvedValue({
        title: 'Always Short',
        description: 'Short desc'
      })
    };

    const useCase = new ProcessUrlMetadataUseCase(
      mockScraper,
      mockAiProvider,
      promptEngine,
      validator
    );

    const result = await useCase.execute({
      url: 'https://example.com/item',
      apiKey: 'test-key',
      seoConfig: DEFAULT_SEO_CONFIG,
      maxRetries: 2
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Exceeded maximum metadata generation retries');
  });
});
