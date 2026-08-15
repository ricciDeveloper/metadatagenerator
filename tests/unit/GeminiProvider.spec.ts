import { describe, it, expect, vi } from 'vitest';
import { GeminiProvider } from '../../src/infrastructure/ai/GeminiProvider';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            title: 'Meta Title de Teste com Tamanho Exato 52 Caracteres',
            description: 'Meta Description de Teste Com Tamanho Exato Otimizado Para SEO com 152 Caracteres de Conteúdo Gerado Pela Inteligência Artificial Gemini Oficial!'
          })
        })
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING'
    }
  };
});

describe('GeminiProvider', () => {
  const provider = new GeminiProvider();

  it('should generate metadata using Gemini API and parse JSON response', async () => {
    const result = await provider.generateMetadata('Test Prompt', { apiKey: 'dummy-key' });

    expect(result.title).toContain('Meta Title de Teste');
    expect(result.description).toContain('Meta Description de Teste');
  });
});
