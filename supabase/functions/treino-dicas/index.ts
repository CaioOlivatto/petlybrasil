import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { breed, species, category, name, birthDate, allergies, healthConditions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const speciesLabel = species === "dog" ? "cachorro" : species === "cat" ? "gato" : "pet";
    const petName = name || "seu pet";

    // Calculate age
    let ageText = "";
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (months < 12) {
        ageText = `${months} ${months === 1 ? "mês" : "meses"}`;
      } else {
        const years = Math.floor(months / 12);
        const rem = months % 12;
        ageText = `${years} ${years === 1 ? "ano" : "anos"}${rem > 0 ? ` e ${rem} ${rem === 1 ? "mês" : "meses"}` : ""}`;
      }
    }

    const petContext = `
DADOS DO PET:
- Nome: ${petName}
- Espécie: ${speciesLabel}
- Raça: ${breed || "SRD"}
${ageText ? `- Idade: ${ageText}` : ""}
${allergies ? `- Alergias: ${allergies}` : "- Sem alergias conhecidas"}
${healthConditions ? `- Condições de saúde: ${healthConditions}` : "- Sem condições de saúde conhecidas"}`;

    const categoryPrompts: Record<string, string> = {
      adestramento: `Dê dicas de ADESTRAMENTO e TREINO específicas para ${petName}, um(a) ${speciesLabel} da raça ${breed}${ageText ? ` com ${ageText} de idade` : ""}. ${healthConditions ? `Leve em conta que ${petName} tem: ${healthConditions}.` : ""} Inclua:
- Comandos básicos recomendados para começar (considerando a idade)
- Técnicas de reforço positivo adequadas ao temperamento da raça
- Erros comuns no adestramento dessa raça e como evitá-los
- Frequência e duração ideal das sessões de treino para a idade atual
- Dicas de socialização`,
      saude: `Dê dicas de SAÚDE específicas para ${petName}, um(a) ${speciesLabel} da raça ${breed}${ageText ? ` com ${ageText} de idade` : ""}. ${healthConditions ? `${petName} já tem as seguintes condições: ${healthConditions}. Dê orientações específicas sobre elas.` : ""} ${allergies ? `${petName} tem alergias a: ${allergies}. Considere isso nas recomendações.` : ""} Inclua:
- Problemas de saúde mais comuns da raça
- Sinais de alerta para ficar atento na idade atual
- Frequência recomendada de check-ups veterinários
- Cuidados preventivos importantes
- Importância da vermifugação e vacinação em dia`,
      alimentacao: `Dê dicas de ALIMENTAÇÃO específicas para ${petName}, um(a) ${speciesLabel} da raça ${breed}${ageText ? ` com ${ageText} de idade` : ""}. ${allergies ? `IMPORTANTE: ${petName} tem alergias a: ${allergies}. Evite recomendar alimentos que possam causar reação.` : ""} ${healthConditions ? `${petName} tem: ${healthConditions}. Adapte as recomendações alimentares.` : ""} Inclua:
- Tipo de ração mais adequada para a idade e porte
- Quantidade e frequência de refeições para a faixa etária atual
- Alimentos naturais seguros que podem complementar
- Alimentos PROIBIDOS
- Tendência a obesidade e como prevenir
- Dicas sobre rações coadjuvantes quando necessário`,
      exercicios: `Dê dicas de EXERCÍCIOS E ATIVIDADES FÍSICAS específicas para ${petName}, um(a) ${speciesLabel} da raça ${breed}${ageText ? ` com ${ageText} de idade` : ""}. ${healthConditions ? `Leve em conta que ${petName} tem: ${healthConditions}. Adapte os exercícios se necessário.` : ""} Inclua:
- Nível de energia típico da raça
- Quantidade diária de exercício recomendada para a idade atual
- Tipos de atividades mais adequadas
- Esportes caninos recomendados
- Cuidados durante exercícios
- Adaptações específicas para a idade de ${petName}`,
      cuidados: `Dê dicas de CUIDADOS GERAIS E HIGIENE específicas para ${petName}, um(a) ${speciesLabel} da raça ${breed}${ageText ? ` com ${ageText} de idade` : ""}. ${allergies ? `${petName} tem alergias a: ${allergies}. Considere produtos hipoalergênicos.` : ""} ${healthConditions ? `${petName} tem: ${healthConditions}. Adapte os cuidados.` : ""} Inclua:
- Frequência de banho recomendada
- Cuidados com pelos
- Cuidados com orelhas
- Saúde bucal
- Cuidados com unhas
- Cuidados com olhos
- Adaptações no ambiente doméstico`,
    };

    const systemPrompt = `Você é um especialista carinhoso em cuidados com pets. Você está dando conselhos personalizados para o tutor do ${petName}.

${petContext}

CONHECIMENTO DO MANUAL DE REFERÊNCIA:
- Pets PCD precisam de exercícios adaptados, rotinas personalizadas e ambiente acessível
- Rações coadjuvantes devem ser usadas APENAS com prescrição veterinária
- Lágrima ácida é comum em pelagem clara e focinho achatado - limpar com gaze e soro fisiológico 2x/dia
- Tártaro: escovar dentes pelo menos a cada 3 dias, usar escova e pasta específicas para pets
- Vermífugos com ivermectina NÃO podem ser usados em Collie, Border Collie, Pastor de Shetland, Sheepdog, Pastor Australiano
- Frutas seguras: maçã (sem sementes), banana, melancia (sem sementes), manga, morango
- Frutas/alimentos PROIBIDOS: uva, chocolate, cebola, alho, abacate, macadâmia

REGRAS:
- Responda em português brasileiro
- SEMPRE chame o pet pelo nome "${petName}" — seja pessoal e afetuoso
- Considere a idade do pet ao dar conselhos (filhote, adulto, idoso)
- Se o pet tem alergias ou doenças, SEMPRE leve isso em conta e mencione cuidados especiais
- Seja específico para a raça mencionada
- Use linguagem acolhedora e pessoal, como se estivesse conversando com o tutor
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
