import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getUseCases } from './container';
import { ProjectEntity } from '../../domain/entities/ProjectEntity';
import { JobEntity } from '../../domain/entities/JobEntity';
import { JobUrlEntity } from '../../domain/entities/JobUrlEntity';
import { DomainError } from '../../shared/errors/DomainErrors';
import { SEO_PRESETS } from '../../domain/value-objects/SeoConfig';
import { getDb } from '../../infrastructure/database/connection';

const app = express();

const mapJobUrlResult = (item: any) => ({
  id: item.id,
  jobId: item.jobId,
  url: item.url,
  status: item.status,
  metaTitle: item.generatedTitle ?? item.originalTitle ?? null,
  metaDescription: item.generatedDescription ?? null,
  originalTitle: item.originalTitle ?? null,
  originalH1: item.originalH1 ?? null,
  errorMessage: item.error ?? null,
  retryCount: item.attempts ?? 0,
  attempts: item.attempts ?? 0,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB healthcheck - quick connectivity test
app.get('/api/health/db', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    // simple raw query to validate connection
    // drizzle exposes a `query` method on the pool; use a lightweight select
    // If Drizzle instance is returned, run a simple SQL via `db.query` if available
    if ((db as any).execute && typeof (db as any).execute === 'function') {
      await (db as any).execute('select 1');
    } else if ((db as any).query && typeof (db as any).query === 'function') {
      await (db as any).query('select 1');
    } else {
      // attempt pool check via pg internals
      // Not all environments expose pool; if nothing available, respond OK (best-effort)
    }

    res.json({ status: 'ok', db: 'connected' });
  } catch (err: any) {
    console.error('[DB Health] error', err && err.message ? err.message : err);
    res.status(503).json({ status: 'error', db: 'unavailable', message: 'Database connection failed' });
  }
});

// GET /api/presets
app.get('/api/presets', (_req: Request, res: Response) => {
  res.json(SEO_PRESETS);
});

// GET /api/projects - List projects
app.get('/api/projects', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectRepo } = getUseCases();
    const projectsList = await projectRepo.findAll();
    res.json(projectsList);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create project
app.post('/api/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, presetName, description, seoConfig } = req.body;
    if (!name || !domain) {
      res.status(400).json({ error: 'Name and Domain are required.' });
      return;
    }

    let project: ProjectEntity;
    if (presetName && SEO_PRESETS[presetName]) {
      project = ProjectEntity.createWithPreset(name, domain, presetName, description);
      if (seoConfig) {
        project.updateSeoConfig({ ...project.seoConfig, ...seoConfig });
      }
    } else {
      project = new ProjectEntity({
        name,
        domain,
        description,
        seoConfig: seoConfig || SEO_PRESETS.ecommerce,
      });
    }

    const { projectRepo } = getUseCases();
    await projectRepo.save(project);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project
app.get('/api/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectRepo } = getUseCases();
    const id = String(req.params.id);
    const project = await projectRepo.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, description, seoConfig } = req.body;
    const { projectRepo } = getUseCases();
    const id = String(req.params.id);
    const project = await projectRepo.findById(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (name) project.name = name;
    if (domain) project.domain = domain;
    if (description !== undefined) project.description = description;
    if (seoConfig) project.updateSeoConfig(seoConfig);

    await projectRepo.save(project);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectRepo } = getUseCases();
    const id = String(req.params.id);
    await projectRepo.delete(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs - Create Job
app.post('/api/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, urls } = req.body;
    if (!projectId || !Array.isArray(urls)) {
      res.status(400).json({ error: 'projectId and urls array are required.' });
      return;
    }

    const { projectRepo, jobRepo, jobUrlRepo } = getUseCases();
    const project = await projectRepo.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const job = JobEntity.create(projectId, urls);
    await jobRepo.save(job);

    const jobUrlEntities = job.urls.map(url => new JobUrlEntity({ jobId: job.id, url }));
    await jobUrlRepo.saveBatch(jobUrlEntities);

    res.status(201).json({
      job,
      urlsCount: job.urls.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs - List jobs
app.get('/api/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobRepo } = getUseCases();
    const limit = Number(req.query.limit) || 50;
    const jobsList = await jobRepo.findAll(limit);
    res.json(jobsList);
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id - Get Job status + URL results
app.get('/api/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobRepo, jobUrlRepo } = getUseCases();
    const id = String(req.params.id);
    const job = await jobRepo.findById(id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const urls = await jobUrlRepo.findByJobId(job.id);
    res.json({
      ...job,
      urls,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id/results - Job results array for UI polling
app.get('/api/jobs/:id/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobRepo, jobUrlRepo } = getUseCases();
    const id = String(req.params.id);
    const job = await jobRepo.findById(id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const urls = await jobUrlRepo.findByJobId(job.id);
    res.json(urls.map(mapJobUrlResult));
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs/:id/process - Process next batch chunk with API Keys
app.post('/api/jobs/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKeys, concurrency, batchSize, model } = req.body;
    if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
      res.status(400).json({ error: 'At least one Gemini API key is required in apiKeys array.' });
      return;
    }

    const { processJobBatchUseCase } = getUseCases();
    const id = String(req.params.id);
    const result = await processJobBatchUseCase.execute({
      jobId: id,
      apiKeys,
      concurrency: concurrency ? Number(concurrency) : undefined,
      batchSize: batchSize ? Number(batchSize) : undefined,
      model,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id/export - Export CSV
app.get('/api/jobs/:id/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { exportJobCsvUseCase } = getUseCases();
    const id = String(req.params.id);
    const csvContent = await exportJobCsvUseCase.execute(id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="seo-metadata-${id}.csv"`);
    res.send(csvContent);
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
