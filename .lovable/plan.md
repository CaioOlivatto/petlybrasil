

# Redesign completo da HOME/Dashboard do Petly Brasil

## O que muda

Reescrever o `src/pages/Dashboard.tsx` com 5 seções bem definidas, mais personalidade visual e densidade de informação. Também adicionar animações CSS customizadas no `tailwind.config.ts` e `index.css`.

---

## Seções do novo Dashboard

### 1. Hero — Saudação + Pet
- Gradiente diagonal `#EDE9FE → #F5F3FF → #FAFAF9` com border-radius 20px
- Duas patinhas SVG decorativas (inline SVG, 100px, roxo 6% opacidade, rotacionadas)
- Foto do pet com borda branca, sombra roxa e **animação float** (translateY 0 a -6px, 3s infinite)
- Tipografia: DM Serif Display 32px para saudação, nome do pet em itálico roxo
- **Badge de status pill** ao lado do subtítulo: verde "Tudo em dia" ou âmbar "Atenção necessária" baseado nos alertas

### 2. Cards de Status (3 colunas)
- Labels em uppercase 11px com letter-spacing
- Valores em DM Serif Display 22px
- Hover: translateY(-2px) + sombra maior
- **Card Próximo Evento**: borda esquerda roxa, ícone de categoria à direita. Sem evento → link "Agendar →"
- **Card Vacinas**: borda verde/vermelha conforme status. **Mini barra de progresso** (4px) mostrando % de conclusão
- **Card Último Diário**: borda índigo. Humor com emoji. **Mini row de 7 bolinhas** (últimos 7 dias) com cores por humor
- Mobile: stack vertical, border-left vira border-top

### 3. Alertas & Lembretes
- Border-left 4px âmbar, fundo branco
- Items com fundo colorido por urgência (amarelo claro / vermelho claro)
- **Badges pill** à direita: "Hoje" (âmbar), "Atrasado" (vermelho), "Em X dias" (roxo)
- Sem alertas → ícone ✓ verde + "Tudo em ordem por hoje!"

### 4. Gráfico Semanal de Bem-estar (NOVO)
- Buscar últimos 7 dias de `daily_checkins` do banco
- 7 colunas (Seg-Dom) com barras verticais coloridas por humor
- Altura proporcional: ótimo=100%, bom=75%, neutro=50%, ruim=25%
- Cores: verde, verde-claro, âmbar, vermelho, cinza (sem registro)
- **Animação de entrada**: barras crescem de 0 com stagger de 80ms
- Sem dados → barras cinza tracejadas + texto "Sem registros"

### 5. Acesso Rápido
- **"+ Prontuário"**: fundo roxo, texto branco (primário)
- **"+ Evento" e "+ Diário"**: fundo branco, borda cinza, hover borda roxa
- **"Chat IA"**: fundo `#F5F3FF`, texto roxo, borda `#DDD6FE` (destaque secundário)
- Hover: scale(1.02) + sombra suave

---

## Animações de entrada

Adicionar keyframes `slideDown` e `fadeUp` no Tailwind config. Aplicar via classes com animation-delay crescente (hero 0ms, cards 100-300ms, alertas 400ms, gráfico 500ms, ações 600ms).

Animação `float` para a foto do pet (CSS keyframe no index.css).

---

## Alterações em dados

- Fetch adicional: últimos 7 dias de `daily_checkins` (humor + date) para alimentar o gráfico semanal e as 7 bolinhas do card de diário
- Sem alterações no banco de dados

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/Dashboard.tsx` | Reescrita completa com as 5 seções |
| `src/index.css` | Adicionar keyframes `float`, `slideDown`, `fadeUp`, `growBar` |
| `tailwind.config.ts` | Adicionar animações customizadas no extend |

## Mobile

- Hero: foto 56px, título 24px, layout coluna
- Cards: 1 coluna, border-top em vez de border-left
- Gráfico: barras mais finas (20px)
- Ações: grid 2x2

