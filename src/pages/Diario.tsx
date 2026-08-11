import { useState, useMemo, useEffect, useCallback } from "react";
import { startOfDay, startOfWeek, startOfMonth, isAfter, format, subDays } from "date-fns";
import { BookOpen, Zap, UtensilsCrossed, Moon, Heart, Droplets, Footprints, Brain, RefreshCw, Save } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePrimaryPet } from "@/hooks/useAccountData";

type CheckInData = {
  energia: string;
  apetite: string;
  sono: string;
  humor: string;
  alteracoes: string[];
  passeio: boolean | null;
  passeioQuantidade: number;
  passeioDuracao: string;
  atividadeMental: boolean | null;
  mudancaRotina: string;
  observacoes: string;
  convulsao: boolean;
  convulsaoQuantidade: number;
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
  { value: "viagem", label: "Viagem" },
  { value: "ambiente", label: "Mudança de ambiente" },
  { value: "horarios", label: "Alteração de horários" },
  { value: "menos_passeios", label: "Menos passeios" },
  { value: "mais_passeios", label: "Mais passeios" },
  { value: "ausencia_tutor", label: "Ausência do tutor" },
  { value: "muitas_pessoas", label: "Muitas pessoas em casa" },
  { value: "outro", label: "Outro" },
];

