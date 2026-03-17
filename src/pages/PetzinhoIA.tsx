import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Send, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Qual a melhor alimentação para meu pet?",
  "Meu pet está com coceira, o que pode ser?",
  "Como ensinar comandos básicos?",
  "Quantas vezes por dia devo alimentar?",
  "Meu pet está ansioso, como acalmar?",
];

const PetzinhoIA = () => {
  const { toast } = useToast();
  const { user, hasIAAccess } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [petContext, setPetContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const [petRes, profileRes] = await Promise.all([
        supabase.from("pets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
        supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle(),
      ]);
      const pet = petRes.data;
      if (!pet) return;

      const [checkinsRes, medicalRes, vaccinesRes, agendaRes] = await Promise.all([
        supabase.from("daily_checkins").select("*").eq("pet_id", pet.id).order("date", { ascending: false }).limit(7),
        supabase.from("medical_records").select("*").eq("pet_id", pet.id).order("date", { ascending: false }).limit(20),
        supabase.from("pet_vaccinations").select("*").eq("pet_id", pet.id),
        supabase.from("agenda_events").select("*").eq("pet_id", pet.id).order("date", { ascending: true }).limit(10),
      ]);

      setPetContext({
        pet,
        tutorName: profileRes.data?.name || "",
        recentCheckins: checkinsRes.data || [],
        medicalRecords: medicalRes.data || [],
        vaccinations: vaccinesRes.data || [],
        upcomingEvents: agendaRes.data || [],
      });
    };
    fetchContext();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/petzinho-ia`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            petContext,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao conectar com a IA");
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const snapshot = assistantContent;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: snapshot } : m
                )
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("Petzinho IA error:", e);
      toast({
        title: "Erro",
        description: e.message || "Tente novamente.",
        variant: "destructive",
      });
      // Remove empty assistant msg if error
      if (!assistantContent) {
        setMessages((prev) =>
          prev.filter((_, i) => i !== prev.length - 1)
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, petContext, isLoading, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showWelcome = messages.length === 0;

  if (!hasIAAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] max-w-lg mx-auto text-center space-y-6">
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Petzinho IA é exclusivo dos planos Pro e Master</h2>
        <p className="text-muted-foreground">
          Faça upgrade do seu plano para ter acesso ao assistente inteligente que conhece tudo sobre seu pet.
        </p>
        <Button onClick={() => navigate("/assinatura")} className="bg-accent hover:bg-accent/90">
          Ver planos disponíveis
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto bg-card rounded-2xl border border-primary/20 shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary/15 flex items-center justify-center">
            <Bot className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Petlyzinho IA</h1>
            <p className="text-xs text-muted-foreground">
              Assistente de {petContext?.pet?.name || "seu pet"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-2xl font-bold text-foreground mb-1">
              Olá! Sou o Petlyzinho 🐾
            </p>
            <p className="text-muted-foreground text-sm mb-8 max-w-md">
              Estou aqui para ajudar com dúvidas sobre cuidados, alimentação,
              comportamento e bem-estar de {petContext?.pet?.name || "seu pet"}.
            </p>

            <div className="w-full max-w-md space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                ✨ Sugestões de perguntas
              </p>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground hover:border-secondary/50 hover:bg-secondary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-secondary text-secondary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                  <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - prominent */}
      <div className="bg-background border-2 border-secondary/40 rounded-2xl p-3 shadow-md">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva aqui sua dúvida sobre seu pet..."
            className="min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/70"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-12 w-12 rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        ⚠️ Esta orientação é educativa e não substitui a avaliação presencial de
        um médico veterinário.
      </p>
    </div>
  );
};

export default PetzinhoIA;
