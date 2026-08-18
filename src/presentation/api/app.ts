import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getUseCases } from './container.ts';
import { DomainError } from '../../shared/errors/DomainErrors.ts';
import { SEO_PRESETS } from '../../domain/value-objects/SeoConfig.ts';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/presets
app.get('/api/presets', (_req: Request, res: Response) => {
  res.json(SEO_PRESETS);
});

// POST /api/process - Process an entire job without server-side state
app.post('/api/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urls, apiKeys, concurrency, model, customPrompt, seoConfig } = req.body;
    if (!Array.isArray(urls) || urls.length === 0 || !Array.isArray(apiKeys) || apiKeys.length === 0) {
      res.status(400).json({ error: 'At least one Gemini API key is required in apiKeys array.' });
      return;
    }

    const { processUrlsUseCase } = getUseCases();
    const result = await processUrlsUseCase.execute({
      urls,
      apiKeys,
      concurrency: concurrency ? Number(concurrency) : undefined,
      model,
      customPrompt,
      seoConfig,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler (Sanitizes stack trace & secrets)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err.message || err);
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Exporting the app instance
export default app;
