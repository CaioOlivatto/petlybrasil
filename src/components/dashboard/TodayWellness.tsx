import { useNavigate } from "react-router-dom";
import { Zap, Utensils, Moon, Heart, Plus } from "lucide-react";

interface CheckinData {
  humor: string | null;
  energia: string | null;
  apetite: string | null;
  sono: string | null;
}

interface TodayWellnessProps {
  checkin: CheckinData | null;
  petName: string;
}

/* ── value maps ── */

const energiaMap: Record<string, { label: string; level: number }> = {
  alta: { label: "Alta", level: 4 },
  normal: { label: "Normal", level: 3 },
  baixa: { label: "Baixa", level: 2 },
  muito_baixa: { label: "Muito baixa", level: 1 },
};

const apetiteMap: Record<string, { label: string; level: number }> = {
  comeu_bem: { label: "Comeu bem", level: 4 },
  normal: { label: "Normal", level: 3 },
  comeu_pouco: { label: "Comeu pouco", level: 2 },
  nao_comeu: { label: "Não comeu", level: 1 },
};

const sonoMap: Record<string, { label: string; level: number }> = {
  dormiu_bem: { label: "Dormiu bem", level: 4 },
  normal: { label: "Normal", level: 3 },
  dormiu_pouco: { label: "Dormiu pouco", level: 2 },
  insonia: { label: "Insônia", level: 1 },
};

const humorMap: Record<string, { label: string; level: number }> = {
  brincalhao: { label: "Brincalhão", level: 4 },
  calmo: { label: "Calmo", level: 3 },
  ansioso: { label: "Ansioso", level: 2 },
  irritado: { label: "Irritado", level: 1 },
};

function getLevel(value: string | null, map: Record<string, { label: string; level: number }>): { label: string; level: number } {
  if (!value || !map[value]) return { label: "—", level: 0 };
  return map[value];
}

function barColor(level: number): string {
  if (level === 4) return "bg-success";
  if (level === 3) return "bg-emerald-400";
  if (level === 2) return "bg-accent";
  if (level === 1) return "bg-destructive";
  return "bg-muted";
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-accent";
  return "text-destructive";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-emerald-400/10";
  if (score >= 40) return "bg-accent/10";
  return "bg-destructive/10";
}

function scoreEmoji(score: number): string {
  if (score >= 80) return "🐾";
  if (score >= 60) return "😊";
  if (score >= 40) return "😐";
  return "😟";
}

export default function TodayWellness({ checkin, petName }: TodayWellnessProps) {
  const navigate = useNavigate();

  if (!checkin) {
    return (
      <section className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-dashed border-primary/30 animate-fade-up delay-[450ms] text-center">
        <p className="text-lg font-display text-foreground">
          Como {petName} está hoje?
        </p>
        <p className="text-sm text-muted-foreground mt-1.5">
          Registre o bem-estar e veja o resumo aqui 🐾
        </p>
        <button
          onClick={() => navigate("/diario")}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Registrar bem-estar
        </button>
      </section>
    );
  }

  const metrics = [
    { icon: Heart, label: "Humor", ...getLevel(checkin.humor, humorMap) },
    { icon: Zap, label: "Energia", ...getLevel(checkin.energia, energiaMap) },
    { icon: Utensils, label: "Apetite", ...getLevel(checkin.apetite, apetiteMap) },
    { icon: Moon, label: "Sono", ...getLevel(checkin.sono, sonoMap) },
  ];

  const filledMetrics = metrics.filter((m) => m.level > 0);
  const wellnessScore = filledMetrics.length > 0
    ? Math.round((filledMetrics.reduce((sum, m) => sum + m.level, 0) / (filledMetrics.length * 4)) * 100)
    : 0;

  return (
    <section className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border animate-fade-up delay-[450ms]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Bem-estar de hoje</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Resumo do check-in de {petName}
          </p>
        </div>
        {filledMetrics.length > 0 && (
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl ${scoreBgColor(wellnessScore)}`}>
            <span className="text-xl">{scoreEmoji(wellnessScore)}</span>
            <div className="text-right">
              <p className={`text-xl font-display font-bold leading-none ${scoreColor(wellnessScore)}`}>
                {wellnessScore}%
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Score</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3.5">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const widthPercent = metric.level === 0 ? 0 : metric.level * 25;
          return (
            <div key={metric.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-[90px] shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                {metric.level > 0 ? (
                  <div
                    className={`h-full rounded-full ${barColor(metric.level)} animate-grow-bar`}
                    style={{
                      width: `${widthPercent}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ) : (
                  <div className="h-full w-full border border-dashed border-border rounded-full" />
                )}
              </div>
              <span className={`text-xs font-medium w-[80px] text-right ${metric.level > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {metric.label === "Humor" && metric.level > 0 ? getLevel(checkin.humor, humorMap).label : ""}
                {metric.label === "Energia" && metric.level > 0 ? getLevel(checkin.energia, energiaMap).label : ""}
                {metric.label === "Apetite" && metric.level > 0 ? getLevel(checkin.apetite, apetiteMap).label : ""}
                {metric.label === "Sono" && metric.level > 0 ? getLevel(checkin.sono, sonoMap).label : ""}
                {metric.level === 0 ? "Sem registro" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
