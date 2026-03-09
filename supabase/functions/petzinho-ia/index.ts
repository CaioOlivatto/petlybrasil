import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
- NUNCA invente, fabrique ou alucinação informações. Se não souber a resposta com certeza, diga claramente "Não tenho certeza sobre isso" ou "Não possuo informação suficiente para responder com segurança".
- Baseie TODAS as respostas em conhecimento veterinário consolidado e amplamente aceito.
- NUNCA cite estudos, artigos, livros ou fontes específicas a menos que tenha certeza absoluta de que existem.
- Se a pergunta estiver fora do seu conhecimento, recomende que o tutor consulte um veterinário presencialmente.
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
- Sempre chame o pet pelo nome "${petName}" quando relevante.`;

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
