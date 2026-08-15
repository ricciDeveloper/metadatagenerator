import { describe, it, expect } from 'vitest';
import { MetadataValidator } from '../../src/domain/services/MetadataValidator';
import { SeoConfig } from '../../src/domain/value-objects/SeoConfig';

describe('MetadataValidator', () => {
  const defaultConfig: SeoConfig = {
    title: { minLength: 50, maxLength: 55 },
    description: { minLength: 150, maxLength: 155 },
    language: 'pt-BR',
    avoidH1: true,
    useCta: true,
  };

  const validator = new MetadataValidator();

  it('should validate valid metadata correctly', () => {
    const validTitle = 'A'.repeat(52);
    const validDescription = 'B'.repeat(152);

    const result = validator.validate(
      { title: validTitle, description: validDescription },
      defaultConfig,
      'Original H1'
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if title is below minimum length', () => {
    const shortTitle = 'A'.repeat(45);
    const validDescription = 'B'.repeat(152);

    const result = validator.validate(
      { title: shortTitle, description: validDescription },
      defaultConfig
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title length (45) is below minimum of 50 characters.');
  });

  it('should fail if title exceeds maximum length', () => {
    const longTitle = 'A'.repeat(58);
    const validDescription = 'B'.repeat(152);

    const result = validator.validate(
      { title: longTitle, description: validDescription },
      defaultConfig
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title length (58) exceeds maximum of 55 characters.');
  });

  it('should fail if description is below minimum length', () => {
    const validTitle = 'A'.repeat(52);
    const shortDesc = 'B'.repeat(140);

    const result = validator.validate(
      { title: validTitle, description: shortDesc },
      defaultConfig
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Description length (140) is below minimum of 150 characters.');
  });

  it('should fail if description exceeds maximum length', () => {
    const validTitle = 'A'.repeat(52);
    const longDesc = 'B'.repeat(160);

    const result = validator.validate(
      { title: validTitle, description: longDesc },
      defaultConfig
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Description length (160) exceeds maximum of 155 characters.');
  });

  it('should fail if title is equal to H1 when avoidH1 is true', () => {
    const validTitle = 'Title Equals H1 Text Here Exact Match 52 Chars Long!';
    const validDescription = 'B'.repeat(152);

    const result = validator.validate(
      { title: validTitle, description: validDescription },
      defaultConfig,
      validTitle
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Generated Title is identical to the H1 tag.');
  });

  it('should allow title equal to H1 if avoidH1 is false', () => {
    const validTitle = 'Title Equals H1 Text Here Exact Match 52 Chars Long!';
    const validDescription = 'B'.repeat(152);

    const allowH1Config: SeoConfig = { ...defaultConfig, avoidH1: false };

    const result = validator.validate(
      { title: validTitle, description: validDescription },
      allowH1Config,
      validTitle
    );

    expect(result.isValid).toBe(true);
  });

  it('should fail if title or description is missing', () => {
    const result = validator.validate(
      { title: '', description: 'B'.repeat(152) },
      defaultConfig
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title is empty or missing.');
  });
});
