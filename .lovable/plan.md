

# Badge "Atenção necessária" clicável com detalhes

## O que muda

Ao clicar no badge "⚠️ Atenção necessária" (ou "✅ Tudo em dia"), um popover/tooltip aparece logo abaixo mostrando a lista de alertas ativos com links diretos para resolver cada um.

## Implementação

**Arquivo**: `src/pages/Dashboard.tsx`

1. Envolver o badge `<span>` existente em um componente `Popover` (já disponível em `@/components/ui/popover`)
2. O `PopoverContent` exibe a lista de alertas (os mesmos do array `alerts` já computado):
   - Cada item mostra o texto do alerta + badge de urgência + botão/link para a página relevante (ex: "Ver vacinas →" navega para `/vacinas`, "Ver agenda →" para `/agenda`)
3. Se não houver alertas ("Tudo em dia"), o popover mostra uma mensagem positiva simples: "Nenhuma pendência encontrada 🎉"
4. Cursor `pointer` no badge para indicar que é clicável

## Visual

```text
┌─────────────────────────────────┐
│ ⚠️ Atenção necessária  (click) │
└────────────┬────────────────────┘
             ▼
  ┌──────────────────────────────┐
  │ 💉 1 vacina atrasada         │
  │              [Ver vacinas →] │
  │ ───────────────────────────  │
  │ 📅 Consulta Lilly            │
  │   Hoje     [Ver agenda →]   │
  └──────────────────────────────┘
```

Nenhuma mudança no banco de dados.

