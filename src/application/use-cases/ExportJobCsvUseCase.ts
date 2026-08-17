import { JobUrlRepository } from '../../domain/repositories/JobUrlRepository.ts';

export class ExportJobCsvUseCase {
  constructor(private jobUrlRepository: JobUrlRepository) {}

  async execute(jobId: string): Promise<string> {
    const urls = await this.jobUrlRepository.findByJobId(jobId);

    const escapeCsvField = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = 'URL,META_TITLE,TITLE_LENGTH,META_DESCRIPTION,DESCRIPTION_LENGTH,STATUS,ERROR';

    const rows = urls.map(u => {
      return [
        escapeCsvField(u.url),
        escapeCsvField(u.generatedTitle || ''),
        u.titleLength !== null && u.titleLength !== undefined ? u.titleLength : '',
        escapeCsvField(u.generatedDescription || ''),
        u.descriptionLength !== null && u.descriptionLength !== undefined ? u.descriptionLength : '',
        escapeCsvField(u.status),
        escapeCsvField(u.error || '')
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
