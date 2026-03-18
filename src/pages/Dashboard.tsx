import { useEffect, useState } from "react";
import {
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Bot,
  Plus,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInYears, differenceInMonths, parseISO, format, isPast, isFuture, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import pawPattern from "@/assets/paw-pattern.png";

function formatAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = parseISO(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  if (years >= 1) {
    const months = differenceInMonths(now, birth) % 12;
    return months > 0 ? `${years} ano${years > 1 ? "s" : ""} e ${months} ${months > 1 ? "meses" : "mês"}` : `${years} ano${years > 1 ? "s" : ""}`;
  }
  const months = differenceInMonths(now, birth);
  return months > 0 ? `${months} ${months > 1 ? "meses" : "mês"}` : "Filhote";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null } | null>(null);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [vaccineStats, setVaccineStats] = useState<{ done: number; total: number; overdue: number } | null>(null);
  const [lastCheckin, setLastCheckin] = useState<any>(null);
  const [alerts, setAlerts] = useState<{ text: string; type: "danger" | "warning" }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    const [profileRes, petRes] = await Promise.all([
      supabase.from("profiles").select("name").eq("user_id", user!.id).maybeSingle(),
      supabase.from("pets").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);

    setProfile(profileRes.data);
    setPet(petRes.data);

    if (petRes.data) {
      const petId = petRes.data.id;

      // Next event
      const { data: events } = await supabase
        .from("agenda_events")
        .select("title, date, category")
        .eq("pet_id", petId)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

      if (events && events.length > 0) setNextEvent(events[0]);

      // Vaccine stats
      const { data: vaccines } = await supabase
        .from("pet_vaccinations")
        .select("status")
        .eq("pet_id", petId);

      if (vaccines) {
        const done = vaccines.filter((v) => v.status === "taken").length;
        const overdue = vaccines.filter((v) => v.status === "overdue" || v.status === "missed").length;
        setVaccineStats({ done, total: vaccines.length, overdue });
      }

      // Last checkin
      const { data: checkins } = await supabase
        .from("daily_checkins")
        .select("humor, date")
        .eq("pet_id", petId)
        .order("date", { ascending: false })
        .limit(1);

      if (checkins && checkins.length > 0) setLastCheckin(checkins[0]);

      // Build alerts
      const alertList: { text: string; type: "danger" | "warning" }[] = [];
      if (vaccines) {
        const overdueCount = vaccines.filter((v) => v.status === "overdue" || v.status === "missed").length;
        if (overdueCount > 0) alertList.push({ text: `💉 ${overdueCount} vacina${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""}`, type: "danger" });
      }
      if (events && events.length > 0) {
        const days = differenceInDays(parseISO(events[0].date), new Date());
        if (days <= 3 && days >= 0) alertList.push({ text: `📅 ${events[0].title} ${days === 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`}`, type: "warning" });
      }
      setAlerts(alertList);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tutorName = profile?.name || "Tutor";
  const petName = pet?.name || "seu pet";

  const humorMap: Record<string, string> = { brincalhao: "Brincalhão", calmo: "Calmo", ansioso: "Ansioso", irritado: "Irritado" };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-light to-background p-6 sm:p-10">
        {/* Subtle paw decoration */}
        <img
          src={pawPattern}
          alt=""
          className="absolute right-0 top-0 h-full w-48 object-cover opacity-[0.06] pointer-events-none"
          style={{ filter: "hue-rotate(0deg)" }}
        />
        <div className="relative flex items-center gap-5">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-card shadow-md overflow-hidden shrink-0 border-2 border-primary/20">
            {pet?.photo_url ? (
              <img src={pet.photo_url} alt={petName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl bg-muted">
                {pet?.species === "cat" ? "🐱" : "🐶"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-display text-foreground">
              Olá, {tutorName}! 👋
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">
              Aqui está o resumo de hoje para <span className="text-primary font-semibold">{petName}</span>
              {pet?.birth_date && <span className="ml-1">· {formatAge(pet.birth_date)}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Next Event */}
        <button
          onClick={() => navigate("/agenda")}
          className="bg-card rounded-xl p-4 shadow-sm border-l-4 border-l-primary border border-border text-left hover:shadow-md transition-shadow group"
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Próximo Evento</p>
          {nextEvent ? (
            <>
              <p className="text-sm font-bold text-foreground truncate">{nextEvent.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(nextEvent.date), "dd/MM/yyyy")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum agendado</p>
          )}
          <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver mais <ArrowRight className="h-3 w-3" />
          </span>
        </button>

        {/* Vaccines */}
        <button
          onClick={() => navigate("/vacinas")}
          className={`bg-card rounded-xl p-4 shadow-sm border-l-4 ${
            vaccineStats && vaccineStats.overdue > 0 ? "border-l-destructive" : "border-l-success"
          } border border-border text-left hover:shadow-md transition-shadow group`}
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Vacinas</p>
          {vaccineStats ? (
            <>
              <p className="text-sm font-bold text-foreground">
                {vaccineStats.done} em dia
                {vaccineStats.overdue > 0 && (
                  <span className="text-destructive ml-1">· {vaccineStats.overdue} atrasada{vaccineStats.overdue > 1 ? "s" : ""}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{vaccineStats.total} no total</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
          <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver mais <ArrowRight className="h-3 w-3" />
          </span>
        </button>

        {/* Last Diary */}
        <button
          onClick={() => navigate("/diario")}
          className="bg-card rounded-xl p-4 shadow-sm border-l-4 border-l-muted-foreground/30 border border-border text-left hover:shadow-md transition-shadow group"
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">Último Diário</p>
          {lastCheckin ? (
            <>
              <p className="text-sm font-bold text-foreground">
                {humorMap[lastCheckin.humor] || lastCheckin.humor || "Registrado"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(lastCheckin.date), "dd/MM", { locale: pt })}
                {" · há "}
                {differenceInDays(new Date(), parseISO(lastCheckin.date))} dia{differenceInDays(new Date(), parseISO(lastCheckin.date)) !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum registro</p>
          )}
          <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver mais <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Alertas & Lembretes
          </h3>
          {alerts.slice(0, 3).map((alert, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded-lg ${
                alert.type === "danger"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {alert.text}
            </div>
          ))}
        </div>
      )}

      {/* Como pet está hoje — CTA or status */}
      {!lastCheckin || lastCheckin.date !== format(new Date(), "yyyy-MM-dd") ? (
        <button
          onClick={() => navigate("/diario")}
          className="w-full bg-card rounded-xl p-6 shadow-sm border border-dashed border-primary/30 text-center hover:border-primary/60 transition-colors group"
        >
          <p className="text-base font-display text-foreground">
            Como {petName} está hoje?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Registre o bem-estar e mantenha o histórico 🐾
          </p>
          <span className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium group-hover:bg-primary-dark transition-colors">
            Registrar bem-estar
          </span>
        </button>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "+ Prontuário", icon: FileText, url: "/prontuario" },
          { label: "+ Evento", icon: Calendar, url: "/agenda" },
          { label: "+ Diário", icon: BookOpen, url: "/diario" },
          { label: "Chat IA", icon: Bot, url: "/petzinho-ia" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.url)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors bg-card"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
