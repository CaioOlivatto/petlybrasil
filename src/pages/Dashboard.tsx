import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Bot,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Check,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInYears, differenceInMonths, parseISO, format, differenceInDays, subDays, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import TodayWellness from "@/components/dashboard/TodayWellness";

/* ── helpers ────────────────────────────────────────── */

function formatAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = parseISO(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  if (years >= 1) {
    const months = differenceInMonths(now, birth) % 12;
    return months > 0
      ? `${years} ano${years > 1 ? "s" : ""} e ${months} ${months > 1 ? "meses" : "mês"}`
      : `${years} ano${years > 1 ? "s" : ""}`;
  }
  const months = differenceInMonths(now, birth);
  return months > 0 ? `${months} ${months > 1 ? "meses" : "mês"}` : "Filhote";
}

const humorMap: Record<string, string> = {
  brincalhao: "Brincalhão 🐾",
  calmo: "Calmo 😌",
  ansioso: "Ansioso 😰",
  irritado: "Irritado 😤",
};

const humorToLevel = (h: string | null): number => {
  if (!h) return 0;
  if (h === "brincalhao") return 4;
  if (h === "calmo") return 3;
  if (h === "ansioso") return 2;
  if (h === "irritado") return 1;
  return 0;
};

const humorColor = (level: number): string => {
  if (level === 4) return "bg-success";
  if (level === 3) return "bg-emerald-400";
  if (level === 2) return "bg-accent";
  if (level === 1) return "bg-destructive";
  return "bg-muted";
};

const humorDotColor = (level: number): string => {
  if (level === 4) return "bg-success";
  if (level === 3) return "bg-emerald-400";
  if (level === 2) return "bg-accent";
  if (level === 1) return "bg-destructive";
  return "bg-border";
};

/* ── Paw SVG decoration ─────────────────────────────── */
const PawDecoration = () => (
  <div className="absolute right-4 top-4 pointer-events-none hidden sm:block" aria-hidden>
    <svg width="100" height="100" viewBox="0 0 100 100" className="text-primary opacity-[0.06]" style={{ transform: "rotate(15deg)" }}>
      <ellipse cx="50" cy="65" rx="20" ry="25" fill="currentColor" />
      <ellipse cx="30" cy="35" rx="10" ry="14" fill="currentColor" />
      <ellipse cx="70" cy="35" rx="10" ry="14" fill="currentColor" />
      <ellipse cx="18" cy="55" rx="9" ry="12" fill="currentColor" />
      <ellipse cx="82" cy="55" rx="9" ry="12" fill="currentColor" />
    </svg>
    <svg width="80" height="80" viewBox="0 0 100 100" className="text-primary opacity-[0.04] -mt-6 ml-12" style={{ transform: "rotate(-10deg)" }}>
      <ellipse cx="50" cy="65" rx="20" ry="25" fill="currentColor" />
      <ellipse cx="30" cy="35" rx="10" ry="14" fill="currentColor" />
      <ellipse cx="70" cy="35" rx="10" ry="14" fill="currentColor" />
      <ellipse cx="18" cy="55" rx="9" ry="12" fill="currentColor" />
      <ellipse cx="82" cy="55" rx="9" ry="12" fill="currentColor" />
    </svg>
  </div>
);

