import { SeoConfig } from '../value-objects/SeoConfig';

export interface PageContent {
  url: string;
  title: string;
  h1: string;
  bodyText: string;
}

export class PromptEngine {
  buildPrompt(content: PageContent, config: SeoConfig): string {
    const avoidH1Instruction = config.avoidH1
      ? `- O Meta Title NÃO DEVE ser igual ou idêntico ao H1 ("${content.h1}").`
      : '';

    const ctaInstruction = config.useCta
      ? `- Inclua uma chamada para ação (CTA) sutil e persuasiva na Meta Description (ex: "Confira!", "Saiba mais", "Aproveite").`
      : '';

    const suffixInstruction = config.titleSuffix
      ? `- Adicione o sufixo "${config.titleSuffix}" ao final do Title se couber no limite de caracteres.`
      : '';

    return `
Você é um especialista em SEO internacional e copywriting técnico.

Analise as informações da página e gere os metadados de SEO otimizados seguindo RIGOROSAMENTE as regras abaixo:

Diretrizes Obrigatórias:
1. Idioma: ${config.language === 'pt-BR' ? 'Português do Brasil' : config.language}.
2. Meta Title:
   - Deve ter rigorosamente entre ${config.title.minLength} e ${config.title.maxLength} caracteres.
   - O tamanho ideal é o mais próximo possível de ${config.title.maxLength} caracteres sem ultrapassar.
   ${avoidH1Instruction}
   ${suffixInstruction}
3. Meta Description:
   - Deve ter rigorosamente entre ${config.description.minLength} e ${config.description.maxLength} caracteres.
   - Deve resumir com precisão a página.
   ${ctaInstruction}
4. Restrições Gerais:
   - NÃO utilizar emojis.
   - NÃO utilizar aspas (simples ou duplas).
   - Manter tom profissional e semanticamente relevante.
5. Retorne APENAS um objeto JSON no seguinte formato:
{
  "title": "Seu title aqui",
  "description": "Sua description aqui"
}

Dados da página:
URL: ${content.url}
Title atual: ${content.title || 'Não informado'}
H1: ${content.h1 || 'Não informado'}
Conteúdo principal:
${content.bodyText ? content.bodyText.substring(0, 4000) : 'Sem conteúdo legível'}
`;
  }
}
