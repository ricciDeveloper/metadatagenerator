import { GoogleGenAI, Type } from '@google/genai';
import { AIProvider, AIProviderOptions } from '../../domain/providers/AIProvider.ts';
import { GeneratedMetadata } from '../../domain/services/MetadataValidator.ts';

export class GeminiProvider implements AIProvider {
  async generateMetadata(prompt: string, options: AIProviderOptions): Promise<GeneratedMetadata> {
    if (!options.apiKey) {
      throw new Error('Gemini API key is required');
    }

    const ai = new GoogleGenAI({
      apiKey: options.apiKey
    });

    const modelName = options.model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Meta Title' },
              description: { type: Type.STRING, description: 'Meta Description' },
            },
            required: ['title', 'description'],
          },
        },
      });

      const responseText = response.text ? response.text.trim() : '';

      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Safe JSON parsing with fallback string cleanup
      const cleanJsonStr = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJsonStr);

      return {
        title: parsed.title ? String(parsed.title).trim() : '',
        description: parsed.description ? String(parsed.description).trim() : '',
      };
    } catch (error: any) {
      // Re-throw with status codes preserved for AIKeyManager rate-limit tracking
      const status = error.status || error.statusCode || (error.message?.includes('429') ? 429 : 500);
      const customError: any = new Error(`Gemini Provider Error: ${error.message || 'Unknown error'}`);
      customError.status = status;
      throw customError;
    }
  }
}
