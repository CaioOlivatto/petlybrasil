import { useState } from "react";
import { BookOpen, Zap, UtensilsCrossed, Moon, Heart, Droplets, Footprints, Brain, RefreshCw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CheckInData = {
  energia: string;
  apetite: string;
  sono: string;
  humor: string;
  alteracoes: string[];
  passeio: boolean | null;
  atividadeMental: boolean | null;
  mudancaRotina: string;
  observacoes: string;
};

type HistoryEntry = CheckInData & {
  date: Date;
};

const emojiOptions = {
  energia: [
    { value: "baixa", emoji: "😓", label: "Baixa" },
    { value: "normal", emoji: "😊", label: "Normal" },
    { value: "alta", emoji: "🤩", label: "Alta" },
  ],
  apetite: [
    { value: "baixo", emoji: "😟", label: "Baixo" },
    { value: "normal", emoji: "😊", label: "Normal" },
    { value: "alto", emoji: "😋", label: "Alto" },
  ],
  sono: [
    { value: "ruim", emoji: "😣", label: "Ruim" },
    { value: "normal", emoji: "😊", label: "Normal" },
    { value: "otimo", emoji: "🥰", label: "Ótimo" },
  ],
  humor: [
    { value: "calmo", emoji: "😌", label: "Calmo" },
    { value: "ansioso", emoji: "😰", label: "Ansioso" },
    { value: "irritado", emoji: "😠", label: "Irritado" },
    { value: "brincalhao", emoji: "😜", label: "Brincalhão" },
  ],
};

const alteracoesOptions = [
  { value: "diarreia", emoji: "💩", label: "Diarreia" },
  { value: "constipacao", emoji: "🚫", label: "Constipação" },
  { value: "sangue_fezes", emoji: "🔴", label: "Sangue nas fezes" },
  { value: "urina_escura", emoji: "🟤", label: "Urina escura" },
  { value: "urina_frequente", emoji: "💧", label: "Urina frequente" },
  { value: "sangue_urina", emoji: "🔴", label: "Sangue na urina" },
  { value: "vomito", emoji: "🤢", label: "Vômito" },
];

const mudancaOptions = [
  { value: "nenhuma", label: "Não houve mudança" },
  { value: "alimentacao", label: "Mudança na alimentação" },
  { value: "ambiente", label: "Mudança de ambiente" },
  { value: "medicacao", label: "Nova medicação" },
  { value: "outro", label: "Outro" },
];

const Diario = () => {
  const { toast } = useToast();
  const [checkIn, setCheckIn] = useState<CheckInData>({
    energia: "",
    apetite: "",
    sono: "",
    humor: "",
    alteracoes: [],
    passeio: null,
    atividadeMental: null,
    mudancaRotina: "nenhuma",
    observacoes: "",
  });

  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      date: new Date(Date.now() - 86400000),
      energia: "normal",
      apetite: "alto",
      sono: "otimo",
      humor: "brincalhao",
      alteracoes: [],
      passeio: true,
      atividadeMental: true,
      mudancaRotina: "nenhuma",
      observacoes: "Dia tranquilo, brincou bastante no parque.",
    },
    {
      date: new Date(Date.now() - 172800000),
      energia: "baixa",
      apetite: "baixo",
      sono: "ruim",
      humor: "calmo",
      alteracoes: ["vomito"],
      passeio: false,
      atividadeMental: false,
      mudancaRotina: "alimentacao",
      observacoes: "Vomitou após trocar a ração. Monitorando.",
    },
  ]);

  const toggleAlteracao = (value: string) => {
    setCheckIn((prev) => ({
      ...prev,
      alteracoes: prev.alteracoes.includes(value)
        ? prev.alteracoes.filter((a) => a !== value)
        : [...prev.alteracoes, value],
    }));
  };

  const handleSave = () => {
    if (!checkIn.energia || !checkIn.apetite || !checkIn.sono || !checkIn.humor) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Energia, Apetite, Sono e Humor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: HistoryEntry = { ...checkIn, date: new Date() };
    setHistory((prev) => [newEntry, ...prev]);
    setCheckIn({
      energia: "",
      apetite: "",
      sono: "",
      humor: "",
      alteracoes: [],
      passeio: null,
      atividadeMental: null,
      mudancaRotina: "nenhuma",
      observacoes: "",
    });
    toast({
      title: "Check-in salvo! 🐾",
      description: "O registro de hoje foi salvo com sucesso.",
    });
  };

  const getEmojiForValue = (category: keyof typeof emojiOptions, value: string) => {
    const option = emojiOptions[category]?.find((o) => o.value === value);
    return option ? `${option.emoji} ${option.label}` : "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-7 w-7 text-secondary" />
          <h1 className="text-2xl font-bold text-foreground">Diário do Pet</h1>
        </div>
        <p className="text-muted-foreground">Como Lilly está hoje?</p>
      </div>

      {/* Check-in de hoje */}
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Check-in de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Energia */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Energia</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.energia.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, energia: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.energia === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary font-semibold"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Apetite */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Apetite</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.apetite.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, apetite: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.apetite === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary font-semibold"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sono */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Sono</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.sono.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, sono: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.sono === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary font-semibold"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Humor */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Humor</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {emojiOptions.humor.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, humor: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.humor === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary font-semibold"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Alterações de fezes e urina */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Alteração de fezes e urina</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Selecione se houve alguma alteração (pode marcar várias)</p>
            <div className="flex flex-wrap gap-2">
              {alteracoesOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleAlteracao(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-sm ${
                    checkIn.alteracoes.includes(opt.value)
                      ? "border-secondary bg-secondary/10 text-secondary font-medium"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Passeio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Footprints className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Passeio hoje?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Sim" },
                { value: false, label: "Não" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCheckIn((p) => ({ ...p, passeio: opt.value }))}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    checkIn.passeio === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Atividade Mental */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Atividade mental?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Sim" },
                { value: false, label: "Não" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCheckIn((p) => ({ ...p, atividadeMental: opt.value }))}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    checkIn.atividadeMental === opt.value
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border bg-background hover:border-secondary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mudança na rotina */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-secondary" />
              <span className="font-medium text-foreground">Mudança na rotina?</span>
            </div>
            <Select
              value={checkIn.mudancaRotina}
              onValueChange={(v) => setCheckIn((p) => ({ ...p, mudancaRotina: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {mudancaOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <span className="font-medium text-foreground block mb-2">Observações (opcional)</span>
            <Textarea
              placeholder="Algo que você queira registrar..."
              value={checkIn.observacoes}
              onChange={(e) => setCheckIn((p) => ({ ...p, observacoes: e.target.value }))}
              className="max-h-32"
              maxLength={500}
            />
          </div>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Salvar check-in
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Histórico de check-ins</h2>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum check-in registrado ainda.</p>
          ) : (
            history.map((entry, idx) => (
              <Card key={idx} className="bg-background border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-foreground">
                      {format(entry.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                    {entry.alteracoes.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        ⚠ Alterações
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Energia</span>
                      <span>{getEmojiForValue("energia", entry.energia)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Apetite</span>
                      <span>{getEmojiForValue("apetite", entry.apetite)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Sono</span>
                      <span>{getEmojiForValue("sono", entry.sono)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Humor</span>
                      <span>{getEmojiForValue("humor", entry.humor)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-md ${entry.passeio ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {entry.passeio ? "🐕 Passeou" : "Sem passeio"}
                    </span>
                    <span className={`px-2 py-1 rounded-md ${entry.atividadeMental ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                      {entry.atividadeMental ? "🧠 Atividade mental" : "Sem atividade mental"}
                    </span>
                  </div>
                  {entry.alteracoes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.alteracoes.map((a) => {
                        const alt = alteracoesOptions.find((o) => o.value === a);
                        return (
                          <Badge key={a} variant="outline" className="text-xs border-destructive/30 text-destructive">
                            {alt?.emoji} {alt?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {entry.observacoes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">"{entry.observacoes}"</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Diario;
