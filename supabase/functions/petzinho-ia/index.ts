import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWLEDGE_BASE = `
=== BASE DE CONHECIMENTO PETLY ===

## PETS PCD (COM DEFICIÊNCIA)
- Pets PCD têm o mesmo potencial de amor e felicidade. Precisam de exercícios adaptados às suas limitações.
- Para mobilidade reduzida: caminhadas curtas em superfícies macias, natação supervisionada.
- Adaptações no ambiente: rampas, tapetes antiderrapantes, espaços seguros com objetos familiares.
- Acessórios: cadeiras de rodas personalizadas, próteses, colares vibratórios para surdos, brinquedos adaptativos.
- Suporte emocional é essencial: ambiente calmo e acolhedor.

## RAÇÃO COADJUVANTE (TERAPÊUTICA)
- NÃO contém medicamentos. Formulação balanceada para necessidades específicas.
- Deve ser prescrita APENAS por veterinário. Não deve ser dada a animais saudáveis.
- Tipos: hipoalergênica, renal (baixa proteína), diabéticos (baixo carboidrato), obesos (saciedade), urinária (controle pH), hepática (proteína vegetal), gastrointestinal, articular (glicosamina + Ômega 3), neurológica.

## LÁGRIMA ÁCIDA (CROMODACRIORREIA)
- Alteração no sistema nasolacrimal. Mais comum em pelagem clara e focinhos achatados (Shih-Tzu, Lhasa Apso, Pequinês, Buldogue, Poodle, Persa).
- Causas: obstrução do canal, traumas, infecções, excesso de pelos, tártaro, doenças congênitas.
- Tratamento: identificar causa com veterinário. Limpeza com gaze e soro fisiológico 2x ao dia.
- Alimentação natural sem corantes/conservantes pode ajudar.

## TÁRTARO EM CÃES E GATOS
- Acúmulo de bactérias por restos de comida. Pode causar mau hálito, gengivas vermelhas, dor ao comer, perda de apetite.
- Tratamento: limpeza dentária profissional (com anestesia).
- Prevenção: escovação a cada 3 dias (mínimo). Pasta e escova específicas para pets (flúor é TÓXICO).
- Petiscos dentários complementam mas NÃO substituem escovação.

## VERMIFUGAÇÃO
- Tipos: comprimidos (mais comuns, palatáveis como Top Dog), líquidos (suspensão oral, ação rápida), pasta (fácil administração).
- ATENÇÃO: vermífugos com ivermectina NÃO podem ser dados a Collie, Border Collie, Pastor de Shetland, Sheepdog, Pastor Australiano e seus cruzamentos, nem filhotes < 6 meses.
- Alguns antipulgas podem atuar contra vermes específicos (Dipylidium caninum).
- Sempre consultar veterinário antes de medicar.

## ALIMENTAÇÃO - TOMATE
- Cachorro PODE comer tomate maduro com moderação. NUNCA verde (contém glicoalcalóide tóxico).
- Partes tóxicas: caule, folhas, fruto verde (solanina).
- Benefícios do maduro: vitaminas B, A, C, antioxidantes, fibras, minerais.
- Molho: pode caseiro sem temperos. Industrializado NÃO.

## ALIMENTOS SEGUROS PARA CÃES
- Legumes (cozidos, sem tempero): quiabo, chuchu, beterraba, cenoura, abóbora, batata-doce, brócolis, abobrinha, espinafre.
- Frutas (sem casca/caroço/sementes): banana, maçã, manga, melancia, morango, mamão, goiaba.
- NUNCA: uva/uva passa (problemas renais), chocolate, alimentos com tempero.

## DEPRESSÃO EM CÃES
- Sintomas: apatia, coceira excessiva, isolamento, agressividade, perda de apetite, ausência de energia, automutilação, negação de carinho.
- Causas: mudança de rotina, perda de dono, novo animal, mudança de casa, maus-tratos, falta de passeios.
- Tratamento: acompanhamento veterinário, possível uso de antidepressivos/homeopatia, atividades físicas, passeios ao ar livre.
- Prevenção: dar atenção, passeios regulares, adaptação gradual a mudanças.

## FOCINHO DE CACHORRO
- Funções: respiração, regulação de temperatura, olfato (300 milhões de células vs 5 milhões em humanos).
- Focinho seco com descamação: possível problema respiratório → veterinário.
- Focinho quente + animal quieto: levar ao veterinário.
- Focinho gelado + ofegante sem exercício: provavelmente regulando temperatura (normal).
- Raças braquicefálicas (pugs) podem ter olfato menos apurado.

## MORDIDA DE CACHORRO
- Primeiros socorros: lavar com água e sabão, pressionar ferimento, procurar atendimento médico.
- Risco de raiva e infecções. Sempre verificar vacinação do animal.

## GUIA DE SAÚDE GERAL
- Check-ups regulares com veterinário são essenciais.
- Manter vacinas e vermifugação em dia.
- Alimentação de qualidade (ração premium ou super premium).
- Atenção a mudanças de comportamento, apetite e humor.

=== RAÇAS DE CACHORRO ===

## BASSET HOUND
- Origem: França. Peso: 18-30kg. Altura: 58-68cm. Vida: 12-13 anos.
- Temperamento: inteligente, bem-humorado, adora brincar, não gosta de solidão. Bom com crianças e outros cães.
- Não late muito, mas uiva se ficar sozinho. Pode ser destruidor se ansioso.
- Cuidados: banho a cada 15 dias (casa) ou mensal (apto). Escovação semanal. Limpar rosto frequentemente (babador). Escovar dentes mensalmente. Monitorar orelhas.
- Saúde: torção gástrica, doença de Von Willebrand, hipotireoidismo.
- Exercícios: 30 min/dia, ~1,5km.

## CAVALIER KING CHARLES SPANIEL
- Origem: Reino Unido. Peso: 6-8kg. Altura: 30-33cm. Vida: 12-15 anos.
- Temperamento: amável, tolerante, gentil, brincalhão. Ótimo cão de terapia. Muito apegado a pessoas.
- Não late muito, mais de uivar/chorar. Não destruidor se bem cuidado.
- Cuidados: escovação a cada 2 dias. Banho mensal. Limpar orelhas semanalmente. Escovar dentes 3x/semana. Usar arnês (não coleira) por propensão a sopro cardíaco.
- Saúde: displasia de quadril, sopro no coração, trombocitopenia.
- Exercícios: 30 min/dia, ~10km/semana.

## AKITA INU
- Origem: Japão. Peso: 32-59kg. Altura: 61-71cm. Vida: 10-13 anos.
- Temperamento: leal, protetor, brincalhão, inteligente. Precisa de treinamento com paciência. Não recomendado para iniciantes.
- Reservado com estranhos. Pode ter dificuldade com outros animais (instinto caçador).
- Cuidados: come bastante (2x/dia). Banho só quando necessário. Escovação diária. Cortar unhas e escovar dentes regularmente. Atenção especial aos olhos.
- Saúde: displasia de quadril, atrofia da retina, torção gástrica (GDV).
- Exercícios: ~60 min/dia, ~13km/semana.

## BEAGLE
- Origem: Inglaterra/EUA. Peso: 9-13,5kg. Altura: 33-38cm. Vida: 10-15 anos.
- Temperamento: alegre, aventureiro, farejador nato. Teimoso, treinamento desafiador mas necessário. Adora comer (tendência a obesidade).
- Late/uiva bastante. Pode ser destruidor se entediado. Muito agitado.
- Cuidados: treinamento desde filhote. Escovação semanal. Banho a cada 4-6 semanas. Precisa de ar livre e caminhadas longas.
- Saúde: displasia de quadril, problemas cardíacos, hipotireoidismo.
- Exercícios: 60 min/dia, ~16km/semana.

## BORDER COLLIE
- Origem: Grã-Bretanha. Peso: 12-20kg. Altura: 46-56cm. Vida: 10-17 anos.
- Temperamento: o cão mais inteligente do mundo (ranking Stanley Coren). Atlético, obediente, protetor. Pode ter ansiedade de separação.
- Late quando necessário (se adestrado). Pode ser ansioso/destruidor se negligenciado.
- Cuidados: dieta calórica (alto gasto energético). Banho mensal. Escovação diária. Precisa de muita estimulação física e mental.
- Saúde: displasia de quadril, atrofia progressiva da retina, problemas dentários.
- Exercícios: 90 min/dia, ~20km/semana.

## CHIHUAHUA
- Origem: México. Peso: 1-3kg. Altura: 15-23cm. Vida: 12-20 anos.
- Menor raça do mundo. Inteligente, leal, animado, atrevido. Pode ser temperamental.
- Não late muito (no geral). Pode ser destruidor filhote. Muito agitado apesar do tamanho.
- Cuidados: banho mensal. Escovação semanal. Escovar dentes diariamente (propensão a problemas dentários). Muito sensível ao frio (precisa de roupinhas).
- Saúde: luxação da patela, infecções em ouvidos/dentes/olhos. Geralmente muito saudável e longevo.
- Exercícios: 30 min/dia, ~9km/semana.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, petName, petSpecies } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const speciesLabel = petSpecies === "dog" ? "cachorro" : petSpecies === "cat" ? "gato" : "pet";

    const systemPrompt = `Você é o Petlyzinho, um assistente veterinário virtual especializado em cães e gatos. Você é carinhoso, profissional e direto.

