import axios from 'axios';
import * as cheerio from 'cheerio';
import { PageScraper } from '../../domain/providers/PageScraper.ts';
import { PageContent } from '../../domain/services/PromptEngine.ts';
import { SSRFGuard } from '../../domain/services/SSRFGuard.ts';

export class AxiosCheerioPageScraper implements PageScraper {
  private ssrfGuard: SSRFGuard;

  constructor() {
    this.ssrfGuard = new SSRFGuard();
  }

  async scrape(url: string): Promise<PageContent> {
    // SSRF protection check before network request
    const validatedUrl = this.ssrfGuard.validateUrl(url);

    try {
      const { data } = await axios.get<string>(validatedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEO-Metadata-Bot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(data);

      $('script, style, noscript, svg, iframe').remove();

      const title = $('title').text().trim();

      const h1 = $('h1')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .join(' ');

      const bodyText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 10000);

      return {
        url: validatedUrl,
        title,
        h1,
        bodyText,
      };
    } catch (error: any) {
      if (error.name === 'SSRFError' || error.name === 'InvalidUrlError') {
        throw error;
      }
      throw new Error(`Scraping failed for ${validatedUrl}: ${error.message || 'Unknown network error'}`);
    }
  }
}
