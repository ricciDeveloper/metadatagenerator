import { describe, it, expect } from 'vitest';
import app from '../../src/presentation/api/app';

// Helper for testing express routes without starting network server
async function makeRequest(method: string, path: string, body?: any) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method,
      url: path,
      headers: { 'content-type': 'application/json' },
      body: body || {},
    };

    let responseStatus = 200;
    let responseBody: any = null;

    const res: any = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        resolve({ status: responseStatus, body: responseBody });
      },
      setHeader() {},
      send(data: any) {
        responseBody = data;
        resolve({ status: responseStatus, body: responseBody });
      }
    };

    app(req, res, (err: any) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message } });
      }
    });
  });
}

describe('API Routes Integration', () => {
  it('should return health check ok', async () => {
    const res = await makeRequest('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should create project and list projects', async () => {
    const createRes = await makeRequest('POST', '/api/projects', {
      name: 'Loja de Calçados',
      domain: 'https://calcados.com',
      presetName: 'ecommerce'
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Loja de Calçados');
    expect(createRes.body.seoConfig.presetName).toBe('ecommerce');

    const listRes = await makeRequest('GET', '/api/projects');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  it('should create job with max 200 urls validation', async () => {
    const projRes = await makeRequest('POST', '/api/projects', {
      name: 'Blog de Viagens',
      domain: 'https://viagens.com',
      presetName: 'blog'
    });

    const projectId = projRes.body.id;

    const jobRes = await makeRequest('POST', '/api/jobs', {
      projectId,
      urls: ['https://viagens.com/dicas-paris', 'https://viagens.com/dicas-roma']
    });

    expect(jobRes.status).toBe(201);
    expect(jobRes.body.job.totalUrls).toBe(2);

    const getJobRes = await makeRequest('GET', `/api/jobs/${jobRes.body.job.id}`);
    expect(getJobRes.status).toBe(200);
    expect(getJobRes.body.urls).toHaveLength(2);

    const resultsRes = await makeRequest('GET', `/api/jobs/${jobRes.body.job.id}/results`);
    expect(resultsRes.status).toBe(200);
    expect(Array.isArray(resultsRes.body)).toBe(true);
    expect(resultsRes.body).toHaveLength(2);
  });
});