CONTEXTO: O tutor tem um ${speciesLabel} chamado ${petName || "pet"}.

REGRAS FUNDAMENTAIS DE VERACIDADE:
- NUNCA invente, fabrique ou alucine informações. Se não souber a resposta com certeza, diga claramente "Não tenho certeza sobre isso" ou "Não possuo informação suficiente para responder com segurança".
- Baseie TODAS as respostas prioritariamente na BASE DE CONHECIMENTO fornecida abaixo e em conhecimento veterinário consolidado e amplamente aceito.
- Quando a informação estiver na base de conhecimento, use-a como fonte principal.
- NUNCA cite estudos, artigos, livros ou fontes específicas a menos que tenha certeza absoluta de que existem.
- Se a pergunta estiver fora do seu conhecimento E fora da base de conhecimento, recomende que o tutor consulte um veterinário presencialmente.
- Prefira dizer "não sei" a dar uma resposta potencialmente incorreta.

REGRAS DE RESPOSTA:
- Responda de forma CURTA e OBJETIVA (máximo 3-4 parágrafos).
- Use linguagem acolhedora mas profissional.
- Para sintomas leves (coceira ocasional, alimentação, comportamento normal), dê orientações básicas.
- Para QUALQUER sintoma que possa indicar algo grave (vômito persistente, sangramento, letargia, convulsões, dificuldade respiratória, etc.), SEMPRE recomende buscar um veterinário presencialmente.
- Nunca faça diagnósticos definitivos. Use expressões como "pode indicar", "é possível que".
- Termine respostas sobre saúde com um lembrete gentil de que você não substitui uma consulta veterinária quando apropriado.
- Pode responder sobre: alimentação, comportamento, cuidados básicos, higiene, exercícios, socialização.
- Use emojis com moderação (1-2 por resposta no máximo).
- Sempre chame o pet pelo nome "${petName}" quando relevante.

${KNOWLEDGE_BASE}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("petzinho-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
