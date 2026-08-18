import { getUseCases } from '../src/presentation/api/container.ts';
import { DomainError } from '../src/shared/errors/DomainErrors.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { urls, apiKeys, concurrency, model, customPrompt, seoConfig } = body;

    if (!Array.isArray(urls) || urls.length === 0 || !Array.isArray(apiKeys) || apiKeys.length === 0) {
      res.status(400).json({ error: 'At least one URL and one Gemini API key are required.' });
      return;
    }

    const result = await getUseCases().processUrlsUseCase.execute({
      urls,
      apiKeys,
      concurrency: concurrency ? Number(concurrency) : undefined,
      model,
      customPrompt,
      seoConfig,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('[API Process Error]', error?.message || error);
    if (error instanceof DomainError) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
}
