import { describe, it, expect, vi } from 'vitest';
import { AxiosCheerioPageScraper } from '../../src/infrastructure/scraper/AxiosCheerioPageScraper';
import axios from 'axios';
import { SSRFError } from '../../src/shared/errors/DomainErrors';

vi.mock('axios');

describe('AxiosCheerioPageScraper', () => {
  const scraper = new AxiosCheerioPageScraper();

  it('should block SSRF addresses before attempting request', async () => {
    await expect(scraper.scrape('http://127.0.0.1/local-admin')).rejects.toThrow(SSRFError);
  });

  it('should scrape title, h1, and bodyText correctly from valid HTML response', async () => {
    const htmlResponse = `
      <html>
        <head><title>   Página de Exemplo   </title></head>
        <body>
          <script>console.log('ignore me');</script>
          <h1>Título H1 do Produto</h1>
          <p>Este é o conteúdo do produto com <span>texto extra</span>.</p>
        </body>
      </html>
    `;

    vi.mocked(axios.get).mockResolvedValueOnce({ data: htmlResponse });

    const content = await scraper.scrape('https://example.com/produto');

    expect(content.title).toBe('Página de Exemplo');
    expect(content.h1).toBe('Título H1 do Produto');
    expect(content.bodyText).toContain('Este é o conteúdo do produto com texto extra.');
    expect(content.bodyText).not.toContain('ignore me');
  });
});
