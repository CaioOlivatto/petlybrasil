import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  RefreshCw,
  Dog,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const CATEGORIES = [
  { id: "adestramento", label: "Adestramento", icon: GraduationCap, description: "Comandos, obediência e socialização" },
  { id: "saude", label: "Saúde", icon: HeartPulse, description: "Prevenção e cuidados veterinários" },
  { id: "alimentacao", label: "Alimentação", icon: UtensilsCrossed, description: "Dieta ideal e alimentos seguros" },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell, description: "Atividades físicas e esportes" },
  { id: "cuidados", label: "Cuidados", icon: Scissors, description: "Higiene, pelos, dentes e unhas" },
];

const Treino = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [petBreed, setPetBreed] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petName, setPetName] = useState("");
  const [petBirthDate, setPetBirthDate] = useState<string | null>(null);
  const [petAllergies, setPetAllergies] = useState<string | null>(null);
  const [petHealthConditions, setPetHealthConditions] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pets")
      .select("name, species, breed, birth_date, allergies, health_conditions")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setPetName(data.name);
          setPetSpecies(data.species);
          setPetBreed(data.breed || "SRD (Sem Raça Definida)");
          setPetBirthDate(data.birth_date);
          setPetAllergies(data.allergies);
          setPetHealthConditions(data.health_conditions);
        }
      });
  }, [user]);

  useEffect(() => {
    if (content && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [content]);

  const fetchTips = useCallback(async (category: string) => {
    if (isLoading) return;
    setSelectedCategory(category);
    setContent("");
    setIsLoading(true);

    let accumulated = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/treino-dicas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            breed: petBreed,
            species: petSpecies,
            category,
            name: petName,
            birthDate: petBirthDate,
            allergies: petAllergies,
            healthConditions: petHealthConditions,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao buscar dicas");
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setContent(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("Treino dicas error:", e);
      toast({
        title: "Erro",
        description: e.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [petBreed, petSpecies, isLoading, toast]);

  const selectedCat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Dog className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Treino & Dicas</h1>
            <p className="text-xs text-muted-foreground">
              Dicas personalizadas para {petName || "seu pet"}
              {petBreed && petBreed !== "SRD (Sem Raça Definida)" ? ` (${petBreed})` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => fetchTips(cat.id)}
              disabled={isLoading}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                ${isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                }
                ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                {cat.label}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {cat.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {!selectedCategory && !content && (
        <Card className="bg-card border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-primary/40 mb-4" />
            <p className="text-base font-semibold text-foreground mb-1">
              Escolha uma categoria acima
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              A IA irá gerar dicas personalizadas para a raça{" "}
              <span className="font-medium text-foreground">{petBreed || "do seu pet"}</span>,
              baseadas em manuais especializados.
            </p>
          </CardContent>
        </Card>
      )}

      {(content || isLoading) && selectedCat && (
        <div ref={contentRef}>
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <selectedCat.icon className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-foreground">{selectedCat.label}</h2>
                  {petBreed && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {petBreed}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchTips(selectedCategory!)}
                  disabled={isLoading}
                  className="text-muted-foreground"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Gerando..." : "Regenerar"}
                </Button>
              </div>

              <div className="prose prose-sm max-w-none text-foreground [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>ul]:my-2 [&>ol]:my-2 [&>p]:mb-2 [&>p:last-child]:mb-0">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Gerando dicas personalizadas...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center mt-4">
        ⚠️ Dicas geradas por IA com base em manuais especializados. Consulte sempre um veterinário.
      </p>
    </div>
  );
};

export default Treino;
