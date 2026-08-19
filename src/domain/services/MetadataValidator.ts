import { SeoConfig } from '../value-objects/SeoConfig.ts';

export interface GeneratedMetadata {
  title: string;
  description: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasLengthWarning: boolean;
  errors: string[];
  warnings: string[];
}

export class MetadataValidator {
  validate(
    metadata: Partial<GeneratedMetadata> | null | undefined,
    config: SeoConfig,
    originalH1?: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata) {
      return {
        isValid: false,
        hasLengthWarning: false,
        errors: ['Metadata object is null or undefined.'],
        warnings: [],
      };
    }

    const title = metadata.title?.trim() || '';
    const description = metadata.description?.trim() || '';

    if (!title) {
      errors.push('Title is empty or missing.');
    } else {
      if (title.length < config.title.minLength) {
        const msg = `Title length (${title.length}) is below minimum of ${config.title.minLength} characters.`;
        errors.push(msg);
        warnings.push(msg);
      }
      if (title.length > config.title.maxLength) {
        const msg = `Title length (${title.length}) exceeds maximum of ${config.title.maxLength} characters.`;
        errors.push(msg);
        warnings.push(msg);
      }
    }

    if (!description) {
      errors.push('Description is empty or missing.');
    } else {
      if (description.length < config.description.minLength) {
        const msg = `Description length (${description.length}) is below minimum of ${config.description.minLength} characters.`;
        errors.push(msg);
        warnings.push(msg);
      }
      if (description.length > config.description.maxLength) {
        const msg = `Description length (${description.length}) exceeds maximum of ${config.description.maxLength} characters.`;
        errors.push(msg);
        warnings.push(msg);
      }
    }

    if (config.avoidH1 && originalH1 && title.toLowerCase() === originalH1.trim().toLowerCase()) {
      errors.push('Generated Title is identical to the H1 tag.');
    }

    return {
      isValid: errors.length === 0,
      hasLengthWarning: warnings.length > 0,
      errors,
      warnings,
    };
  }
}
