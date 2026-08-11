import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Syringe,
  Stethoscope,
  Bug,
  Pill,
  Wrench,
  Plane,
  FileCheck,
  MessageSquare,
  Upload,
  Camera,
  Loader2,
  Trash2,
  ExternalLink,
  MoreVertical,
  X,
  ChevronRight,
  ClipboardList,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { usePrimaryPet } from "@/hooks/useAccountData";
import type { Database } from "@/integrations/supabase/types";

type AgendaEventInsert = Database["public"]["Tables"]["agenda_events"]["Insert"];
type SortOrder = "recent" | "oldest" | "category";

const categories = [
  { key: "consulta", label: "Consulta", icon: Stethoscope, color: "hsl(263, 84%, 58%)" },
  { key: "exame", label: "Exame", icon: FileCheck, color: "hsl(217, 91%, 60%)" },
  { key: "vacina", label: "Vacina", icon: Syringe, color: "hsl(160, 84%, 39%)" },
  { key: "vermifugo", label: "Vermífugo", icon: Bug, color: "hsl(38, 92%, 50%)" },
  { key: "medicacao", label: "Medicação", icon: Pill, color: "hsl(187, 96%, 42%)" },
  { key: "procedimento", label: "Procedimento", icon: Wrench, color: "hsl(0, 84%, 60%)" },
  { key: "viagem", label: "Viagem", icon: Plane, color: "hsl(258, 90%, 66%)" },
  { key: "documento", label: "Documento", icon: FileText, color: "hsl(220, 9%, 46%)" },
  { key: "observacao", label: "Observação", icon: MessageSquare, color: "hsl(330, 81%, 60%)" },
];

const categoryColorMap: Record<string, { border: string; bg: string; text: string }> = {
  consulta: { border: "hsl(263, 84%, 58%)", bg: "hsl(263, 87%, 96%)", text: "hsl(263, 84%, 58%)" },
  exame: { border: "hsl(217, 91%, 60%)", bg: "hsl(214, 95%, 93%)", text: "hsl(217, 91%, 60%)" },
  vacina: { border: "hsl(160, 84%, 39%)", bg: "hsl(152, 81%, 96%)", text: "hsl(160, 84%, 39%)" },
  vermifugo: { border: "hsl(38, 92%, 50%)", bg: "hsl(48, 96%, 89%)", text: "hsl(38, 92%, 50%)" },
  medicacao: { border: "hsl(187, 96%, 42%)", bg: "hsl(185, 96%, 90%)", text: "hsl(187, 96%, 42%)" },
  procedimento: { border: "hsl(0, 84%, 60%)", bg: "hsl(0, 93%, 94%)", text: "hsl(0, 84%, 60%)" },
  viagem: { border: "hsl(258, 90%, 66%)", bg: "hsl(258, 90%, 95%)", text: "hsl(258, 90%, 66%)" },
  documento: { border: "hsl(220, 9%, 46%)", bg: "hsl(220, 14%, 96%)", text: "hsl(220, 9%, 46%)" },
  observacao: { border: "hsl(330, 81%, 60%)", bg: "hsl(330, 81%, 96%)", text: "hsl(330, 81%, 60%)" },
};

interface MedicalRecord {
  id: string;
  category: string;
  name: string;
  date: string;
  validity_date: string | null;
  notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  pet_id: string;
  frequency: string | null;
  usage_end_date: string | null;
}

