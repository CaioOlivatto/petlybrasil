import { useState, useRef } from "react";
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
  DialogTrigger,
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

interface Evento {
  id: string;
  title: string;
  category: string;
  date: Date;
  icon: typeof Syringe;
  overdue?: boolean;
  time?: string;
  notes?: string;
}

const today = new Date();

const initialEventos: Evento[] = [];

const categoryToType: Record<string, string> = {
  "Vacina": "vacina",
  "Consulta": "consulta",
  "Exame": "exame",
  "Vermífugo": "vermifugo",
  "Medicação": "medicacao",
  "Procedimento": "procedimento",
  "Outro": "outro",
};

const typeToCategory: Record<string, string> = {
  "vacina": "Vacina",
  "consulta": "Consulta",
  "exame": "Exame",
  "vermifugo": "Vermífugo",
  "medicacao": "Medicação",
  "procedimento": "Procedimento",
  "outro": "Outro",
};

const typeToIcon: Record<string, typeof Syringe> = {
  "vacina": Syringe,
  "consulta": CalendarIcon,
  "exame": CalendarIcon,
  "vermifugo": CalendarIcon,
  "medicacao": CalendarIcon,
  "procedimento": CalendarIcon,
  "outro": CalendarIcon,
};

function daysAgo(date: Date): number {
  const diff = today.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isNextWeek(date: Date): boolean {
  const startOfNextWeek = new Date(today);
  startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  return date >= today && date >= startOfNextWeek && date < endOfNextWeek;
}

function isNextMonth(date: Date): boolean {
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return date >= nextMonth && date <= endNextMonth;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function Agenda() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>(initialEventos);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [activeSection, setActiveSection] = useState<"atrasadas" | "proxima-semana" | "proximo-mes" | null>(null);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [eventType, setEventType] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  // Detail dialog
  const [detailEvent, setDetailEvent] = useState<Evento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Evento | null>(null);

  const sectionRefs = {
    atrasadas: useRef<HTMLDivElement>(null),
    "proxima-semana": useRef<HTMLDivElement>(null),
    "proximo-mes": useRef<HTMLDivElement>(null),
  };

  const overdue = eventos.filter((e) => e.date < today);
  const nextWeek = eventos.filter((e) => isNextWeek(e.date));
  const nextMonth = eventos.filter((e) => isNextMonth(e.date));

  const selectedDayEvents = eventos.filter(
    (e) => selectedDate && e.date.toDateString() === selectedDate.toDateString()
  );

  const eventDates = eventos.map((e) => e.date);

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
    setEditingEvent(null);
    setEventType("");
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (evento: Evento) => {
    setEditingEvent(evento);
    setEventType(categoryToType[evento.category] || "outro");
    setEventTitle(evento.title);
    setEventDate(formatDateForInput(evento.date));
    setEventTime(evento.time || "");
    setEventNotes(evento.notes || "");
    setDetailOpen(false);
    setDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (!eventType || !eventTitle || !eventDate) return;

    const category = typeToCategory[eventType] || "Outro";
    const icon = typeToIcon[eventType] || CalendarIcon;
    const date = new Date(eventDate + "T12:00:00");

    if (editingEvent) {
      setEventos((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? { ...e, title: eventTitle, category, date, icon, time: eventTime, notes: eventNotes, overdue: date < today }
            : e
        )
      );
      toast({ title: "Evento atualizado", description: `"${eventTitle}" foi atualizado com sucesso.` });
    } else {
      const newEvent: Evento = {
        id: Date.now().toString(),
        title: eventTitle,
        category,
        date,
        icon,
        time: eventTime,
        notes: eventNotes,
        overdue: date < today,
      };
      setEventos((prev) => [...prev, newEvent]);
      toast({ title: "Evento criado", description: `"${eventTitle}" foi adicionado à agenda.` });
    }
    resetEventForm();
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;
    setEventos((prev) => prev.filter((e) => e.id !== eventToDelete.id));
    toast({ title: "Evento excluído", description: `"${eventToDelete.title}" foi removido da agenda.`, variant: "destructive" });
    setEventToDelete(null);
    setDeleteConfirmOpen(false);
    setDetailOpen(false);
  };

  const openEventDetail = (evento: Evento) => {
    setDetailEvent(evento);
    setDetailOpen(true);
  };

  const handleCardClick = (section: "atrasadas" | "proxima-semana" | "proximo-mes") => {
    setActiveSection(section);
    setTimeout(() => {
      sectionRefs[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderEventCard = (evento: Evento) => {
    const days = daysAgo(evento.date);
    const isOverdue = evento.date < today;

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
          <evento.icon className={`h-5 w-5 ${isOverdue ? "text-destructive" : "text-accent"}`} />
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
            {isOverdue ? `Há ${days} dias` : `Em ${Math.abs(days)} dias`}
          </p>
          <p className="text-xs text-muted-foreground">{formatDate(evento.date)}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    );
  };

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
            <div className="space-y-2">{overdue.map(renderEventCard)}</div>
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
              {detailEvent && <detailEvent.icon className="h-5 w-5 text-accent" />}
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
                {detailEvent.date < today && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Atrasado há {daysAgo(detailEvent.date)} dias
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
                disabled={!eventType || !eventTitle || !eventDate}
                onClick={handleSaveEvent}
              >
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
