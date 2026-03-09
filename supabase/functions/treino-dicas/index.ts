import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { breed, species, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const speciesLabel = species === "dog" ? "cachorro" : species === "cat" ? "gato" : "pet";

    const categoryPrompts: Record<string, string> = {
      adestramento: `Dê dicas de ADESTRAMENTO e TREINO específicas para a raça ${breed} (${speciesLabel}). Inclua:
- Comandos básicos recomendados para começar
- Técnicas de reforço positivo adequadas ao temperamento da raça
- Erros comuns no adestramento dessa raça e como evitá-los
- Frequência e duração ideal das sessões de treino
- Dicas de socialização`,
      saude: `Dê dicas de SAÚDE específicas para a raça ${breed} (${speciesLabel}). Inclua:
- Problemas de saúde mais comuns da raça (displasia, problemas cardíacos, oculares, etc.)
- Sinais de alerta para ficar atento
- Frequência recomendada de check-ups veterinários
- Cuidados preventivos importantes
- Importância da vermifugação e vacinação em dia`,
      alimentacao: `Dê dicas de ALIMENTAÇÃO específicas para a raça ${breed} (${speciesLabel}). Inclua:
- Tipo de ração mais adequada (considere porte e nível de atividade)
- Quantidade e frequência de refeições por faixa etária
- Alimentos naturais seguros que podem complementar (tomate maduro, cenoura, maçã sem sementes, etc.)
- Alimentos PROIBIDOS (uva, chocolate, cebola, alho, etc.)
- Tendência a obesidade e como prevenir
- Dicas sobre rações coadjuvantes quando necessário (hipoalergênica, renal, etc. - sempre com orientação veterinária)`,
      exercicios: `Dê dicas de EXERCÍCIOS E ATIVIDADES FÍSICAS específicas para a raça ${breed} (${speciesLabel}). Inclua:
- Nível de energia típico da raça
- Quantidade diária de exercício recomendada (minutos e quilômetros)
- Tipos de atividades mais adequadas ao temperamento
- Esportes caninos recomendados
- Cuidados durante exercícios (hidratação, temperatura, superfícies)
- Adaptações para filhotes e idosos`,
      cuidados: `Dê dicas de CUIDADOS GERAIS E HIGIENE específicas para a raça ${breed} (${speciesLabel}). Inclua:
- Frequência de banho recomendada
- Cuidados com pelos (escovação, tosa)
- Cuidados com orelhas (especialmente para raças de orelhas longas)
- Saúde bucal (escovação de dentes, prevenção de tártaro)
- Cuidados com unhas
- Cuidados com olhos (lágrima ácida se aplicável)
- Adaptações no ambiente doméstico`,
    };

    const systemPrompt = `Você é um especialista em cuidados com pets, com conhecimento profundo sobre raças de cães e gatos.

CONHECIMENTO DO MANUAL DE REFERÊNCIA:
- Pets PCD precisam de exercícios adaptados, rotinas personalizadas e ambiente acessível
- Rações coadjuvantes (hipoalergênica, renal, diabéticos, obesos, urinária, hepática, gastrointestinal, articular, neurológica) devem ser usadas APENAS com prescrição veterinária
- Lágrima ácida (Cromodacriorreia) é comum em pelagem clara e focinho achatado (Shih-Tzu, Lhasa Apso, Poodle, Persa) - limpar com gaze e soro fisiológico 2x/dia
- Tártaro: escovar dentes pelo menos a cada 3 dias, usar escova e pasta específicas para pets (NUNCA usar pasta humana com flúor)
- Vermifugação: comprimidos, líquidos ou pasta. Vermífugos com ivermectina NÃO podem ser usados em Collie, Border Collie, Pastor de Shetland, Sheepdog, Pastor Australiano
- Cachorro pode comer tomate MADURO com moderação (nunca verde, folhas ou caule - contém solanina/glicoalcalóide tóxicos)
- Frutas seguras: maçã (sem sementes), banana, melancia (sem sementes), manga, morango
- Frutas/alimentos PROIBIDOS: uva, chocolate, cebola, alho, abacate, macadâmia

CONHECIMENTO DE RAÇAS:
- Basset Hound: calmo, faro apurado, orelhas longas (limpar regularmente), propenso a torção gástrica, doença de Von Willebrand, hipotireoidismo. 30min/dia exercício.
- Cavalier King Charles Spaniel: gentil, carinhoso, propenso a sopro no coração (usar arnês, não coleira), displasia quadril, trombocitopenia. Escovar a cada 2 dias. 30min/dia exercício.
- Akita: leal, protetor, independente, adora neve/frio. Precisa socialização intensa desde filhote. Exercício moderado a alto.
- Beagle: energético, teimoso, faro excepcional, propenso a obesidade, displasia quadril, hipotireoidismo. Late muito. 60min/dia exercício (16km/semana). Treinar desde filhote.
- Border Collie: mais inteligente do mundo, pastoreio instintivo, muita energia. Pode ter ansiedade de separação. Escovar pelo diariamente. Displasia quadril, problemas oculares.

REGRAS:
- Responda em português brasileiro
- Seja específico para a raça mencionada
- Use linguagem acolhedora mas profissional
- Organize com subtítulos e listas quando apropriado
- Máximo 500 palavras
- Sempre recomende consultar veterinário para questões de saúde
- Use emojis com moderação (2-3 no máximo)
- Se não conhecer a raça específica, dê dicas gerais para o tipo de animal`;

    const userPrompt = categoryPrompts[category] || categoryPrompts.adestramento;

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
          { role: "user", content: userPrompt },
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
    console.error("treino-dicas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