export default function Prontuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: pet, isLoading: petLoading } = usePrimaryPet(user?.id);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Detail drawer
  const [detailRecord, setDetailRecord] = useState<MedicalRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Expanded notes
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [hasValidity, setHasValidity] = useState(false);
  const [validityDate, setValidityDate] = useState("");
  const [observations, setObservations] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [usageEndDate, setUsageEndDate] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startTime, setStartTime] = useState("");

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user || !pet) return;
    const { data, error } = await supabase
      .from("medical_records")
      .select("id, category, name, date, validity_date, notes, attachment_url, attachment_name, pet_id, frequency, usage_end_date")
      .eq("user_id", user.id)
      .eq("pet_id", pet.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar registros:", error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [user, pet]);

  useEffect(() => {
    if (pet) {
      fetchRecords();
    } else if (!petLoading) {
      setLoading(false);
    }
  }, [pet, petLoading, fetchRecords]);

  const categoriesWithAttachment = ["vacina", "exame", "consulta", "vermifugo", "medicacao", "procedimento", "documento"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setNewName("");
    setNewDate("");
    setHasValidity(false);
    setValidityDate("");
    setObservations("");
    setAttachedFile(null);
    setUsageEndDate("");
    setFrequency("");
    setStartTime("");
  };

  const handleSave = async () => {
    if (!user || !pet || !selectedCategory || !newName || !newDate) return;
    setSaving(true);

    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      if (attachedFile) {
        const ext = attachedFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-attachments")
          .upload(path, attachedFile, { upsert: true });

        if (uploadError) {
          toast.error("Erro ao enviar anexo: " + uploadError.message);
        } else {
          attachment_url = path;
          attachment_name = attachedFile.name;
        }
      }

      const { data: insertedRecord, error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        pet_id: pet.id,
        category: selectedCategory,
        name: newName,
        date: newDate,
        validity_date: hasValidity && validityDate ? validityDate : null,
        notes: observations || null,
        attachment_url,
        attachment_name,
        usage_end_date: selectedCategory === "medicacao" && usageEndDate ? usageEndDate : null,
        frequency: selectedCategory === "medicacao" && frequency ? frequency : null,
      }).select().single();

      if (error) throw error;

      // Auto-create agenda events for medications with frequency
      if (selectedCategory === "medicacao" && frequency && frequency !== "sob_demanda" && usageEndDate && startTime) {
        const agendaEvents: AgendaEventInsert[] = [];
        const startDate = new Date(newDate + "T00:00:00");
        const endDate = new Date(usageEndDate + "T00:00:00");

        const frequencyLabels: Record<string, string> = {
          "1x_dia": "1x/dia",
          "2x_dia": "2x/dia (12/12h)",
          "3x_dia": "3x/dia (8/8h)",
          "4x_dia": "4x/dia (6/6h)",
          "semanal": "1x/semana",
        };

        const calcTimes = (freq: string, start: string): string[] => {
          const [h, m] = start.split(":").map(Number);
          const pad = (n: number) => String(n).padStart(2, "0");
          switch (freq) {
            case "1x_dia": return [start];
            case "2x_dia": return [start, `${pad((h + 12) % 24)}:${pad(m)}`];
            case "3x_dia": return [start, `${pad((h + 8) % 24)}:${pad(m)}`, `${pad((h + 16) % 24)}:${pad(m)}`];
            case "4x_dia": return [start, `${pad((h + 6) % 24)}:${pad(m)}`, `${pad((h + 12) % 24)}:${pad(m)}`, `${pad((h + 18) % 24)}:${pad(m)}`];
            default: return [start];
          }
        };

        const times = calcTimes(frequency, startTime);
        let intervalDays = 1;
        if (frequency === "semanal") intervalDays = 7;

        const current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toISOString().split("T")[0];
          for (const t of times) {
            agendaEvents.push({
              user_id: user.id,
              pet_id: pet.id,
              title: `💊 ${newName} - ${t}`,
              category: "medicacao",
              date: dateStr,
              time: t,
              notes: `${frequencyLabels[frequency] || frequency}${observations ? " | " + observations : ""}`,
              source: "medicacao",
              source_record_id: insertedRecord?.id || null,
            });
          }
          current.setDate(current.getDate() + intervalDays);
        }

        if (agendaEvents.length > 0 && agendaEvents.length <= 1000) {
          await supabase.from("agenda_events").insert(agendaEvents);
          toast.success(`${agendaEvents.length} lembretes adicionados à agenda!`);
        }
      }

      // Auto-create single agenda event for non-medication categories
      const agendaCategories = ["consulta", "exame", "procedimento", "vermifugo", "viagem"];
      if (agendaCategories.includes(selectedCategory) && insertedRecord) {
        const categoryIcons: Record<string, string> = {
          consulta: "🩺",
          exame: "📋",
          procedimento: "🔧",
          vermifugo: "🐛",
          viagem: "✈️",
        };
        await supabase.from("agenda_events").insert({
          user_id: user.id,
          pet_id: pet.id,
          title: `${categoryIcons[selectedCategory] || ""} ${newName}`,
          category: selectedCategory,
          date: newDate,
          notes: observations || null,
          source: "prontuario",
          source_record_id: insertedRecord.id,
        });
        toast.success("Evento adicionado à agenda!");
      }

      toast.success("Registro salvo com sucesso!");
      resetForm();
      fetchRecords();
    } catch (error: unknown) {
      toast.error("Erro ao salvar: " + (error instanceof Error ? error.message : "NÃ£o foi possÃ­vel salvar o registro."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    await supabase
      .from("agenda_events")
      .delete()
      .eq("source_record_id", recordToDelete.id);

    await supabase
      .from("agenda_events")
      .delete()
      .eq("source", "medicacao")
      .like("title", `%${recordToDelete.name}%`)
      .eq("user_id", user!.id);

    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", recordToDelete.id);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Registro e agenda excluídos!");
      setDetailOpen(false);
      setDetailRecord(null);
      fetchRecords();
    }
    setRecordToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pt-BR");
  };

  const getStatus = (record: MedicalRecord) => {
    const now = new Date();
    const recordDate = new Date(record.date + "T12:00:00");

    if (record.category === "medicacao" && record.usage_end_date) {
      const endDate = new Date(record.usage_end_date + "T12:00:00");
      if (now >= recordDate && now <= endDate) return "em_andamento";
      if (now > endDate) return "realizado";
      return "previsto";
    }

    return recordDate < now ? "realizado" : "previsto";
  };

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    realizado: { label: "Realizado", bg: "hsl(152, 81%, 96%)", text: "hsl(155, 100%, 19%)", icon: "✓" },
    previsto: { label: "Previsto", bg: "hsl(263, 87%, 96%)", text: "hsl(263, 67%, 35%)", icon: "🕐" },
    em_andamento: { label: "Em andamento", bg: "hsl(48, 96%, 89%)", text: "hsl(26, 90%, 37%)", icon: "⚡" },
  };

  // Filtered & sorted records
  const processedRecords = useMemo(() => {
    let filtered = records.filter((r) => {
      const matchCategory = activeFilter === "todas" || r.category === activeFilter;
      const query = searchQuery.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        formatDate(r.date).includes(query);
      return matchCategory && matchSearch;
    });

    if (sortOrder === "oldest") {
      filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    } else if (sortOrder === "category") {
      filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category) || b.date.localeCompare(a.date));
    } else {
      filtered = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    }

    return filtered;
  }, [records, activeFilter, searchQuery, sortOrder]);

  // Group by month/year for timeline
  const groupedByMonth = useMemo(() => {
    const groups: { label: string; key: string; records: MedicalRecord[] }[] = [];
    const map = new Map<string, MedicalRecord[]>();

    for (const r of processedRecords) {
      const d = new Date(r.date + "T12:00:00");
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ label, key, records: map.get(key)! });
      }
      map.get(key)!.push(r);
    }

    return groups;
  }, [processedRecords]);

  // Summary stats
  const totalRecords = records.length;
  const activeMeds = records.filter((r) => r.category === "medicacao" && getStatus(r) === "em_andamento").length;
  const totalExams = records.filter((r) => r.category === "exame").length;
  const lastConsulta = records.find((r) => r.category === "consulta" && new Date(r.date + "T12:00:00") < new Date());

  const getCategoryInfo = (key: string) => categories.find((c) => c.key === key);

  const getFrequencyLabel = (freq: string | null) => {
    const map: Record<string, string> = {
      "1x_dia": "1x ao dia",
      "2x_dia": "2x ao dia (12/12h)",
      "3x_dia": "3x ao dia (8/8h)",
      "4x_dia": "4x ao dia (6/6h)",
      "semanal": "1x por semana",
      "sob_demanda": "Sob demanda",
    };
    return freq ? map[freq] || freq : null;
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNewRecord = (category?: string) => {
    resetForm();
    if (category) setSelectedCategory(category);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-[860px] mx-auto space-y-5">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto space-y-5">
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
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-[28px] font-bold text-foreground">Prontuário</h1>
              <p className="text-sm text-muted-foreground">Histórico completo de {pet?.name || "seu pet"}</p>
            </div>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5 text-primary" />
                Novo Registro
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-2">
              {/* Category selector */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        selectedCategory === cat.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <cat.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Nome / Título *</label>
                <Input
                  placeholder="Ex: V10 - Polivalente"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Observations - before date for medicacao */}
              {selectedCategory === "medicacao" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Observações</label>
                  <textarea
                    placeholder="Ex: Aplicar 2 gotas em cada olho..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {selectedCategory === "medicacao" ? "Data início *" : "Data *"}
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Medication: Horário + Até quando */}
              {selectedCategory === "medicacao" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Horário de início *</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Utilizar até quando? *</label>
                    <Input
                      type="date"
                      value={usageEndDate}
                      onChange={(e) => setUsageEndDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              )}

              {/* Medication: Frequência */}
              {selectedCategory === "medicacao" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Frequência de uso *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "1x_dia", label: "1x ao dia" },
                      { value: "2x_dia", label: "2x ao dia (12/12h)" },
                      { value: "3x_dia", label: "3x ao dia (8/8h)" },
                      { value: "4x_dia", label: "4x ao dia (6/6h)" },
                      { value: "semanal", label: "1x por semana" },
                      { value: "sob_demanda", label: "Sob demanda" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFrequency(opt.value)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-center ${
                          frequency === opt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Os lembretes serão adicionados automaticamente à sua agenda com os horários calculados
                  </p>
                </div>
              )}

              {/* Non-medication: Validity + Observations */}
              {selectedCategory !== "medicacao" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">Tem validade?</label>
                    <button
                      onClick={() => setHasValidity(!hasValidity)}
                      className={`relative w-12 h-7 rounded-full transition-colors ${hasValidity ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${hasValidity ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  {hasValidity && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Data de validade</label>
                      <Input
                        type="date"
                        value={validityDate}
                        onChange={(e) => setValidityDate(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Observações</label>
                    <textarea
                      placeholder="Digite algo que aconteceu hoje..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </>
              )}

              {/* Attachment */}
              {selectedCategory && categoriesWithAttachment.includes(selectedCategory) && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Anexo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Enviar Arquivo</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Tirar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {attachedFile && (
                    <p className="text-xs text-primary font-medium mt-1">
                      📎 {attachedFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-12 text-base rounded-xl"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button
                  className="h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!selectedCategory || !newName || !newDate || saving}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">O que deseja registrar?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma opção para começar. Você pode preencher o restante depois.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.filter((category) => ["consulta", "medicacao", "exame", "vacina", "vermifugo", "procedimento"].includes(category.key)).map((category) => {
            const Icon = category.icon;
            return (
              <button key={category.key} type="button" onClick={() => openNewRecord(category.key)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Icon className="h-6 w-6 text-primary" />
                {category.key === "medicacao" ? "Remédio" : category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Summary Bar retained for screen-reader context */}
      <div className="sr-only">
        <div className="flex items-center gap-2 px-3 text-[13px] text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="font-semibold">{totalRecords}</span> registros totais
        </div>
        <div className="flex items-center gap-2 px-3 text-[13px] text-foreground">
          <Pill className="h-4 w-4" style={{ color: categoryColorMap.medicacao.border }} />
          <span className="font-semibold">{activeMeds}</span> medicação ativa
        </div>
        <div className="flex items-center gap-2 px-3 text-[13px] text-foreground">
          <FileCheck className="h-4 w-4" style={{ color: categoryColorMap.exame.border }} />
          <span className="font-semibold">{totalExams}</span> exame{totalExams !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2 px-3 text-[13px] text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Última consulta: {lastConsulta ? formatDate(lastConsulta.date) : "—"}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Histórico</h2>
        <p className="text-sm text-muted-foreground">{totalRecords} registro{totalRecords !== 1 ? "s" : ""} de {pet?.name || "seu pet"}</p>
      </div>

      <details open className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Procurar ou filtrar registros</summary>
        <div className="mt-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[{ key: "todas", label: "Todas" }, ...categories].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background text-muted-foreground border border-border hover:border-primary/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, data ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-background rounded-xl text-base"
          />
        </div>
        <Select value={sortOrder} onValueChange={(v) => {
          if (v === "recent" || v === "oldest" || v === "category") setSortOrder(v);
        }}>
          <SelectTrigger className="w-[160px] h-12 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recente</SelectItem>
            <SelectItem value="oldest">Mais antigo</SelectItem>
            <SelectItem value="category">Por categoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

        </div>
      </details>

      {/* Timeline */}
      {processedRecords.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={activeFilter === "todas" ? "Nenhum registro ainda" : `Nenhum registro de ${getCategoryInfo(activeFilter)?.label || activeFilter} ainda`}
          description="Adicione o primeiro registro para começar o histórico"
          actionLabel="+ Novo Registro"
          onAction={() => openNewRecord()}
        />
      ) : (
        <div className="space-y-6">
          {/* Timeline vertical line */}
          <div className="hidden" />

          {groupedByMonth.map((group) => (
            <div key={group.key} className="mb-6">
              {/* Month marker */}
              <div className="flex items-center gap-3 mb-2 py-1">
                <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                  {group.label}
                </span>
                <div className="flex-1 h-[1px] bg-border" />
              </div>

              {/* Records */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
                {group.records.map((record, idx) => {
                  const catInfo = getCategoryInfo(record.category);
                  const colors = categoryColorMap[record.category] || categoryColorMap.documento;
                  const status = getStatus(record);
                  const statusInfo = statusConfig[status];
                  const Icon = catInfo?.icon || FileText;
                  const freqLabel = getFrequencyLabel(record.frequency);
                  const isNotesExpanded = expandedNotes.has(record.id);
                  const notesLong = record.notes && record.notes.length > 120;

                  return (
                    <div key={record.id} className="animate-fade-up" style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}>
                      {/* Timeline dot */}
                      <div className="hidden">
                        <div
                          className="w-[10px] h-[10px] rounded-full mt-5 ring-2 ring-background"
                          style={{ backgroundColor: colors.border, animation: "scalePop 400ms ease-out both", animationDelay: `${idx * 60}ms` }}
                        />
                      </div>

                      {/* Card */}
                      <div
                        className="bg-card p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                        style={{ borderLeftWidth: "4px", borderLeftColor: colors.border }}
                        onClick={() => { setDetailRecord(record); setDetailOpen(true); }}
                      >
                        {/* Row 1: Title + Date + Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-5 w-5 shrink-0" style={{ color: colors.text }} />
                            <span className="font-semibold text-foreground text-base truncate">{record.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[13px] text-muted-foreground">{formatDate(record.date)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button aria-label="Opções do registro" className="p-1 rounded-md hover:bg-muted transition-colors">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRecordToDelete(record); setDeleteConfirmOpen(true); }} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Row 2: Badges */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {catInfo?.label}
                          </span>
                          <span
                            className="hidden"
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                          >
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {status === "em_andamento" && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "hsl(160, 84%, 39%)" }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "hsl(160, 84%, 39%)" }} />
                            </span>
                          )}
                        </div>

                        {/* Row 3: Contextual info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                          {record.category === "medicacao" && (
                            <>
                              {freqLabel && (
                                <span className="flex items-center gap-1">🕐 {freqLabel}</span>
                              )}
                              {record.usage_end_date && (
                                <span className="flex items-center gap-1">📅 {formatDate(record.date)} → {formatDate(record.usage_end_date)}</span>
                              )}
                            </>
                          )}
                          {record.category === "vacina" && record.validity_date && (
                            <span className="flex items-center gap-1">📅 Próxima dose: {formatDate(record.validity_date)}</span>
                          )}
                          {record.category === "vermifugo" && record.validity_date && (
                            <span className="flex items-center gap-1">🔄 Próximo: {formatDate(record.validity_date)}</span>
                          )}
                          {(record.category === "consulta" || record.category === "exame" || record.category === "procedimento") && record.validity_date && (
                            <span className="flex items-center gap-1">📅 Validade: {formatDate(record.validity_date)}</span>
                          )}
                          {record.attachment_url && (
                            <span className="flex items-center gap-1">📎 1 anexo</span>
                          )}
                        </div>

                        {/* Row 4: Notes */}
                        {record.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {record.notes}
                            </p>
                          </div>
                        )}

                        {/* Footer: attachments + details link */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {record.attachment_url && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const { data, error } = await supabase.storage.from("medical-attachments").createSignedUrl(record.attachment_url!, 300);
                                  if (error) return toast.error("Erro ao abrir anexo: " + error.message);
                                  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs text-muted-foreground hover:border-primary/50 border border-transparent transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {record.attachment_name ? (record.attachment_name.length > 20 ? record.attachment_name.slice(0, 20) + "..." : record.attachment_name) : "Ver anexo"}
                              </button>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailRecord(record); setDetailOpen(true); }}
                            className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            Abrir <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {detailRecord && (() => {
                const catInfo = getCategoryInfo(detailRecord.category);
                const Icon = catInfo?.icon || FileText;
                const colors = categoryColorMap[detailRecord.category];
                return (
                  <>
                    <Icon className="h-5 w-5" style={{ color: colors?.text }} />
                    {detailRecord.name}
                  </>
                );
              })()}
            </SheetTitle>
          </SheetHeader>

          {detailRecord && (() => {
            const colors = categoryColorMap[detailRecord.category] || categoryColorMap.documento;
            const status = getStatus(detailRecord);
            const statusInfo = statusConfig[status];
            const catInfo = getCategoryInfo(detailRecord.category);
            const freqLabel = getFrequencyLabel(detailRecord.frequency);

            return (
              <div className="mt-6 space-y-5">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {catInfo?.label}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                  >
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <DetailField label="Data" value={formatDate(detailRecord.date)} />
                  {detailRecord.validity_date && <DetailField label="Validade / Próxima dose" value={formatDate(detailRecord.validity_date)} />}
                  {detailRecord.category === "medicacao" && detailRecord.usage_end_date && (
                    <DetailField label="Período de uso" value={`${formatDate(detailRecord.date)} → ${formatDate(detailRecord.usage_end_date)}`} />
                  )}
                  {freqLabel && <DetailField label="Frequência" value={freqLabel} />}
                  {detailRecord.notes && <DetailField label="Observações" value={detailRecord.notes} />}
                </div>

                {/* Attachment */}
                {detailRecord.attachment_url && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Anexo</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const { data, error } = await supabase.storage.from("medical-attachments").createSignedUrl(detailRecord.attachment_url!, 300);
                        if (error) return toast.error("Erro ao abrir anexo: " + error.message);
                        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-foreground hover:border-primary/50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      {detailRecord.attachment_name || "Ver anexo"}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="destructive"
                    className="w-full rounded-xl h-11"
                    onClick={() => {
                      setRecordToDelete(detailRecord);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir registro
                  </Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro "{recordToDelete?.name}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}
