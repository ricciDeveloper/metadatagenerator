import { GeneratedMetadata } from '../services/MetadataValidator';

export interface AIProviderOptions {
  model?: string;
  apiKey: string;
}

export interface AIProvider {
  generateMetadata(prompt: string, options: AIProviderOptions): Promise<GeneratedMetadata>;
}
