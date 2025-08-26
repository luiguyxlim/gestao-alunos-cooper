# Configuração do Supabase

Este documento contém as instruções para configurar o projeto no Supabase.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Defina um nome para o projeto (ex: "gestao-alunos")
6. Escolha uma senha forte para o banco de dados
7. Selecione a região mais próxima
8. Clique em "Create new project"

## 2. Configurar Variáveis de Ambiente

1. No dashboard do Supabase, vá para **Settings** > **API**
2. Copie a **Project URL** e a **anon public key**
3. No arquivo `.env.local` do projeto, substitua:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 3. Executar Script de Configuração

1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar o script

## 4. Verificar Configuração

Após executar o script, você deve ver as seguintes tabelas criadas:

- `profiles` - Perfis dos usuários
- `students` - Dados dos alunos
- `performance_tests` - Testes de performance

## 5. Configurar Autenticação

1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, adicione: `http://localhost:3000`
3. Em **Redirect URLs**, adicione: `http://localhost:3000/auth/callback`
4. Salve as configurações

## 6. Testar a Aplicação

1. Execute o projeto: `npm run dev`
2. Acesse `http://localhost:3000`
3. Teste o registro de um novo usuário
4. Teste o login
5. Verifique se o redirecionamento funciona corretamente

## Estrutura do Banco de Dados

### Tabela `profiles`
- Armazena informações adicionais dos usuários
- Criada automaticamente quando um usuário se registra

### Tabela `students`
- Armazena dados dos alunos
- Cada usuário pode ter múltiplos alunos
- Inclui informações pessoais e de contato

### Tabela `performance_tests`
- Armazena resultados dos testes de performance
- Vinculada aos alunos
- Inclui medidas corporais, testes cardiovasculares, de força, resistência e flexibilidade

## Segurança (RLS)

O projeto utiliza Row Level Security (RLS) para garantir que:
- Usuários só podem ver seus próprios dados
- Usuários só podem modificar seus próprios registros
- Dados são isolados por usuário automaticamente

## Próximos Passos

Após configurar o Supabase:
1. Teste a autenticação
2. Implemente o CRUD de alunos
3. Implemente o CRUD de testes de performance
4. Configure o deploy na Vercel