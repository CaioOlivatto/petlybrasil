import { useState, useRef, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Plus,
  AlertTriangle,
  ChevronRight,
  Syringe,
  Clock,
  CalendarDays,
  CalendarClock,
  Trash2,
  Pencil,
  Loader2,
  Pill,
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
  outro: "Outro",
};

const typeToIcon: Record<string, typeof Syringe> = {
  vacina: Syringe,
  consulta: CalendarIcon,
  exame: CalendarIcon,
  vermifugo: CalendarIcon,
  medicacao: Pill,
  procedimento: CalendarIcon,
  outro: CalendarIcon,
};

const categoryToType: Record<string, string> = Object.fromEntries(
  Object.entries(typeToCategory).map(([k, v]) => [v, k])
);

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T12:00:00");
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isNextWeek(dateStr: string): boolean {
  const days = daysFromNow(dateStr);
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilNextWeekStart = 7 - dayOfWeek;
  return days >= daysUntilNextWeekStart && days < daysUntilNextWeekStart + 7;
}

function isNextMonth(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const nextMonth = today.getMonth() + 1;
  const nextMonthYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear();
  return d.getMonth() === (nextMonth % 12) && d.getFullYear() === nextMonthYear;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function Agenda() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [eventos, setEventos] = useState<AgendaEvent[]>([]);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeSection, setActiveSection] = useState<"atrasadas" | "proxima-semana" | "proximo-mes" | null>(null);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [eventType, setEventType] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  // Detail dialog
  const [detailEvent, setDetailEvent] = useState<AgendaEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AgendaEvent | null>(null);

  const sectionRefs = {
    atrasadas: useRef<HTMLDivElement>(null),
    "proxima-semana": useRef<HTMLDivElement>(null),
    "proximo-mes": useRef<HTMLDivElement>(null),
  };

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

  const overdue = eventos.filter((e) => e.date < todayStr);
  const nextWeek = eventos.filter((e) => e.date >= todayStr && isNextWeek(e.date));
  const nextMonth = eventos.filter((e) => isNextMonth(e.date));

  const selectedDayEvents = eventos.filter(
    (e) => selectedDate && e.date === selectedDate.toISOString().split("T")[0]
  );

  const eventDates = eventos.map((e) => new Date(e.date + "T12:00:00"));

  const resetEventForm = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setEventType("");
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventNotes("");
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
      } else {
        const { error } = await supabase.from("agenda_events").insert({
          user_id: user.id,
          pet_id: pet.id,
          title: eventTitle,
          category,
          date: eventDate,
          time: eventTime || null,
          notes: eventNotes || null,
          source: "manual",
        } as any);
        if (error) throw error;
        toast({ title: "Evento criado", description: `"${eventTitle}" foi adicionado à agenda.` });
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
    const { error } = await supabase
      .from("agenda_events")
      .delete()
      .eq("id", eventToDelete.id);
    
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

  const handleCardClick = (section: "atrasadas" | "proxima-semana" | "proximo-mes") => {
    setActiveSection(section);
    setTimeout(() => {
      sectionRefs[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderEventCard = (evento: AgendaEvent) => {
    const days = daysFromNow(evento.date);
    const isOverdue = days < 0;
    const Icon = typeToIcon[categoryToType[evento.category] || evento.category] || CalendarIcon;

    return (
      <div
        key={evento.id}
        onClick={() => openEventDetail(evento)}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors cursor-pointer ${
          isOverdue
            ? "border-destructive/30 bg-background hover:border-destructive/50"
            : "border-accent/20 bg-background hover:border-accent/40"
        }`}
      >
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
          isOverdue ? "bg-destructive/10" : "bg-accent/10"
        }`}>
          <Icon className={`h-5 w-5 ${isOverdue ? "text-destructive" : "text-accent"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{evento.title}</p>
            {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{evento.category}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${isOverdue ? "text-destructive" : "text-accent"}`}>
            {isOverdue ? `Há ${Math.abs(days)} dias` : days === 0 ? "Hoje" : `Em ${days} dias`}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(evento.date)}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
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
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">Eventos e alertas do seu pet</p>
            </div>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-12 px-6 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleCardClick("atrasadas")}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            activeSection === "atrasadas"
              ? "border-destructive bg-destructive/10 shadow-md"
              : "border-destructive/30 bg-background hover:border-destructive/50"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
            <p className="text-sm font-medium text-foreground">Atrasadas</p>
          </div>
        </button>

        <button
          onClick={() => handleCardClick("proxima-semana")}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            activeSection === "proxima-semana"
              ? "border-primary bg-primary/10 shadow-md"
              : "border-primary/30 bg-background hover:border-primary/50"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{nextWeek.length}</p>
            <p className="text-sm font-medium text-foreground">Próxima semana</p>
          </div>
        </button>

        <button
          onClick={() => handleCardClick("proximo-mes")}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            activeSection === "proximo-mes"
              ? "border-accent bg-accent/10 shadow-md"
              : "border-accent/30 bg-background hover:border-accent/50"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <CalendarClock className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{nextMonth.length}</p>
            <p className="text-sm font-medium text-foreground">Próximo mês</p>
          </div>
        </button>
      </div>

      {/* Calendar + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5">
        <div className="space-y-4">
          <div className="border-2 border-accent/20 rounded-2xl p-4 bg-background">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ event: eventDates }}
              modifiersClassNames={{ event: "bg-accent/20 font-bold" }}
              className="rounded-xl"
            />
          </div>
          <div className="border-2 border-accent/20 rounded-2xl p-4 bg-background">
            <h3 className="font-bold text-foreground mb-2">
              {selectedDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => openEventDetail(e)}
                    className="text-sm text-foreground flex items-center gap-2 cursor-pointer hover:text-accent transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {e.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div ref={sectionRefs.atrasadas}>
            <h2 className="flex items-center gap-2 text-base font-bold text-destructive mb-3">
              <CalendarIcon className="h-4 w-4" />
              Atrasados ({overdue.length})
            </h2>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl p-6 text-center bg-background">
                Nenhum evento atrasado 🎉
              </p>
            ) : (
              <div className="space-y-2">{overdue.map(renderEventCard)}</div>
            )}
          </div>

          <div ref={sectionRefs["proxima-semana"]}>
            <h2 className="flex items-center gap-2 text-base font-bold text-primary mb-3">
              <CalendarDays className="h-4 w-4" />
              Próxima semana ({nextWeek.length})
            </h2>
            {nextWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl p-6 text-center bg-background">
                Nenhum evento na próxima semana
              </p>
            ) : (
              <div className="space-y-2">{nextWeek.map(renderEventCard)}</div>
            )}
          </div>

          <div ref={sectionRefs["proximo-mes"]}>
            <h2 className="flex items-center gap-2 text-base font-bold text-accent mb-3">
              <CalendarClock className="h-4 w-4" />
              Próximo mês ({nextMonth.length})
            </h2>
            {nextMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl p-6 text-center bg-background">
                Nenhum evento no próximo mês
              </p>
            ) : (
              <div className="space-y-2">{nextMonth.map(renderEventCard)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Dialog */}
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
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <Pill className="h-4 w-4 text-accent" />
                    <p className="text-sm text-accent font-medium">Criado automaticamente via prontuário</p>
                  </div>
                )}
                {daysFromNow(detailEvent.date) < 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Atrasado há {Math.abs(daysFromNow(detailEvent.date))} dias
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-12 text-base rounded-xl gap-2"
                  onClick={() => openEditDialog(detailEvent)}
                >
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetEventForm(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="h-5 w-5 text-accent" />
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
                <SelectContent>
                  <SelectItem value="vacina">Vacina</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="vermifugo">Vermífugo</SelectItem>
                  <SelectItem value="medicacao">Medicação</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
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
                <label className="text-sm font-semibold text-foreground">Data *</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Horário</label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

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
                className="h-12 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!eventType || !eventTitle || !eventDate || saving}
                onClick={handleSaveEvent}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingEvent ? "Salvar" : "Criar Evento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
