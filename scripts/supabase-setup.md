# Configuração do Supabase

## 1) Crie o projeto no Supabase
- Acesse https://supabase.com
- Crie um novo projeto PostgreSQL
- Copie a string de conexão de `Settings > Database`

## 2) Configure a variável no Vercel
No painel do Vercel:
- Project > Settings > Environment Variables
- Adicione a variável:
  - `DATABASE_URL`
  - valor: `postgresql://postgres:[SENHA]@db.[project-ref].supabase.co:5432/postgres?sslmode=require`

## 3) Crie as tabelas
No painel do Supabase:
- abra `SQL Editor`
- cole o conteúdo do arquivo `supabase-schema.sql`
- execute o script

## 4) Verifique
Depois de rodar o script, confirme que existem as tabelas:
- `projects`
- `jobs`
- `job_urls`

## 5) Teste a aplicação
- faça novo deploy no Vercel
- acesse a página e crie um projeto
- inicie um job
- confirme que os registros são gravados no banco do Supabase
