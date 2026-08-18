# SEO MetaAI

Aplicacao web para gerar Meta Titles e Meta Descriptions com o Gemini a partir de uma lista de URLs. Cada execucao e autocontida: nao ha projetos, historico, banco de dados ou armazenamento permanente.

## Execucao local

```bash
npm install
npm run dev
```

O processamento usa uma ou mais chaves informadas pelo usuario na tela. As chaves sao mantidas apenas em memoria e alternadas automaticamente quando uma recebe rate limit.

## Build

```bash
npm run build
```

A rota `POST /api/process` recebe as URLs, o modelo, o prompt customizado e as chaves Gemini, retornando os resultados diretamente para o navegador. O CSV e gerado localmente pela interface.
