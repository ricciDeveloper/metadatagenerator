import { describe, it, expect } from 'vitest';
import { JobEntity } from '../../src/domain/entities/JobEntity';
import { JobLimitExceededError } from '../../src/shared/errors/DomainErrors';

describe('JobEntity', () => {
  it('should normalize URLs, trim whitespace and remove duplicate URLs', () => {
    const rawUrls = [
      ' https://example.com/page1 ',
      'https://example.com/page2',
      'https://example.com/page1',
      '',
      '   ',
      'https://example.com/page3'
    ];

    const job = JobEntity.create('proj-123', rawUrls);

    expect(job.urls).toHaveLength(3);
    expect(job.urls).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ]);
    expect(job.totalUrls).toBe(3);
    expect(job.status).toBe('PENDING');
  });

  it('should throw JobLimitExceededError if unique URLs exceed 200', () => {
    const manyUrls = Array.from({ length: 205 }, (_, i) => `https://example.com/page-${i}`);
    expect(() => JobEntity.create('proj-123', manyUrls)).toThrow(JobLimitExceededError);
  });

  it('should update progress correctly on URL processing success or failure', () => {
    const job = JobEntity.create('proj-123', ['https://example.com/1', 'https://example.com/2']);
    
    job.recordResult(true);
    expect(job.processedUrls).toBe(1);
    expect(job.successCount).toBe(1);
    expect(job.failedCount).toBe(0);
    expect(job.status).toBe('PROCESSING');

    job.recordResult(false);
    expect(job.processedUrls).toBe(2);
    expect(job.successCount).toBe(1);
    expect(job.failedCount).toBe(1);
    expect(job.status).toBe('COMPLETED');
  });
});
