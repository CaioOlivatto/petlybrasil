

# Redesign do Prontuário — Plano de Implementação

Transformar o prontuário de acordeões fechados por categoria em uma timeline cronológica rica e escaneável, com cards expandidos, filtros, busca, ordenação e barra de resumo.

## Arquivo alterado

**`src/pages/Prontuario.tsx`** — reescrita completa (~900 linhas)

## Mudanças principais

### 1. Barra de resumo (nova)
Row de mini stats em pills abaixo do header com fundo `#F5F3FF`:
- Total de registros, medicações ativas, exames, data da última consulta

### 2. Filtros e busca (melhorados)
- Chips de categoria scrolláveis (Todas, Consulta, Exame, Vacina, etc.) — mesmo estilo atual mas incluindo todas as categorias, não só as que têm dados
- Campo de busca com placeholder "Buscar por nome, data ou categoria..."
- Dropdown de ordenação: "Mais recente" | "Mais antigo" | "Por categoria"

### 3. Timeline cronológica (substituindo acordeões)
- Remover agrupamento por categoria em acordeões
- Linha vertical à esquerda (2px, `#E7E5E4`) com bolinha colorida (10px) por categoria no ponto de conexão
- Marcadores de período sticky ("Março 2026", "Fevereiro 2026") separando grupos de meses
- Cards já visíveis sem precisar expandir nada

### 4. Card de registro redesenhado
- Background branco, border-radius 14px, shadow sutil
- Border-left 4px colorida por categoria (roxo=consulta, azul=exame, verde=vacina, âmbar=vermífugo, ciano=medicação, vermelho=procedimento, lilás=viagem, cinza=documento, rosa=observação)
- Linha 1: Ícone + Nome + Data + Menu (3 pontos → Editar/Excluir)
- Linha 2: Badge categoria (pill colorido) + Badge status (Realizado/Previsto/Em andamento)
- Linha 3: Informações-chave contextuais por categoria (ex: medicação mostra dosagem/frequência/período)
- Linha 4: Observações truncadas em 2 linhas com "Ver mais"
- Rodapé: Anexos como chips + link "Ver detalhes →"
- Hover: sombra maior + translateY(-1px)

### 5. Drawer de detalhes (novo)
- Ao clicar "Ver detalhes" → Drawer lateral (desktop) ou Sheet fullscreen (mobile)
- Mostra todos os campos do registro completo
- Botões Editar e Excluir no topo

### 6. Modal "Novo Registro" — sem mudanças estruturais
- Manter lógica atual de campos condicionais por categoria
- Manter integração com agenda para medicações
- A lógica de save, upload de anexo e criação de eventos na agenda permanece intacta

### 7. Animações
- Cards com `fadeUp 300ms` escalonado (delay 60ms entre itens)
- Bolinhas da timeline com `scalePop 400ms`
- Usar classes Tailwind existentes + inline styles para delays

### Sem mudanças no banco de dados
Os campos existentes em `medical_records` são suficientes. As informações contextuais (veterinário, clínica, dosagem) são extraídas do campo `notes` e `frequency` existentes.

