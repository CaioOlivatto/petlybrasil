

# Redesign da Agenda — Plano de Implementação

Este é um redesign completo da página `/agenda` com nova hierarquia visual, sistema de medicamentos com horários, layout em duas colunas e filtros rápidos.

## Escopo das Mudanças

### 1. Reescrever `src/pages/Agenda.tsx` (arquivo principal — ~856 linhas → ~900-1000 linhas)

**Header**: Manter estrutura atual, atualizar subtítulo para incluir nome do pet.

**Cards de Resumo (3 novos)**:
- "Hoje" (ícone relógio roxo, fundo `#F5F3FF`) — conta eventos de hoje
- "Próximos 7 dias" (ícone calendário âmbar, fundo `#FFFBEB`) — conta eventos 7 dias
- "Medicamentos ativos" (ícone pílula verde, fundo `#ECFDF5`) — conta medicamentos ativos hoje; clicável, rola até seção

Remover cards "Realizadas", "Próxima semana", "Próximo mês".

**Filtros rápidos (novo)**: Row de chips horizontais scrolláveis — Todos, Hoje, Esta semana, Consultas, Vacinas, Medicamentos, Exames. Chip ativo = fundo roxo.

**Layout duas colunas** (desktop 35/65, mobile stack):
- **Coluna esquerda**: Calendário com bolinhas coloridas (roxa = evento, verde = medicamento), painel do dia selecionado, painel "Medicamentos hoje" com horários e status (✓/○/⚠️)
- **Coluna direita**: Lista de eventos filtrada — "Hoje" (fundo `#F5F3FF`), "Próximos 7 dias", botão ghost "Ver eventos anteriores" para expandir realizados (opacidade 60%). Remover seção "Próximo mês".

**Card de evento redesenhado**: Border-left 4px colorida por tipo (roxo=consulta, verde=vacina/medicação, azul=exame, âmbar=vermífugo, vermelho=procedimento, rosa=banho, índigo=rotina). Badge de status no canto direito substituindo ⚠️ no título.

**Modal "Novo Evento" atualizado**: Quando tipo = Medicação, mostrar campos condicionais com slide-down:
- Frequência (dropdown: 1x, 2x 12/12h, 3x 8/8h, 4x 6/6h, etc.)
- Horário primeira dose (time picker)
- Data início / Data término (ou toggle "Uso contínuo")
- Dosagem (texto livre)
- Preview dos horários calculados

**Lógica de criação de medicação**: Ao salvar medicação, calcular todos os horários do dia com base na frequência + primeira dose, e criar eventos individuais para cada dia do período (início→término).

### 2. Não são necessárias mudanças no banco de dados
Os campos existentes em `agenda_events` (title, category, date, time, notes, source) são suficientes. A frequência e dosagem podem ser armazenados no campo `notes` como metadata ou no título.

### 3. Animações
- Cards de evento com `fadeUp` escalonado (delay 60ms entre itens)
- Próximo horário de medicamento com `pulse 2s infinite`
- Campos condicionais do modal com `slide-down`
- Todas as animações já existem no `tailwind.config.ts`

### Resumo de arquivos alterados
- `src/pages/Agenda.tsx` — reescrita completa