const Diario = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: pet } = usePrimaryPet(user?.id);
  const [checkIn, setCheckIn] = useState<CheckInData>({
    energia: "",
    apetite: "",
    sono: "",
    humor: "",
    alteracoes: [],
    passeio: null,
    passeioQuantidade: 0,
    passeioDuracao: "",
    atividadeMental: null,
    mudancaRotina: "nenhuma",
    observacoes: "",
    convulsao: false,
    convulsaoQuantidade: 0,
  });

  const [historyFilter, setHistoryFilter] = useState<"hoje" | "semana" | "mes" | "historico">("historico");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!user || !pet) return;
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("date, energia, apetite, sono, humor, alteracoes, passeio, passeio_quantidade, passeio_duracao, atividade_mental, mudanca_rotina, observacoes, convulsao, convulsao_quantidade")
      .eq("pet_id", pet.id)
      .order("date", { ascending: false })
      .limit(31);

    if (error) {
      toast({ title: "Erro ao carregar o histórico", description: error.message, variant: "destructive" });
    } else if (data) {
      setHistory(
        data.map((row: any) => ({
          date: new Date(row.date + "T12:00:00"),
          energia: row.energia || "",
          apetite: row.apetite || "",
          sono: row.sono || "",
          humor: row.humor || "",
          alteracoes: row.alteracoes || [],
          passeio: row.passeio,
          passeioQuantidade: row.passeio_quantidade || 0,
          passeioDuracao: row.passeio_duracao || "",
          atividadeMental: row.atividade_mental,
          mudancaRotina: row.mudanca_rotina || "nenhuma",
          observacoes: row.observacoes || "",
          convulsao: row.convulsao || false,
          convulsaoQuantidade: row.convulsao_quantidade || 0,
        }))
      );
    }
  }, [user, pet, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "historico") return history;
    const now = new Date();
    let start: Date;
    if (historyFilter === "hoje") {
      start = startOfDay(now);
    } else if (historyFilter === "semana") {
      start = startOfWeek(now, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(now);
    }
    return history.filter((entry) => isAfter(entry.date, start) || startOfDay(entry.date).getTime() === start.getTime());
  }, [history, historyFilter]);

  const toggleAlteracao = (value: string) => {
    setCheckIn((prev) => ({
      ...prev,
      alteracoes: prev.alteracoes.includes(value)
        ? prev.alteracoes.filter((a) => a !== value)
        : [...prev.alteracoes, value],
    }));
  };

  const handleSave = async () => {
    if (!checkIn.energia || !checkIn.apetite || !checkIn.sono || !checkIn.humor) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Energia, Apetite, Sono e Humor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !pet) return;
    setSaving(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const payload = {
      user_id: user.id,
      pet_id: pet.id,
      date: today,
      energia: checkIn.energia,
      apetite: checkIn.apetite,
      sono: checkIn.sono,
      humor: checkIn.humor,
      alteracoes: checkIn.alteracoes,
      passeio: checkIn.passeio,
      passeio_quantidade: checkIn.passeio ? checkIn.passeioQuantidade : 0,
      passeio_duracao: checkIn.passeio ? checkIn.passeioDuracao || null : null,
      atividade_mental: checkIn.atividadeMental,
      mudanca_rotina: checkIn.mudancaRotina,
      observacoes: checkIn.observacoes,
      convulsao: checkIn.convulsao,
      convulsao_quantidade: checkIn.convulsao ? checkIn.convulsaoQuantidade : 0,
    };

    const { error } = await supabase
      .from("daily_checkins")
      .upsert(payload as any, { onConflict: "pet_id,date" });

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCheckIn({
      energia: "",
      apetite: "",
      sono: "",
      humor: "",
      alteracoes: [],
      passeio: null,
      passeioQuantidade: 0,
      passeioDuracao: "",
      atividadeMental: null,
      mudancaRotina: "nenhuma",
      observacoes: "",
      convulsao: false,
      convulsaoQuantidade: 0,
    });
    toast({
      title: "Check-in salvo! 🐾",
      description: "O registro de hoje foi salvo com sucesso.",
    });
    fetchHistory();
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
          <BookOpen className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Diário do Pet</h1>
        </div>
        <p className="text-muted-foreground">Como seu pet está hoje?</p>
      </div>

      {/* Check-in de hoje */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Check-in de hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Energia */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Energia</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.energia.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, energia: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.energia === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background hover:border-primary/40"
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
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Apetite</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.apetite.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, apetite: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.apetite === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background hover:border-primary/40"
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
              <Moon className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Sono</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {emojiOptions.sono.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, sono: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.sono === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background hover:border-primary/40"
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
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Humor</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {emojiOptions.humor.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCheckIn((p) => ({ ...p, humor: opt.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    checkIn.humor === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background hover:border-primary/40"
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
              <Droplets className="h-4 w-4 text-primary" />
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
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background hover:border-primary/40"
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
              <Footprints className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Passeio hoje?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Sim" },
                { value: false, label: "Não" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCheckIn((p) => ({ ...p, passeio: opt.value, passeioQuantidade: opt.value ? Math.max(p.passeioQuantidade, 1) : 0, passeioDuracao: opt.value ? p.passeioDuracao : "" }))}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    checkIn.passeio === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {checkIn.passeio && (
              <div className="mt-3 space-y-3 p-3 rounded-xl border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Quantos passeios?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCheckIn((p) => ({ ...p, passeioQuantidade: Math.max(1, p.passeioQuantidade - 1) }))}
                      className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >−</button>
                    <span className="text-lg font-bold text-primary min-w-[2rem] text-center">{checkIn.passeioQuantidade}</span>
                    <button
                      onClick={() => setCheckIn((p) => ({ ...p, passeioQuantidade: p.passeioQuantidade + 1 }))}
                      className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >+</button>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground block mb-1">Duração (opcional)</span>
                  <div className="flex flex-wrap gap-2">
                    {["15 min", "30 min", "45 min", "1h", "1h30", "2h+"].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setCheckIn((p) => ({ ...p, passeioDuracao: p.passeioDuracao === dur ? "" : dur }))}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          checkIn.passeioDuracao === dur
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >{dur}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Atividade Mental */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
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
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Convulsão */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <span className="font-medium text-foreground">Teve convulsão?</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Sim" },
                { value: false, label: "Não" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCheckIn((p) => ({ ...p, convulsao: opt.value, convulsaoQuantidade: opt.value ? Math.max(p.convulsaoQuantidade, 1) : 0 }))}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    checkIn.convulsao === opt.value
                      ? opt.value
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {checkIn.convulsao && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-xl border-2 border-destructive/30 bg-destructive/5">
                <span className="text-sm font-medium text-foreground">Quantas vezes?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCheckIn((p) => ({ ...p, convulsaoQuantidade: Math.max(1, p.convulsaoQuantidade - 1) }))}
                    className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-destructive min-w-[2rem] text-center">{checkIn.convulsaoQuantidade}</span>
                  <button
                    onClick={() => setCheckIn((p) => ({ ...p, convulsaoQuantidade: p.convulsaoQuantidade + 1 }))}
                    className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mudança na rotina */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-primary" />
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

           <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
             <Save className="h-4 w-4 mr-2" />
             {saving ? "Salvando..." : "Salvar check-in"}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Histórico de check-ins</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {([
              { value: "hoje", label: "Hoje" },
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mês" },
              { value: "historico", label: "Histórico" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHistoryFilter(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  historyFilter === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-2xl bg-background">
              <EmptyState
                icon={BookOpen}
                title={historyFilter === "hoje" ? "Nenhum check-in hoje" : "Nenhum registro encontrado"}
                description={historyFilter === "hoje" ? "Preencha o check-in acima para registrar o dia de hoje." : "Nenhum registro encontrado neste período."}
              />
            </div>
          ) : (
            filteredHistory.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.06, 0.3) }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-foreground">
                        {format(entry.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </span>
                      {(entry.alteracoes.length > 0 || entry.convulsao) && (
                        <div className="flex gap-1">
                          {entry.convulsao && (
                            <Badge variant="destructive" className="text-xs">
                              ⚡ Convulsão ({entry.convulsaoQuantidade}x)
                            </Badge>
                          )}
                          {entry.alteracoes.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              ⚠ Alterações
                            </Badge>
                          )}
                        </div>
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
                        {entry.passeio 
                          ? `🐕 ${entry.passeioQuantidade || 1}x passeio${entry.passeioDuracao ? ` (${entry.passeioDuracao})` : ""}` 
                          : "Sem passeio"}
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
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Diario;
