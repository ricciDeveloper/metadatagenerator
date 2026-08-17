import { PageContent } from '../services/PromptEngine.ts';

export interface PageScraper {
  scrape(url: string): Promise<PageContent>;
}
