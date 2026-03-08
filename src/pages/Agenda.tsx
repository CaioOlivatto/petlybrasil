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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface Evento {
  id: string;
  title: string;
  category: string;
  date: Date;
  icon: typeof Syringe;
  overdue?: boolean;
}

const today = new Date();

const mockEventos: Evento[] = [
  { id: "1", title: "V8/V10 - 1ª dose", category: "Vacina", date: new Date(2025, 0, 30), icon: Syringe, overdue: true },
  { id: "2", title: "Gripe - 1ª dose", category: "Vacina", date: new Date(2025, 1, 13), icon: Syringe, overdue: true },
  { id: "3", title: "Giárdia - 1ª dose", category: "Vacina", date: new Date(2025, 1, 13), icon: Syringe, overdue: true },
  { id: "4", title: "V8/V10 - 2ª dose", category: "Vacina", date: new Date(2025, 1, 27), icon: Syringe, overdue: true },
  { id: "5", title: "Raiva - Dose única", category: "Vacina", date: new Date(2025, 2, 13), icon: Syringe, overdue: true },
  { id: "6", title: "Consulta de rotina", category: "Consulta", date: new Date(2026, 2, 12), icon: CalendarIcon },
  { id: "7", title: "Vermífugo trimestral", category: "Vermífugo", date: new Date(2026, 2, 15), icon: CalendarIcon },
  { id: "8", title: "Exame de sangue", category: "Exame", date: new Date(2026, 3, 5), icon: CalendarIcon },
];

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

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [activeSection, setActiveSection] = useState<"atrasadas" | "proxima-semana" | "proximo-mes" | null>(null);

  const sectionRefs = {
    atrasadas: useRef<HTMLDivElement>(null),
    "proxima-semana": useRef<HTMLDivElement>(null),
    "proximo-mes": useRef<HTMLDivElement>(null),
  };

  const overdue = mockEventos.filter((e) => e.date < today);
  const nextWeek = mockEventos.filter((e) => isNextWeek(e.date));
  const nextMonth = mockEventos.filter((e) => isNextMonth(e.date));

  const selectedDayEvents = mockEventos.filter(
    (e) => selectedDate && e.date.toDateString() === selectedDate.toDateString()
  );

  const eventDates = mockEventos.map((e) => e.date);

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
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors cursor-pointer ${
          isOverdue
            ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
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
              <p className="text-sm text-muted-foreground">Eventos e alertas de Lilly</p>
            </div>
          </div>
        </div>
        <Button className="h-12 px-6 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
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
        {/* Calendar */}
        <div className="space-y-4">
          <div className="border-2 border-accent/20 rounded-2xl p-4 bg-background">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                event: eventDates,
              }}
              modifiersClassNames={{
                event: "bg-accent/20 font-bold",
              }}
              className="rounded-xl"
            />
          </div>

          {/* Selected day events */}
          <div className="border-2 border-accent/20 rounded-2xl p-4 bg-background">
            <h3 className="font-bold text-foreground mb-2">
              {selectedDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((e) => (
                  <div key={e.id} className="text-sm text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {e.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event lists */}
        <div className="space-y-5">
          {/* Atrasadas */}
          <div ref={sectionRefs.atrasadas}>
            <h2 className="flex items-center gap-2 text-base font-bold text-destructive mb-3">
              <CalendarIcon className="h-4 w-4" />
              Atrasados ({overdue.length})
            </h2>
            <div className="space-y-2">
              {overdue.map(renderEventCard)}
            </div>
          </div>

          {/* Próxima semana */}
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

          {/* Próximo mês */}
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
    </div>
  );
}
