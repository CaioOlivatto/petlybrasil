import { useState, useRef, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Plus,
  ChevronRight,
  Syringe,
  Clock,
  CalendarDays,
  Trash2,
  Pencil,
  Loader2,
  Pill,
  Scissors,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronDown,
  Stethoscope,
  FlaskConical,
  Bug,
  HeartPulse,
  Plane,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

interface AgendaEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string | null;
  notes: string | null;
  source: string | null;
}

const typeToCategory: Record<string, string> = {
  vacina: "Vacina",
  consulta: "Consulta",
  exame: "Exame",
  vermifugo: "Vermífugo",
  medicacao: "Medicação",
  procedimento: "Procedimento",
  "banho-tosa": "Banho / Tosa",
  "atividade-semanal": "Atividade Semanal",
  "atividade-mensal": "Atividade Mensal",
  outro: "Outro",
};

const typeToIcon: Record<string, typeof Syringe> = {
  vacina: Syringe,
  consulta: Stethoscope,
  exame: FlaskConical,
  vermifugo: Bug,
  medicacao: Pill,
  procedimento: HeartPulse,
  "banho-tosa": Scissors,
  "atividade-semanal": Repeat,
  "atividade-mensal": Repeat,
  viagem: Plane,
  outro: Sparkles,
};

const categoryToType: Record<string, string> = Object.fromEntries(
  Object.entries(typeToCategory).map(([k, v]) => [v, k])
);

// Border-left colors per category type (using HSL tokens where possible)
const typeBorderColor: Record<string, string> = {
  consulta: "border-l-primary",
  vacina: "border-l-success",
  exame: "border-l-blue-500",
  vermifugo: "border-l-warning",
  medicacao: "border-l-success",
  procedimento: "border-l-destructive",
  "banho-tosa": "border-l-pink-500",
  "atividade-semanal": "border-l-indigo-500",
  "atividade-mensal": "border-l-indigo-500",
  viagem: "border-l-primary-light",
  outro: "border-l-muted-foreground",
};

const frequencyOptions = [
  { value: "1x", label: "1x ao dia", hours: 24 },
  { value: "2x", label: "2x ao dia (12/12h)", hours: 12 },
  { value: "3x", label: "3x ao dia (8/8h)", hours: 8 },
  { value: "4x", label: "4x ao dia (6/6h)", hours: 6 },
  { value: "6x", label: "6x ao dia (4/4h)", hours: 4 },
  { value: "8x", label: "8x ao dia (3/3h)", hours: 3 },
  { value: "12x", label: "A cada 2 horas", hours: 2 },
];

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T12:00:00");
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function calculateDoseTimes(firstDose: string, intervalHours: number): string[] {
  const times: string[] = [];
  const [h, m] = firstDose.split(":").map(Number);
  let totalMinutes = h * 60 + m;
  const dosesPerDay = Math.floor(24 / intervalHours);
  for (let i = 0; i < dosesPerDay; i++) {
    const hour = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    times.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    totalMinutes += intervalHours * 60;
  }
  return times;
}

const filterChips = [
  { key: "todos", label: "Todos" },
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "consulta", label: "Consultas" },
  { key: "vacina", label: "Vacinas" },
  { key: "medicacao", label: "Medicamentos" },
  { key: "exame", label: "Exames" },
];

