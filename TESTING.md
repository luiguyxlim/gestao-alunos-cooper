# Guia de Testes

Este projeto inclui uma suíte completa de testes para garantir a qualidade e confiabilidade do código.

## Tipos de Testes

### 1. Testes Unitários (Jest + Testing Library)

Testes para componentes individuais e funções utilitárias.

**Executar testes unitários:**
```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch (reexecuta quando arquivos mudam)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage
```

**Localização dos testes:**
- Componentes: `src/components/__tests__/`
- Actions: `src/lib/actions/__tests__/`
- Utilitários: `src/lib/__tests__/`

### 2. Testes End-to-End (Playwright)

Testes que simulam o comportamento real do usuário no navegador.

**Executar testes E2E:**
```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes E2E com interface visual
npm run test:e2e:ui

# Executar testes E2E com navegador visível
npm run test:e2e:headed
```

**Localização dos testes:**
- Testes E2E: `e2e/`

### 3. Executar Todos os Testes

```bash
# Executar testes unitários e E2E em sequência
npm run test:all
```

## Configuração dos Testes

### Jest (Testes Unitários)

- **Configuração:** `jest.config.js`
- **Setup:** `jest.setup.js`
- **Ambiente:** jsdom (simula o DOM do navegador)
- **Cobertura:** Configurada para 70% de cobertura mínima

### Playwright (Testes E2E)

- **Configuração:** `playwright.config.ts`
- **Navegadores:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Servidor:** Inicia automaticamente o servidor de desenvolvimento

## Estrutura de Testes

### Testes Unitários

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import Component from '../Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', () => {
    const mockFn = jest.fn()
    render(<Component onClick={mockFn} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

### Testes E2E

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test('should perform user workflow', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Button')
    await expect(page).toHaveURL('/expected-url')
  })
})
```

## Mocks e Utilitários

### Mocks Configurados

- **Next.js Router:** Mockado para testes unitários
- **Supabase Client:** Mockado com métodos básicos
- **Variáveis de Ambiente:** Configuradas para testes

### Utilitários Globais

- **ResizeObserver:** Mockado para componentes que usam observação de redimensionamento
- **IntersectionObserver:** Mockado para componentes com lazy loading
- **matchMedia:** Mockado para testes de responsividade

## Boas Práticas

### Testes Unitários

1. **Teste comportamentos, não implementação**
2. **Use data-testid para elementos difíceis de selecionar**
3. **Mock dependências externas**
4. **Teste casos de erro e edge cases**
5. **Mantenha testes simples e focados**

### Testes E2E

1. **Teste fluxos críticos do usuário**
2. **Use seletores estáveis (texto, roles, data-testid)**
3. **Evite testes muito granulares**
4. **Configure dados de teste quando necessário**
5. **Teste em diferentes dispositivos/navegadores**

## Cobertura de Testes

### Metas de Cobertura

- **Linhas:** 70%
- **Funções:** 70%
- **Branches:** 70%
- **Statements:** 70%

### Arquivos Excluídos da Cobertura

- Arquivos de configuração
- Arquivos de tipos TypeScript (`.d.ts`)
- Layout principal (`layout.tsx`)
- Estilos globais (`globals.css`)

## Debugging

### Testes Unitários

```bash
# Debug com Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug específico teste
npm run test -- --testNamePattern="test name"
```

### Testes E2E

```bash
# Debug com Playwright inspector
npx playwright test --debug

# Debug teste específico
npx playwright test auth.spec.ts --debug
```

## CI/CD

Os testes são configurados para executar em ambientes de CI com:

- **Retry:** 2 tentativas em caso de falha
- **Paralelização:** Desabilitada em CI para estabilidade
- **Relatórios:** HTML para testes E2E
- **Artefatos:** Screenshots e vídeos em caso de falha

## Troubleshooting

### Problemas Comuns

1. **Testes E2E falhando:** Verifique se o servidor está rodando
2. **Timeouts:** Aumente o timeout para operações lentas
3. **Seletores não encontrados:** Use seletores mais específicos
4. **Mocks não funcionando:** Verifique se estão no arquivo de setup

### Logs e Debug

- Use `console.log` temporariamente para debug
- Verifique logs do Playwright para testes E2E
- Use `screen.debug()` para ver o DOM em testes unitários