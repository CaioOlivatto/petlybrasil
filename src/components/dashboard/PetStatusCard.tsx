import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, UtensilsCrossed, Moon, Heart, ClipboardEdit } from "lucide-react";
import { subDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type MetricKey = "energia" | "apetite" | "sono" | "humor";
type CheckinMetrics = Pick<Database["public"]["Tables"]["daily_checkins"]["Row"], MetricKey>;
type MetricConfig = { key: MetricKey; label: string; icon: typeof Zap; color: string; values: Record<string, number>; labels: Record<string, string> };

interface Props {
  petName: string;
  petId: string;
}

const metricConfig: MetricConfig[] = [
  { key: "energia", label: "Energia", icon: Zap, color: "bg-amber-400", values: { baixa: 33, normal: 66, alta: 100 }, labels: { baixa: "Baixa", normal: "Normal", alta: "Alta" } },
  { key: "apetite", label: "Apetite", icon: UtensilsCrossed, color: "bg-amber-400", values: { baixo: 33, normal: 66, alto: 100 }, labels: { baixo: "Baixo", normal: "Normal", alto: "Alto" } },
  { key: "sono", label: "Sono", icon: Moon, color: "bg-amber-400", values: { ruim: 33, normal: 66, otimo: 100 }, labels: { ruim: "Ruim", normal: "Normal", otimo: "Ótimo" } },
  { key: "humor", label: "Humor", icon: Heart, color: "bg-green-500", values: { irritado: 25, ansioso: 50, calmo: 75, brincalhao: 100 }, labels: { irritado: "Irritado", ansioso: "Ansioso", calmo: "Calmo", brincalhao: "Brincalhão" } },
];

type Period = "hoje" | "7dias" | "30dias";

export function PetStatusCard({ petName, petId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [period, setPeriod] = useState<Period>("hoje");
  const [metrics, setMetrics] = useState<Record<string, { value: number; label: string }>>({});
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    let query = supabase
      .from("daily_checkins")
      .select("energia, apetite, sono, humor, date")
      .eq("pet_id", petId);

    if (period === "hoje") {
      query = query.eq("date", today);
    } else if (period === "7dias") {
      query = query.gte("date", format(subDays(new Date(), 6), "yyyy-MM-dd")).lte("date", today);
    } else {
      query = query.gte("date", format(subDays(new Date(), 29), "yyyy-MM-dd")).lte("date", today);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      setHasData(false);
      setMetrics({});
      setLoading(false);
      return;
    }

    setHasData(true);
    const result: Record<string, { value: number; label: string }> = {};

    for (const metric of metricConfig) {
      const valuesMap = metric.values as Record<string, number>;
      const labelsMap = metric.labels as Record<string, string>;

      if (period === "hoje") {
        const raw = (data[0] as CheckinMetrics)[metric.key];
        if (raw && valuesMap[raw] !== undefined) {
          result[metric.key] = { value: valuesMap[raw], label: labelsMap[raw] || raw };
        } else {
          result[metric.key] = { value: 0, label: "—" };
        }
      } else {
        let sum = 0;
        let filled = 0;
        for (const row of data) {
          const raw = (row as CheckinMetrics)[metric.key];
          if (raw && valuesMap[raw] !== undefined) {
            sum += valuesMap[raw];
            filled++;
          }
        }
        if (filled > 0) {
          const avg = Math.round(sum / filled);
          // Find closest label
          let closestLabel = "—";
          let closestDiff = Infinity;
          for (const [k, v] of Object.entries(valuesMap)) {
            if (Math.abs(v - avg) < closestDiff) {
              closestDiff = Math.abs(v - avg);
              closestLabel = labelsMap[k] || k;
            }
          }
          result[metric.key] = { value: avg, label: closestLabel };
        } else {
          result[metric.key] = { value: 0, label: "—" };
        }
      }
    }

    setMetrics(result);
    setLoading(false);
  }, [petId, period]);

  useEffect(() => {
    if (!userId || !petId) return;
    void fetchMetrics();
  }, [userId, petId, fetchMetrics]);

  const getScoreAvg = () => {
    const vals = Object.values(metrics).filter((m) => m.value > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((s, m) => s + m.value, 0) / vals.length);
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: "Ótimo", color: "text-green-600" };
    if (score >= 60) return { text: "Bom", color: "text-accent" };
    if (score >= 40) return { text: "Regular", color: "text-amber-500" };
    return { text: "Atenção", color: "text-destructive" };
  };

  const getBarColor = (value: number) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-amber-400";
    return "bg-destructive";
  };

  const periodLabel = period === "hoje" ? "Registro de hoje" : period === "7dias" ? "Média dos últimos 7 dias" : "Média dos últimos 30 dias";

  const score = getScoreAvg();
  const scoreInfo = getScoreLabel(score);

  return (
    <div className="border-2 border-accent/30 rounded-2xl p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-3">
        Como {petName} está?
      </h3>

      {/* Period tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { key: "hoje" as Period, label: "Hoje" },
          { key: "7dias" as Period, label: "7 dias" },
          { key: "30dias" as Period, label: "30 dias" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              period === tab.key
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      ) : !hasData ? (
        <button
          onClick={() => navigate("/diario")}
          className="w-full text-center py-8 group cursor-pointer"
        >
          <ClipboardEdit className="h-10 w-10 text-accent/60 mx-auto mb-3 group-hover:text-accent transition-colors" />
          <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
            Preencha como {petName} está hoje
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            e mantenha um histórico de bem-estar 🐾
          </p>
        </button>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>

          <div className="space-y-4">
            {metricConfig.map((metric) => {
              const m = metrics[metric.key];
              const value = m?.value || 0;
              const label = m?.label || "—";
              const Icon = metric.icon;

              return (
                <div key={metric.key} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{metric.label}</span>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(value)}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Score */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <span className="text-sm font-semibold text-foreground">Pontuação do Pet</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{score}%</span>
              <span className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.text}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
