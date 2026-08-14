import { describe, it, expect } from 'vitest';
import { PromptEngine } from '../../src/domain/services/PromptEngine';
import { SeoConfig, SEO_PRESETS } from '../../src/domain/value-objects/SeoConfig';

describe('PromptEngine', () => {
  const engine = new PromptEngine();

  const mockContent = {
    url: 'https://example.com/produto',
    title: 'Original Page Title',
    h1: 'Produto Incrível H1',
    bodyText: 'Este é o conteúdo do produto incrível para vender online.',
  };

  it('should build prompt using ecommerce preset configuration', () => {
    const config: SeoConfig = SEO_PRESETS.ecommerce;
    const prompt = engine.buildPrompt(mockContent, config);

    expect(prompt).toContain('Português do Brasil');
    expect(prompt).toContain('50 e 55 caracteres');
    expect(prompt).toContain('150 e 155 caracteres');
    expect(prompt).toContain('NÃO DEVE ser igual ou idêntico ao H1');
    expect(prompt).toContain('NÃO utilizar emojis');
    expect(prompt).toContain('NÃO utilizar aspas');
    expect(prompt).toContain('CTA');
    expect(prompt).toContain(mockContent.url);
    expect(prompt).toContain(mockContent.h1);
  });

  it('should adapt min/max rules dynamically from custom SeoConfig', () => {
    const customConfig: SeoConfig = {
      title: { minLength: 40, maxLength: 60 },
      description: { minLength: 120, maxLength: 140 },
      language: 'pt-BR',
      avoidH1: false,
      useCta: false,
    };

    const prompt = engine.buildPrompt(mockContent, customConfig);

    expect(prompt).toContain('40 e 60 caracteres');
    expect(prompt).toContain('120 e 140 caracteres');
    expect(prompt).not.toContain('NÃO COPIAR O H1');
  });
});
