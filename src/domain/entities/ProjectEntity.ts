import { SeoConfig, DEFAULT_SEO_CONFIG, SEO_PRESETS } from '../value-objects/SeoConfig';

export interface ProjectProps {
  id?: string;
  name: string;
  domain: string;
  description?: string;
  seoConfig?: SeoConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProjectEntity {
  public readonly id: string;
  public name: string;
  public domain: string;
  public description: string;
  public seoConfig: SeoConfig;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: ProjectProps) {
    this.id = props.id || crypto.randomUUID();
    this.name = props.name.trim();
    this.domain = props.domain.trim();
    this.description = props.description?.trim() || '';
    this.seoConfig = props.seoConfig || { ...DEFAULT_SEO_CONFIG };
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static createWithPreset(
    name: string,
    domain: string,
    presetName: 'ecommerce' | 'institucional' | 'blog' | 'landing_page',
    description?: string
  ): ProjectEntity {
    const presetConfig = SEO_PRESETS[presetName] || DEFAULT_SEO_CONFIG;
    return new ProjectEntity({
      name,
      domain,
      description,
      seoConfig: { ...presetConfig }
    });
  }

  updateSeoConfig(config: SeoConfig): void {
    this.seoConfig = { ...config };
    this.updatedAt = new Date();
  }
}
