---
description: Guia de desenvolvimento orientado a testes (TDD) para novas features
---

# 🧪 Workflow TDD (Test Driven Development)

Este guia descreve o processo padrão para implementar novas funcionalidades usando TDD.

## 🔄 Ciclo Red-Green-Refactor

### 1. 🔴 RED (Escreva um teste que falha)
Antes de escrever qualquer código da funcionalidade, crie um arquivo de teste.

**Padrão de nomenclatura**: `NomeDoComponente.test.tsx` (ao lado do componente) ou em `src/test/`.

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MeuComponente from './MeuComponente';

describe('MeuComponente', () => {
  it('deve renderizar o título corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText('Título Esperado')).toBeInTheDocument();
  });
});
```

Execute o teste e confirme a falha:
```bash
npm test
```

### 2. 🟢 GREEN (Faça o teste passar)
Implemente o código mínimo necessário para que o teste passe.

```typescript
const MeuComponente = () => {
  return <h1>Título Esperado</h1>;
};
export default MeuComponente;
```

Execute o teste novamente:
```bash
npm test
```

### 3. 🔵 REFACTOR (Melhore o código)
Com o teste passando, você pode refatorar o código com segurança.
- Melhore a legibilidade
- Otimize a performance
- Remova duplicações

## 🛠️ Ferramentas Disponíveis

- **Vitest**: Runner de testes (rápido e compatível com Vite)
- **React Testing Library**: Para renderizar e interagir com componentes
- **Jest DOM**: Matchers extras (`toBeInTheDocument`, `toBeVisible`, etc.)

## 📝 Comandos Úteis

- `npm test`: Roda todos os testes em modo watch
- `npm run test:ui`: Abre a interface gráfica do Vitest

## ⚠️ Boas Práticas

1. **Teste comportamentos, não implementação**: Teste o que o usuário vê e faz.
2. **Mocks**: Utilize mocks para chamadas de API (Supabase, Fetch).
3. **Limpeza**: Os testes são isolados automaticamente, mas garanta que mocks sejam resetados (`vi.clearAllMocks()`).
