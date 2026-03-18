

# Remover seção "Bem-estar esta semana"

A seção do gráfico semanal com barras verticais (Seção 5 — linhas 399-431) é redundante agora que existe o componente `TodayWellness` com barras horizontais detalhadas (Energia, Apetite, Sono, Humor) e o score do dia.

O gráfico semanal mostra apenas o humor dos últimos 7 dias em barras verticais, sem contexto útil adicional — especialmente quando a maioria dos dias fica vazia/cinza.

## Plano

**Arquivo: `src/pages/Dashboard.tsx`**
- Remover a seção "Bem-estar esta semana" (linhas 399-431) — o bloco inteiro com o gráfico de barras verticais
- Remover variáveis/lógica relacionadas que não são mais usadas: `weekDays`, `weekCheckins`, `humorColor`, `humorToLevel` (se não usados em outro lugar)
- Manter todo o resto intacto (Hero, Cards, Alertas, TodayWellness, Acesso Rápido)

Resultado: dashboard mais limpo, sem seção redundante, mantendo o bem-estar detalhado do dia no componente `TodayWellness`.

