🚀 SEO Metadata Generator (v1.0.0)
==================================

Automação em Node.js que realiza scraping de páginas web e utiliza a API do **Google Gemini** para gerar **Meta Titles** e **Meta Descriptions** otimizados para SEO, respeitando limites estritos de caracteres e exportando os resultados diretamente para um arquivo CSV.

📌 Funcionalidades
------------------

-   **Scraping de Conteúdo**: Extrai dados relevantes (`<title>`, `<h1>` e texto visível do `<body>`) ignorando scripts e estilos.

-   **Geração com IA (Gemini)**: Utiliza o modelo `gemini-3.1-flash-lite` da biblioteca oficial `@google/genai`.

-   **Regras Estritas de SEO**:

    -   **Meta Title**: Entre 50 e 55 caracteres, finalizando com traço (`-` ) e diferente do `<h1>`.

    -   **Meta Description**: Entre 150 e 155 caracteres com inclusão obrigatória de chamadas para ação (CTAs).

    -   **Formatação Limpa**: Sem aspas, sem emojis e em Português do Brasil (PT-BR).

-   **Exportação Incremental em CSV**: Salva o progresso URL por URL para evitar perda de dados em caso de interrupções.

-   **Rate Limit & Sanitização**: Inclui intervalo configurável entre requisições para evitar bloqueios de API.

�️ Banco de dados: Supabase
---------------------------

Este projeto usa PostgreSQL via Drizzle. Para rodar no Supabase e também no Vercel, configure a variável de ambiente:

- `DATABASE_URL` com a string de conexão do PostgreSQL do Supabase, por exemplo:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
```

No Vercel, adicione essa variável em "Settings > Environment Variables". Como o projeto usa Drizzle + Postgres, o Supabase funciona nativamente como banco principal.

�🛠️ Pré-requisitos
------------------

-   **Node.js** (versão 18 ou superior recomendada)

-   Uma chave de API do **Google Gemini** ([Obtenha sua API Key no Google AI Studio](https://aistudio.google.com/))