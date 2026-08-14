import { PageContent } from '../services/PromptEngine';

export interface PageScraper {
  scrape(url: string): Promise<PageContent>;
}