export default function Agenda() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [eventos, setEventos] = useState<AgendaEvent[]>([]);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeFilter, setActiveFilter] = useState("todos");
  const [showRealized, setShowRealized] = useState(false);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [eventType, setEventType] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [repeatEnabled, setRepeatEnabled] = useState(false);

  // Medication-specific fields
  const [medFrequency, setMedFrequency] = useState("");
  const [medFirstDose, setMedFirstDose] = useState("08:00");
  const [medEndDate, setMedEndDate] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medContinuous, setMedContinuous] = useState(false);

  // Detail dialog
  const [detailEvent, setDetailEvent] = useState<AgendaEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AgendaEvent | null>(null);

  const medsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pets")
      .select("id, name")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPet(data);
        else setLoading(false);
      });
  }, [user]);

  const fetchEvents = useCallback(async () => {
    if (!user || !pet) return;
    const { data, error } = await supabase
      .from("agenda_events")
      .select("id, title, category, date, time, notes, source")
      .eq("user_id", user.id)
      .eq("pet_id", pet.id)
      .order("date", { ascending: true });
    if (!error && data) setEventos(data);
    setLoading(false);
  }, [user, pet]);

  useEffect(() => {
    if (pet) fetchEvents();
  }, [pet, fetchEvents]);

  const todayStr = new Date().toISOString().split("T")[0];

  const isMedication = (e: AgendaEvent) =>
    e.source === "medicacao" || e.category === "medicacao" || e.category === "Medicação";

  const getEventType = (e: AgendaEvent) => categoryToType[e.category] || e.category;

  // ─── Derived data ───
  const todayEvents = eventos.filter((e) => e.date === todayStr && !isMedication(e));
  const next7Events = eventos.filter((e) => {
    const d = daysFromNow(e.date);
    return d >= 0 && d <= 7 && !isMedication(e);
  });
  const todayMedications = eventos.filter((e) => isMedication(e) && e.date === todayStr);
  const activeMedNames = new Set<string>();
  todayMedications.forEach((e) => {
    activeMedNames.add(e.title.replace(/^💊\s*/, "").replace(/\s*-\s*\d{2}:\d{2}$/, "").trim());
  });

  // Group today meds by name
  const medByName: Record<string, AgendaEvent[]> = {};
  todayMedications.forEach((e) => {
    const name = e.title.replace(/^💊\s*/, "").replace(/\s*-\s*\d{2}:\d{2}$/, "").trim();
    if (!medByName[name]) medByName[name] = [];
    medByName[name].push(e);
  });
  Object.values(medByName).forEach((g) => g.sort((a, b) => (a.time || "").localeCompare(b.time || "")));

  // Calendar dot data
  const eventDateSet = new Set<string>();
  const medDateSet = new Set<string>();
  eventos.forEach((e) => {
    if (isMedication(e)) medDateSet.add(e.date);
    else eventDateSet.add(e.date);
  });

  const eventDatesForCal = [...eventDateSet].map((d) => new Date(d + "T12:00:00"));
  const medDatesForCal = [...medDateSet].map((d) => new Date(d + "T12:00:00"));

  const realized = eventos.filter((e) => e.date < todayStr && !isMedication(e));
  const futureToday = eventos.filter((e) => e.date === todayStr && !isMedication(e));
  const futureWeek = eventos.filter((e) => {
    const d = daysFromNow(e.date);
    return d > 0 && d <= 7 && !isMedication(e);
  });

  // Filtered events for right column
  const getFilteredEvents = () => {
    const nonMed = eventos.filter((e) => !isMedication(e));
    switch (activeFilter) {
      case "hoje":
        return nonMed.filter((e) => e.date === todayStr);
      case "semana":
        return nonMed.filter((e) => { const d = daysFromNow(e.date); return d >= 0 && d <= 7; });
      case "consulta":
        return nonMed.filter((e) => getEventType(e) === "consulta");
      case "vacina":
        return nonMed.filter((e) => getEventType(e) === "vacina");
      case "medicacao":
        return eventos.filter((e) => isMedication(e));
      case "exame":
        return nonMed.filter((e) => getEventType(e) === "exame");
      default:
        return null; // use default sections
    }
  };

  const filteredEvents = getFilteredEvents();

  const selectedDayStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
  const selectedDayEvents = eventos.filter((e) => e.date === selectedDayStr);

  // ─── Form logic ───
  const resetEventForm = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setEventType("");
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventNotes("");
    setRepeatEnabled(false);
    setMedFrequency("");
    setMedFirstDose("08:00");
    setMedEndDate("");
    setMedDosage("");
    setMedContinuous(false);
  };

  const openCreateDialog = () => {
    resetEventForm();
    setDialogOpen(true);
  };

  const openEditDialog = (evento: AgendaEvent) => {
    setEditingEvent(evento);
    setEventType(categoryToType[evento.category] || evento.category);
    setEventTitle(evento.title);
    setEventDate(evento.date);
    setEventTime(evento.time || "");
    setEventNotes(evento.notes || "");
    setDetailOpen(false);
    setDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventType || !eventTitle || !eventDate || !user || !pet) return;
    setSaving(true);

    const category = typeToCategory[eventType] || eventType;

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from("agenda_events")
          .update({
            title: eventTitle,
            category,
            date: eventDate,
            time: eventTime || null,
            notes: eventNotes || null,
          } as any)
          .eq("id", editingEvent.id);
        if (error) throw error;
        toast({ title: "Evento atualizado", description: `"${eventTitle}" foi atualizado.` });
      } else if (eventType === "medicacao" && medFrequency && medFirstDose) {
        // Create medication events for each day in range
        const freq = frequencyOptions.find((f) => f.value === medFrequency);
        if (!freq) throw new Error("Frequência inválida");

        const doseTimes = calculateDoseTimes(medFirstDose, freq.hours);
        const startDate = new Date(eventDate + "T12:00:00");
        const endDate = medContinuous
          ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days for continuous
          : medEndDate
            ? new Date(medEndDate + "T12:00:00")
            : startDate;

        const eventsToInsert: any[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toISOString().split("T")[0];
          for (const time of doseTimes) {
            eventsToInsert.push({
              user_id: user.id,
              pet_id: pet.id,
              title: `💊 ${eventTitle} - ${time}`,
              category,
              date: dateStr,
              time,
              notes: medDosage ? `Dosagem: ${medDosage} | Freq: ${freq.label}` : `Freq: ${freq.label}`,
              source: "medicacao",
            });
          }
          current.setDate(current.getDate() + 1);
        }

        if (eventsToInsert.length > 0) {
          const { error } = await supabase.from("agenda_events").insert(eventsToInsert);
          if (error) throw error;
        }
        toast({
          title: "Medicação criada",
          description: `${eventsToInsert.length} horários criados para "${eventTitle}".`,
        });
      } else {
        // Normal event creation
        const isWeekly = eventType === "atividade-semanal" && repeatEnabled;
        const isMonthly = eventType === "atividade-mensal" && repeatEnabled;
        const occurrences = isWeekly ? 12 : isMonthly ? 6 : 1;

        const eventsToInsert = [];
        for (let i = 0; i < occurrences; i++) {
          const baseDate = new Date(eventDate + "T12:00:00");
          if (isWeekly) baseDate.setDate(baseDate.getDate() + i * 7);
          if (isMonthly) baseDate.setMonth(baseDate.getMonth() + i);
          eventsToInsert.push({
            user_id: user.id,
            pet_id: pet.id,
            title: eventTitle,
            category,
            date: baseDate.toISOString().split("T")[0],
            time: eventTime || null,
            notes: eventNotes || null,
            source: "manual",
          });
        }

        const { error } = await supabase.from("agenda_events").insert(eventsToInsert as any);
        if (error) throw error;
        const desc =
          occurrences > 1
            ? `"${eventTitle}" — ${occurrences} eventos criados.`
            : `"${eventTitle}" foi adicionado à agenda.`;
        toast({ title: "Evento criado", description: desc });
      }
      resetEventForm();
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    const { error } = await supabase.from("agenda_events").delete().eq("id", eventToDelete.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Evento excluído", description: `"${eventToDelete.title}" foi removido.`, variant: "destructive" });
      fetchEvents();
    }
    setEventToDelete(null);
    setDeleteConfirmOpen(false);
    setDetailOpen(false);
  };

  const openEventDetail = (evento: AgendaEvent) => {
    setDetailEvent(evento);
    setDetailOpen(true);
  };

  // Computed dose times preview for modal
  const previewDoseTimes =
    eventType === "medicacao" && medFrequency && medFirstDose
      ? calculateDoseTimes(medFirstDose, frequencyOptions.find((f) => f.value === medFrequency)?.hours || 24)
      : [];

  // ─── Medication dose status ───
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const getDoseStatus = (time: string | null) => {
    if (!time) return "pending";
    if (time < currentTimeStr) return "overdue"; // past and not marked
    if (time === currentTimeStr || (time > currentTimeStr && time <= `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes() + 30).padStart(2, "0")}`)) return "next";
    return "pending";
  };

  // Find next dose across all meds
  const getNextDoseTime = (events: AgendaEvent[]): string | null => {
    const future = events.filter((e) => e.time && e.time >= currentTimeStr).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    return future[0]?.time || null;
  };

  // ─── Render helpers ───
  const getStatusBadge = (evento: AgendaEvent) => {
    const days = daysFromNow(evento.date);
    if (days < 0)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-3 w-3" />
          Atrasado
        </span>
      );
    if (days === 0)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
          Hoje
        </span>
      );
    if (days <= 7)
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          Em {days} dia{days > 1 ? "s" : ""}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        {formatDate(evento.date)}
      </span>
    );
  };

  const renderEventCard = (evento: AgendaEvent, index: number) => {
    const type = getEventType(evento);
    const Icon = typeToIcon[type] || Sparkles;
    const borderClass = typeBorderColor[type] || "border-l-muted";

    return (
      <motion.div
        key={evento.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => openEventDetail(evento)}
        className={`flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 border-l-4 ${borderClass} shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
      >
        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="h-4.5 w-4.5 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{evento.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {evento.category} {evento.time && `• ${evento.time}`}
          </p>
          {evento.notes && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{evento.notes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge(evento)}
          <p className="text-xs text-muted-foreground">{evento.time || formatDate(evento.date)}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-5">
        <Skeleton className="h-10 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                Eventos e medicamentos de {pet?.name || "seu pet"}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* ═══ SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today */}
        <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-primary/5 hover:border-primary/30 transition-colors">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{todayEvents.length + todayMedications.length}</p>
            <p className="text-sm font-medium text-foreground">Hoje</p>
          </div>
        </div>

        {/* Next 7 days */}
        <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-warning/5 hover:border-warning/30 transition-colors">
          <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{next7Events.length}</p>
            <p className="text-sm font-medium text-foreground">Próximos 7 dias</p>
          </div>
        </div>

        {/* Active meds */}
        <button
          onClick={() => medsRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-success/5 hover:border-success/30 transition-colors text-left"
        >
          <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Pill className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{activeMedNames.size}</p>
            <p className="text-sm font-medium text-foreground">Medicamentos ativos</p>
          </div>
        </button>
      </div>

      {/* ═══ FILTER CHIPS ═══ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setActiveFilter(chip.key)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
              activeFilter === chip.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-5">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">
          {/* Calendar */}
          <div className="border border-border rounded-2xl p-4 bg-card">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                event: eventDatesForCal,
                medication: medDatesForCal,
              }}
              modifiersClassNames={{
                event: "bg-primary/20 font-bold",
                medication: "bg-success/20 font-bold",
              }}
              className="rounded-xl pointer-events-auto"
            />
          </div>

          {/* Selected day panel */}
          <div className="border border-border rounded-2xl p-4 bg-card">
            <h3 className="font-semibold text-foreground text-[15px] mb-2">
              {selectedDate ? formatDateLong(selectedDayStr) : "Selecione um dia"}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
            ) : (
              <div className="space-y-1.5">
                {selectedDayEvents.map((e) => {
                  const Icon = typeToIcon[getEventType(e)] || Sparkles;
                  return (
                    <div
                      key={e.id}
                      onClick={() => openEventDetail(e)}
                      className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:text-primary transition-colors py-1"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{e.title}</span>
                      {e.time && <span className="text-xs text-muted-foreground ml-auto shrink-0">{e.time}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Medications today panel */}
          <div ref={medsRef} className="border border-border rounded-2xl p-4 bg-success/5">
            <h3 className="font-semibold text-foreground text-[15px] mb-3 flex items-center gap-2">
              💊 Medicamentos hoje
            </h3>
            {Object.keys(medByName).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum medicamento para hoje</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(medByName).map(([name, events]) => {
                  const nextDose = getNextDoseTime(events);
                  return (
                    <div key={name} className="space-y-2">
                      <p className="text-sm font-bold text-foreground">{name}</p>
                      {events[0]?.notes && (
                        <p className="text-xs text-muted-foreground">{events[0].notes}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {events.map((e) => {
                          const t = e.time || "—";
                          const isPast = t < currentTimeStr;
                          const isNext = t === nextDose && t >= currentTimeStr;
                          return (
                            <button
                              key={e.id}
                              onClick={() => openEventDetail(e)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isPast
                                  ? "bg-destructive/10 text-destructive"
                                  : isNext
                                    ? "bg-warning/20 text-warning animate-pulse border border-warning/30"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isPast ? (
                                <AlertCircle className="h-3 w-3" />
                              ) : isNext ? (
                                <Clock className="h-3 w-3" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      {nextDose && (
                        <p className="text-xs font-medium text-warning">
                          Próxima dose: {nextDose}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
          {filteredEvents !== null ? (
            // Filtered view
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">
                {filterChips.find((c) => c.key === activeFilter)?.label} ({filteredEvents.length})
              </h2>
              {filteredEvents.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl bg-background">
                  <EmptyState
                    icon={CalendarDays}
                    title="Nenhum evento encontrado"
                    description="Tente outro filtro ou crie um novo evento."
                    actionLabel="Novo Evento"
                    onAction={openCreateDialog}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((e, i) => renderEventCard(e, i))}
                </div>
              )}
            </div>
          ) : (
            // Default sectioned view
            <>
              {/* TODAY section */}
              {futureToday.length > 0 && (
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                  <h2 className="flex items-center gap-2 text-base font-bold text-primary mb-3">
                    📅 Hoje
                  </h2>
                  <div className="space-y-2">
                    {futureToday.map((e, i) => renderEventCard(e, i))}
                  </div>
                </div>
              )}

              {/* THIS WEEK section */}
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
                  📅 Próximos 7 dias ({futureWeek.length})
                </h2>
                {futureWeek.length === 0 ? (
                  <div className="border border-dashed border-border rounded-2xl bg-background">
                    <EmptyState
                      icon={CalendarDays}
                      title="Semana livre!"
                      description="Nenhum evento nos próximos 7 dias."
                      actionLabel="Agendar evento"
                      onAction={openCreateDialog}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {futureWeek.map((e, i) => renderEventCard(e, i))}
                  </div>
                )}
              </div>

              {/* REALIZED — hidden by default */}
              {realized.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowRealized(!showRealized)}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showRealized ? "rotate-180" : ""}`}
                    />
                    Ver eventos anteriores ({realized.length})
                  </button>
                  <AnimatePresence>
                    {showRealized && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-3 opacity-60">
                          {realized.map((e, i) => renderEventCard(e, i))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══ EVENT DETAIL DIALOG ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              Detalhes do Evento
            </DialogTitle>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-4 mt-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</p>
                  <p className="text-base font-semibold text-foreground">{detailEvent.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</p>
                    <p className="text-sm text-foreground">{detailEvent.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</p>
                    <p className="text-sm text-foreground">{formatDate(detailEvent.date)}</p>
                  </div>
                </div>
                {detailEvent.time && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Horário</p>
                    <p className="text-sm text-foreground">{detailEvent.time}</p>
                  </div>
                )}
                {detailEvent.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</p>
                    <p className="text-sm text-foreground">{detailEvent.notes}</p>
                  </div>
                )}
                {detailEvent.source && detailEvent.source !== "manual" && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Pill className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary font-medium">Criado automaticamente via prontuário</p>
                  </div>
                )}
                {daysFromNow(detailEvent.date) < 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Atrasado há {Math.abs(daysFromNow(detailEvent.date))} dias
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="h-12 text-base rounded-xl gap-2" onClick={() => openEditDialog(detailEvent)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 text-base rounded-xl gap-2"
                  onClick={() => {
                    setEventToDelete(detailEvent);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE/EDIT DIALOG ═══ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetEventForm(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Tipo de Evento *</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="vacina">🩺 Vacina</SelectItem>
                  <SelectItem value="consulta">📋 Consulta</SelectItem>
                  <SelectItem value="exame">🔬 Exame</SelectItem>
                  <SelectItem value="vermifugo">💊 Vermífugo</SelectItem>
                  <SelectItem value="medicacao">💉 Medicação</SelectItem>
                  <SelectItem value="procedimento">🏥 Procedimento</SelectItem>
                  <SelectItem value="banho-tosa">✂️ Banho / Tosa</SelectItem>
                  <SelectItem value="atividade-semanal">🔄 Atividade Semanal</SelectItem>
                  <SelectItem value="atividade-mensal">📅 Atividade Mensal</SelectItem>
                  <SelectItem value="outro">📌 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Título *</label>
              <Input
                placeholder="Ex: Vacina V10 - 2ª dose"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {eventType === "medicacao" ? "Data de início *" : "Data *"}
                </label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12" />
              </div>
              {eventType !== "medicacao" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Horário</label>
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-12" />
                </div>
              )}
            </div>

            {/* ── Medication-specific fields ── */}
            <AnimatePresence>
              {eventType === "medicacao" && !editingEvent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Frequência *</label>
                    <Select value={medFrequency} onValueChange={setMedFrequency}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Primeira dose *</label>
                      <Input type="time" value={medFirstDose} onChange={(e) => setMedFirstDose(e.target.value)} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Dosagem</label>
                      <Input placeholder="Ex: 1 comp" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">Data de término</label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={medContinuous}
                          onChange={(e) => setMedContinuous(e.target.checked)}
                          className="h-4 w-4 accent-primary rounded"
                        />
                        Uso contínuo
                      </label>
                    </div>
                    {!medContinuous && (
                      <Input type="date" value={medEndDate} onChange={(e) => setMedEndDate(e.target.value)} className="h-12" />
                    )}
                  </div>

                  {/* Preview of calculated times */}
                  {previewDoseTimes.length > 0 && (
                    <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                      <p className="text-xs font-semibold text-success mb-2">Horários calculados:</p>
                      <div className="flex flex-wrap gap-2">
                        {previewDoseTimes.map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-lg bg-success/20 text-xs font-bold text-success">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {(eventType === "atividade-semanal" || eventType === "atividade-mensal") && !editingEvent && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <Repeat className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Repetir {eventType === "atividade-semanal" ? "toda semana" : "todo mês"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eventType === "atividade-semanal" ? "Cria 12 eventos semanais" : "Cria 6 eventos mensais"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(e) => setRepeatEnabled(e.target.checked)}
                  className="h-5 w-5 accent-primary rounded"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Observações (opcional)</label>
              <textarea
                placeholder="Ex: Levar carteira de vacinação"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" className="h-12 text-base rounded-xl" onClick={resetEventForm}>
                Cancelar
              </Button>
              <Button
                className="h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={
                  !eventType ||
                  !eventTitle ||
                  !eventDate ||
                  saving ||
                  (eventType === "medicacao" && !editingEvent && (!medFrequency || !medFirstDose))
                }
                onClick={handleSaveEvent}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingEvent ? "Salvar" : "Criar Evento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{eventToDelete?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
