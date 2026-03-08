import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userInput } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um assistente veterinário que ajuda tutores de pets a formular perguntas para levar ao veterinário.

O tutor vai descrever sintomas, comportamentos ou preocupações sobre o pet. Sua tarefa é transformar isso em perguntas bem formuladas que o tutor possa fazer ao veterinário durante a consulta.

REGRAS IMPORTANTES:
- O tutor vai FALAR com o veterinário, então as perguntas devem ser formuladas na perspectiva do tutor falando com o vet.
- NÃO pergunte "o pet está com diarreia?" porque o tutor já sabe disso. 
- Em vez disso, formule como: "Meu pet está com diarreia, o que pode estar causando?" ou "O que devo fazer em relação à diarreia?"
- Formule perguntas práticas e acionáveis que ajudem o tutor a entender o problema e o que fazer.
- Gere entre 2 e 5 perguntas relevantes baseadas no que o tutor descreveu.
- Cada pergunta deve terminar com "?"
- Seja direto e claro, sem explicações extras.

Responda APENAS com as perguntas, uma por linha, sem numeração nem marcadores.`;

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
          { role: "user", content: userInput },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const questions = content
      .split("\n")
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 5 && q.endsWith("?"));

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("organize-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
