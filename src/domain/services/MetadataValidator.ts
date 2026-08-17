import { SeoConfig } from '../value-objects/SeoConfig.ts';

export interface GeneratedMetadata {
  title: string;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class MetadataValidator {
  validate(
    metadata: Partial<GeneratedMetadata> | null | undefined,
    config: SeoConfig,
    originalH1?: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!metadata) {
      return { isValid: false, errors: ['Metadata object is null or undefined.'] };
    }

    const title = metadata.title?.trim() || '';
    const description = metadata.description?.trim() || '';

    if (!title) {
      errors.push('Title is empty or missing.');
    } else {
      if (title.length < config.title.minLength) {
        errors.push(`Title length (${title.length}) is below minimum of ${config.title.minLength} characters.`);
      }
      if (title.length > config.title.maxLength) {
        errors.push(`Title length (${title.length}) exceeds maximum of ${config.title.maxLength} characters.`);
      }
    }

    if (!description) {
      errors.push('Description is empty or missing.');
    } else {
      if (description.length < config.description.minLength) {
        errors.push(`Description length (${description.length}) is below minimum of ${config.description.minLength} characters.`);
      }
      if (description.length > config.description.maxLength) {
        errors.push(`Description length (${description.length}) exceeds maximum of ${config.description.maxLength} characters.`);
      }
    }

    if (config.avoidH1 && originalH1 && title.toLowerCase() === originalH1.trim().toLowerCase()) {
      errors.push('Generated Title is identical to the H1 tag.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
