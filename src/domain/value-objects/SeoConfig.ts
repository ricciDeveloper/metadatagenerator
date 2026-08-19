export interface TitleRuleConfig {
  minLength: number;
  maxLength: number;
}

export interface DescriptionRuleConfig {
  minLength: number;
  maxLength: number;
}

export interface SeoConfig {
  title: TitleRuleConfig;
  description: DescriptionRuleConfig;
  language: string;
  avoidH1: boolean;
  useCta: boolean;
  titleSuffix?: string;
  presetName?: 'ecommerce' | 'institucional' | 'blog' | 'landing_page' | 'custom';
}

export const SEO_PRESETS: Record<string, SeoConfig> = {
  ecommerce: {
    presetName: 'ecommerce',
    title: { minLength: 55, maxLength: 60 },
    description: { minLength: 140, maxLength: 160 },
    language: 'pt-BR',
    avoidH1: true,
    useCta: true,
    titleSuffix: ''
  },
  institucional: {
    presetName: 'institucional',
    title: { minLength: 55, maxLength: 60 },
    description: { minLength: 140, maxLength: 160 },
    language: 'pt-BR',
    avoidH1: true,
    useCta: true,
    titleSuffix: ''
  },
  blog: {
    presetName: 'blog',
    title: { minLength: 55, maxLength: 60 },
    description: { minLength: 140, maxLength: 160 },
    language: 'pt-BR',
    avoidH1: true,
    useCta: false,
    titleSuffix: ''
  },
  landing_page: {
    presetName: 'landing_page',
    title: { minLength: 55, maxLength: 60 },
    description: { minLength: 140, maxLength: 160 },
    language: 'pt-BR',
    avoidH1: true,
    useCta: true,
    titleSuffix: ''
  },
  custom: {
    presetName: 'custom',
    title: { minLength: 55, maxLength: 60 },
    description: { minLength: 140, maxLength: 160 },
    language: 'pt-BR',
    avoidH1: false,
    useCta: false,
    titleSuffix: ''
  }
};

export const DEFAULT_SEO_CONFIG: SeoConfig = SEO_PRESETS.ecommerce;
