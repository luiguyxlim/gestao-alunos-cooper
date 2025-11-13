# Cooper Pro

Um sistema completo para gestão de avaliandos e testes de performance, desenvolvido com Next.js 15, Supabase e TypeScript.

## 🚀 Funcionalidades

- **Autenticação completa** com Supabase Auth
- **CRUD de avaliandos** com informações pessoais e de contato
- **Gestão de testes de performance** com múltiplas métricas
- **Dashboard com estatísticas** e visualização de dados
- **PWA (Progressive Web App)** para instalação em dispositivos móveis
- **Interface responsiva** com Tailwind CSS
- **Testes automatizados** (unitários e end-to-end)

## 🛠️ Tecnologias

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Testes:** Jest, Testing Library, Playwright
- **Deploy:** Vercel
- **PWA:** Service Worker, Web App Manifest

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Conta na Vercel (para deploy)

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd cooper-pro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `supabase-setup.sql` no SQL Editor
3. Configure as variáveis de ambiente:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **profiles**: Perfis de usuário (criados automaticamente)
- **evaluatees**: Informações dos avaliandos
- **performance_tests**: Testes de performance com métricas

### Métricas de Performance

- Velocidade (0-10)
- Agilidade (0-10)
- Força (0-10)
- Resistência (0-10)
- Flexibilidade (0-10)
- Coordenação (0-10)
- Equilíbrio (0-10)
- Potência (0-10)
- Tempo de Reação (segundos)
- VO2 Max (ml/kg/min)

## 🧪 Testes

### Testes Unitários

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Testes End-to-End

```bash
# Executar testes E2E
npm run test:e2e

# Com interface visual
npm run test:e2e:ui
```

Veja mais detalhes em [TESTING.md](./TESTING.md)

## 📱 PWA (Progressive Web App)

O sistema pode ser instalado como um aplicativo nativo:

1. Acesse o site no navegador
2. Clique no botão "Instalar App" (aparece automaticamente)
3. Ou use a opção "Adicionar à tela inicial" do navegador

### Funcionalidades PWA

- **Instalação nativa** em dispositivos móveis e desktop
- **Funcionamento offline** (cache de recursos estáticos)
- **Ícones personalizados** e splash screen
- **Atalhos rápidos** para ações principais

## 🤖 Configuração do MCP Supabase

Para usar o assistente AI com acesso direto ao banco de dados Supabase, configure o Model Context Protocol:

📖 **Veja o guia completo:** [MCP_SETUP.md](./MCP_SETUP.md)

**Resumo rápido:**
1. Obtenha um Personal Access Token em [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Configure o token em Settings → Features → Model Context Protocol → Supabase
3. Reinicie o Cursor

## 🚀 Deploy na Vercel

### 1. Preparação

1. Faça commit de todas as alterações
2. Push para o repositório Git

### 2. Deploy Automático

1. Conecte seu repositório na [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### 4. Configuração de Domínio

1. Configure seu domínio personalizado na Vercel
2. Atualize as URLs permitidas no Supabase:
   - Authentication > URL Configuration
   - Adicione seu domínio em "Site URL" e "Redirect URLs"

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── students/          # Gestão de avaliandos
│   ├── tests/             # Gestão de testes
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
│   ├── actions/           # Server Actions
│   ├── supabase.ts        # Cliente Supabase
│   └── types.ts           # Tipos TypeScript
└── middleware.ts          # Middleware de autenticação

public/
├── manifest.json          # Web App Manifest
├── sw.js                  # Service Worker
└── icons/                 # Ícones do PWA

e2e/                       # Testes end-to-end
```

## 🔒 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Autenticação obrigatória** para todas as operações
- **Validação de dados** no frontend e backend
- **Middleware de proteção** de rotas

## 🎨 Interface

- **Design responsivo** para mobile, tablet e desktop
- **Tema moderno** com Tailwind CSS
- **Componentes acessíveis** com ARIA labels
- **Feedback visual** para ações do usuário

## 📊 Métricas e Analytics

- **Dashboard com estatísticas** em tempo real
- **Gráficos de performance** por avaliando
- **Relatórios de progresso** ao longo do tempo
- **Exportação de dados** (futuro)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email.

## 🔄 Roadmap

- [ ] Exportação de relatórios em PDF
- [ ] Gráficos avançados com Chart.js
- [ ] Notificações push
- [ ] Integração com wearables
- [ ] API pública
- [ ] Aplicativo mobile nativo

---

**Desenvolvido com ❤️ usando Next.js e Supabase**
