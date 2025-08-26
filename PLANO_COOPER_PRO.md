# 🎯 Plano de Transformação: Gestão de Alunos → Cooper Pro

## 📋 Visão Geral

Este documento detalha o plano completo para transformar o aplicativo "Gestão de Alunos" em "Cooper Pro", alterando todas as referências de "alunos" para "avaliandos" e melhorando a experiência do usuário.

## 🔄 Mudanças Principais

### Terminologia
- **Antes**: Gestão de Alunos
- **Depois**: Cooper Pro
- **Antes**: Alunos
- **Depois**: Avaliandos

## 📝 Plano de Execução

### 🚀 Fase 1: Configurações e Metadados (Alta Prioridade)

#### 1.1 Arquivos de Configuração
- [ ] `package.json`
  - Alterar `name` de "gestao-alunos" para "cooper-pro"
  - Atualizar `description`
  - Modificar `keywords`

- [ ] `public/manifest.json`
  - Alterar `name` e `short_name` para "Cooper Pro"
  - Atualizar `description`

- [ ] `next.config.js/ts`
  - Verificar e atualizar metadados se necessário

#### 1.2 Metadados da Aplicação
- [ ] Títulos das páginas (metadata)
- [ ] Favicon e ícones
- [ ] Service Worker (`public/sw.js`)

### 🗄️ Fase 2: Banco de Dados (Alta Prioridade)

#### 2.1 Estrutura do Banco
- [ ] Criar migração para renomear tabela `students` → `evaluatees`
- [ ] Atualizar referências de chaves estrangeiras
- [ ] Manter compatibilidade durante a transição

#### 2.2 Scripts SQL
- [ ] `supabase-setup.sql`
- [ ] `fix_database.sql`
- [ ] Arquivos de migração em `supabase/migrations/`

### 💻 Fase 3: Código da Aplicação (Alta Prioridade)

#### 3.1 Estrutura de Pastas
- [ ] Renomear pasta `students` para `evaluatees` (se existir)
- [ ] Atualizar imports e exports

#### 3.2 Arquivos de Código
- [ ] `src/lib/actions/students.ts` → `evaluatees.ts`
- [ ] `src/app/students/` → `src/app/evaluatees/`
- [ ] Componentes relacionados
- [ ] Types e interfaces

#### 3.3 Variáveis e Funções
- [ ] Renomear todas as variáveis `student` → `evaluatee`
- [ ] Funções como `createStudent` → `createEvaluatee`
- [ ] Props e estados dos componentes

### 🎨 Fase 4: Interface do Usuário (Média Prioridade)

#### 4.1 Textos e Labels
- [ ] Botões: "Adicionar Aluno" → "Adicionar Avaliando"
- [ ] Títulos de páginas
- [ ] Mensagens de erro e sucesso
- [ ] Placeholders de formulários

#### 4.2 Navegação
- [ ] Menu lateral/superior
- [ ] Breadcrumbs
- [ ] URLs das rotas

#### 4.3 Componentes UI
- [ ] Cards de listagem
- [ ] Formulários
- [ ] Modais e dialogs
- [ ] Tooltips e ajudas

### 📚 Fase 5: Documentação (Média Prioridade)

#### 5.1 Arquivos de Documentação
- [ ] `README.md`
- [ ] `SUPABASE_SETUP.md`
- [ ] `TESTING.md`
- [ ] `ERRO_TABELAS_SUPABASE.md`

#### 5.2 Comentários no Código
- [ ] JSDoc e comentários
- [ ] Descrições de funções
- [ ] Exemplos de uso

### 🎨 Fase 6: Identidade Visual (Baixa Prioridade)

#### 6.1 Logo e Ícones
- [ ] Criar logo "Cooper Pro"
- [ ] Atualizar favicons
- [ ] Ícones da aplicação PWA

#### 6.2 Cores e Tema
- [ ] Definir paleta de cores
- [ ] Atualizar CSS/Tailwind
- [ ] Melhorar consistência visual

### 🧪 Fase 7: Testes e Validação (Média Prioridade)

#### 7.1 Testes Automatizados
- [ ] Atualizar testes unitários
- [ ] Modificar testes E2E
- [ ] Verificar todos os cenários

#### 7.2 Validação Manual
- [ ] Testar todas as funcionalidades
- [ ] Verificar responsividade
- [ ] Validar acessibilidade

## 📁 Arquivos a Serem Modificados

### Configuração
```
package.json
public/manifest.json
next.config.js
public/sw.js
```

### Banco de Dados
```
supabase-setup.sql
fix_database.sql
supabase/migrations/20250821012420_create_tables.sql
```

### Código da Aplicação
```
src/lib/actions/students.ts
src/app/students/
src/components/ (componentes relacionados)
middleware.ts (se houver referências)
```

### Documentação
```
README.md
SUPABASE_SETUP.md
TESTING.md
ERRO_TABELAS_SUPABASE.md
```

### Testes
```
e2e/students.spec.ts
jest.config.js (se houver referências)
```

## 🔍 Checklist de Busca e Substituição

### Termos a Substituir
- `gestao-alunos` → `cooper-pro`
- `Gestão de Alunos` → `Cooper Pro`
- `aluno` → `avaliando`
- `alunos` → `avaliandos`
- `Aluno` → `Avaliando`
- `Alunos` → `Avaliandos`
- `student` → `evaluatee`
- `students` → `evaluatees`
- `Student` → `Evaluatee`
- `Students` → `Evaluatees`

### Padrões de Código
- Nomes de variáveis
- Nomes de funções
- Nomes de componentes
- Nomes de tipos/interfaces
- URLs e rotas
- Nomes de tabelas
- Comentários

## ⚠️ Considerações Importantes

### Compatibilidade
- Manter backup do banco de dados
- Testar migração em ambiente de desenvolvimento
- Considerar versionamento das APIs

### Performance
- Verificar impacto das mudanças no banco
- Otimizar queries após renomeação
- Atualizar índices se necessário

### SEO e Acessibilidade
- Atualizar meta tags
- Verificar alt texts
- Manter estrutura semântica

## 🎯 Resultado Esperado

Após a conclusão do plano:
- ✅ Aplicativo renomeado para "Cooper Pro"
- ✅ Todas as referências a "alunos" alteradas para "avaliandos"
- ✅ Interface mais profissional e consistente
- ✅ Documentação atualizada
- ✅ Testes funcionando corretamente
- ✅ Identidade visual renovada

## 📅 Cronograma Sugerido

1. **Dia 1**: Fases 1 e 2 (Configurações e Banco)
2. **Dia 2**: Fase 3 (Código da Aplicação)
3. **Dia 3**: Fase 4 (Interface do Usuário)
4. **Dia 4**: Fases 5 e 7 (Documentação e Testes)
5. **Dia 5**: Fase 6 (Identidade Visual) e ajustes finais

---

**Status**: 📋 Plano criado - Pronto para execução
**Próximo passo**: Iniciar Fase 1 - Configurações e Metadados