/* ── Component ──────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null } | null>(null);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [vaccineStats, setVaccineStats] = useState<{ done: number; total: number; overdue: number } | null>(null);
  const [lastCheckin, setLastCheckin] = useState<any>(null);
  const [alerts, setAlerts] = useState<{ text: string; type: "danger" | "warning"; badge: string }[]>([]);
  const [weekCheckins, setWeekCheckins] = useState<{ date: string; humor: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

    const [profileRes, petRes] = await Promise.all([
      supabase.from("profiles").select("name").eq("user_id", user!.id).maybeSingle(),
      supabase.from("pets").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);

    setProfile(profileRes.data);
    setPet(petRes.data);

    if (petRes.data) {
      const petId = petRes.data.id;

      const [eventsRes, vaccinesRes, checkinsRes, weekRes] = await Promise.all([
        supabase.from("agenda_events").select("title, date, category").eq("pet_id", petId).gte("date", today).order("date", { ascending: true }).limit(1),
        supabase.from("pet_vaccinations").select("status").eq("pet_id", petId),
        supabase.from("daily_checkins").select("humor, date").eq("pet_id", petId).order("date", { ascending: false }).limit(1),
        supabase.from("daily_checkins").select("humor, date").eq("pet_id", petId).gte("date", sevenDaysAgo).lte("date", today).order("date", { ascending: true }),
      ]);

      if (eventsRes.data?.length) setNextEvent(eventsRes.data[0]);
      if (checkinsRes.data?.length) setLastCheckin(checkinsRes.data[0]);
      if (weekRes.data) setWeekCheckins(weekRes.data);

      if (vaccinesRes.data) {
        const done = vaccinesRes.data.filter((v) => v.status === "taken").length;
        const overdue = vaccinesRes.data.filter((v) => v.status === "overdue" || v.status === "missed").length;
        setVaccineStats({ done, total: vaccinesRes.data.length, overdue });
      }

      // Build alerts
      const alertList: { text: string; type: "danger" | "warning"; badge: string }[] = [];
      if (vaccinesRes.data) {
        const overdueCount = vaccinesRes.data.filter((v) => v.status === "overdue" || v.status === "missed").length;
        if (overdueCount > 0)
          alertList.push({ text: `💉 ${overdueCount} vacina${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""}`, type: "danger", badge: "Atrasado" });
      }
      if (eventsRes.data?.length) {
        const days = differenceInDays(parseISO(eventsRes.data[0].date), startOfDay(new Date()));
        if (days <= 3 && days >= 0) {
          const badgeText = days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`;
          alertList.push({ text: `📅 ${eventsRes.data[0].title}`, type: "warning", badge: badgeText });
        }
      }
      setAlerts(alertList);
    }

    setLoading(false);
  };

  /* ── Week chart data ──────────────────────────────── */
  const weekDays = useMemo(() => {
    const days: { label: string; date: string; level: number }[] = [];
    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const checkin = weekCheckins.find((c) => c.date === dateStr);
      days.push({ label: dayLabels[d.getDay()], date: dateStr, level: humorToLevel(checkin?.humor || null) });
    }
    return days;
  }, [weekCheckins]);

  /* ── Last 7 days dots for diary card ──────────────── */
  const last7Dots = useMemo(() => {
    const dots: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const c = weekCheckins.find((ch) => ch.date === d);
      dots.push(humorToLevel(c?.humor || null));
    }
    return dots;
  }, [weekCheckins]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tutorName = profile?.name || "Tutor";
  const petName = pet?.name || "seu pet";
  const hasAlerts = alerts.length > 0;
  const vaccinePercent = vaccineStats && vaccineStats.total > 0 ? Math.round((vaccineStats.done / vaccineStats.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">

      {/* ═══════ SEÇÃO 1 — HERO ═══════ */}
      <section
        className="relative rounded-[20px] overflow-hidden p-6 sm:p-8 animate-slide-down"
        style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 50%, hsl(var(--background)) 100%)" }}
      >
        <PawDecoration />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Pet photo with float animation */}
          <div
            className="h-[72px] w-[72px] sm:h-20 sm:w-20 rounded-full overflow-hidden shrink-0 animate-float"
            style={{ border: "3px solid white", boxShadow: "0 4px 12px rgba(124,58,237,0.15)" }}
          >
            {pet?.photo_url ? (
              <img src={pet.photo_url} alt={petName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl bg-muted">
                {pet?.species === "cat" ? "🐱" : "🐶"}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-[32px] font-display text-foreground leading-tight">
              Olá, {tutorName}! 👋
            </h1>
            <p className="text-[15px] text-muted-foreground mt-2">
              Aqui está o resumo de hoje para{" "}
              <span className="text-primary font-semibold italic">{petName}</span>
              {pet?.birth_date && <span className="ml-1">· {formatAge(pet.birth_date)}</span>}
            </p>
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                hasAlerts
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
              }`}
            >
              {hasAlerts ? (
                <><AlertTriangle className="h-3.5 w-3.5" /> Atenção necessária</>
              ) : (
                <><Check className="h-3.5 w-3.5" /> Tudo em dia</>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════ SEÇÃO 2 — STATUS CARDS ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 — Próximo Evento */}
        <button
          onClick={() => navigate("/agenda")}
          className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm text-left group
            border border-border border-t-4 sm:border-t-0 sm:border-l-4 border-t-primary sm:border-l-primary
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
            animate-fade-up delay-100"
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium mb-3">
            Próximo Evento
          </p>
          {nextEvent ? (
            <>
              <p className="text-lg sm:text-[22px] font-display text-foreground truncate">{nextEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(nextEvent.date), "dd/MM/yyyy")}
              </p>
            </>
          ) : (
            <>
              <p className="text-base text-muted-foreground">Nenhum evento agendado</p>
              <span className="text-sm text-primary font-medium mt-2 inline-flex items-center gap-1">
                Agendar <ArrowRight className="h-4 w-4" />
              </span>
            </>
          )}
        </button>

        {/* Card 2 — Vacinas */}
        <button
          onClick={() => navigate("/vacinas")}
          className={`bg-card rounded-2xl p-5 sm:p-6 shadow-sm text-left group
            border border-border border-t-4 sm:border-t-0 sm:border-l-4
            ${vaccineStats && vaccineStats.overdue > 0
              ? "border-t-destructive sm:border-l-destructive"
              : "border-t-success sm:border-l-success"
            }
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
            animate-fade-up delay-200`}
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium mb-3">
            Vacinas
          </p>
          {vaccineStats ? (
            <>
              <p className="text-lg sm:text-[22px] font-display text-foreground">
                {vaccineStats.done} em dia
              </p>
              {vaccineStats.overdue > 0 ? (
                <p className="text-sm text-destructive mt-1 font-medium">
                  {vaccineStats.overdue} atrasada{vaccineStats.overdue > 1 ? "s" : ""}
                </p>
              ) : (
                <p className="text-sm text-success mt-1 font-medium">Calendário completo</p>
              )}
              <div className="mt-3">
                <Progress value={vaccinePercent} className="h-1 bg-muted" />
              </div>
            </>
          ) : (
            <p className="text-base text-muted-foreground">Sem dados</p>
          )}
        </button>

        {/* Card 3 — Último Diário */}
        <button
          onClick={() => navigate("/diario")}
          className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm text-left group
            border border-border border-t-4 sm:border-t-0 sm:border-l-4 border-t-indigo-500 sm:border-l-indigo-500
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
            animate-fade-up delay-300"
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium mb-3">
            Último Diário
          </p>
          {lastCheckin ? (
            <>
              <p className="text-lg sm:text-[22px] font-display text-foreground">
                {humorMap[lastCheckin.humor] || lastCheckin.humor || "Registrado"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(lastCheckin.date), "dd/MM", { locale: pt })}
                {" · há "}
                {differenceInDays(new Date(), parseISO(lastCheckin.date))} dia{differenceInDays(new Date(), parseISO(lastCheckin.date)) !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-base text-muted-foreground">Nenhum registro</p>
          )}
          {/* 7-day dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {last7Dots.map((lvl, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${humorDotColor(lvl)}`} />
            ))}
          </div>
        </button>
      </div>

      {/* ═══════ SEÇÃO 3 — ALERTAS & LEMBRETES ═══════ */}
      <section className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border border-l-4 border-l-accent animate-fade-up delay-400">
        {alerts.length > 0 ? (
          <>
            <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Alertas & Lembretes
            </h3>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-sm px-4 py-3 rounded-[10px] ${
                    alert.type === "danger"
                      ? "bg-destructive/5 text-destructive"
                      : "bg-accent/5 text-foreground"
                  }`}
                >
                  <span>{alert.text}</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ml-3 ${
                      alert.badge === "Atrasado"
                        ? "bg-destructive/15 text-destructive"
                        : alert.badge === "Hoje"
                        ? "bg-accent/15 text-accent"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {alert.badge}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-success">
            <Check className="h-5 w-5" />
            <span className="text-[15px] font-semibold">Tudo em ordem por hoje!</span>
          </div>
        )}
      </section>

      {/* ═══════ SEÇÃO 4 — GRÁFICO SEMANAL ═══════ */}
      <section className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border animate-fade-up delay-500">
        <h3 className="text-[15px] font-semibold text-foreground">Bem-estar esta semana</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5 mb-5">
          Como {petName} esteve nos últimos 7 dias
        </p>
        <div className="flex items-end justify-between gap-2 sm:gap-3 h-[80px]">
          {weekDays.map((day, i) => {
            const isToday = day.date === format(new Date(), "yyyy-MM-dd");
            const heightPercent = day.level === 0 ? 15 : day.level * 25;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                <span className={`text-[11px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {isToday ? "Hoje" : day.label}
                </span>
                <div className="w-5 sm:w-7 relative" style={{ height: "60px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-md ${day.level === 0 ? "bg-muted border border-dashed border-border" : humorColor(day.level)} animate-grow-bar ${isToday && day.level > 0 ? "ring-2 ring-primary/30" : ""}`}
                    style={{
                      height: `${heightPercent}%`,
                      transformOrigin: "bottom",
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {weekCheckins.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-3">Sem registros esta semana</p>
        )}
      </section>

      {/* ═══════ CTA — Como pet está hoje ═══════ */}
      {(!lastCheckin || lastCheckin.date !== format(new Date(), "yyyy-MM-dd")) && (
        <button
          onClick={() => navigate("/diario")}
          className="w-full bg-card rounded-2xl p-8 shadow-sm border border-dashed border-primary/30 text-center hover:border-primary/60 transition-colors group animate-fade-up delay-500"
        >
          <p className="text-lg sm:text-xl font-display text-foreground">
            Como {petName} está hoje?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Registre o bem-estar e mantenha o histórico 🐾
          </p>
          <span className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium group-hover:bg-primary/90 transition-colors">
            Registrar bem-estar
          </span>
        </button>
      )}

      {/* ═══════ SEÇÃO 5 — ACESSO RÁPIDO ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-600">
        <button
          onClick={() => navigate("/prontuario")}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-150 shadow-sm"
        >
          <FileText className="h-[18px] w-[18px]" />
          + Prontuário
        </button>
        <button
          onClick={() => navigate("/agenda")}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-medium bg-card text-foreground border-[1.5px] border-border hover:border-primary hover:text-primary hover:scale-[1.02] transition-all duration-150"
        >
          <Calendar className="h-[18px] w-[18px]" />
          + Evento
        </button>
        <button
          onClick={() => navigate("/diario")}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-medium bg-card text-foreground border-[1.5px] border-border hover:border-primary hover:text-primary hover:scale-[1.02] transition-all duration-150"
        >
          <BookOpen className="h-[18px] w-[18px]" />
          + Diário
        </button>
        <button
          onClick={() => navigate("/petzinho-ia")}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-medium bg-secondary text-primary border-[1.5px] border-primary/20 hover:border-primary hover:scale-[1.02] transition-all duration-150"
        >
          <Bot className="h-[18px] w-[18px]" />
          Chat IA
        </button>
      </div>
    </div>
  );
}
