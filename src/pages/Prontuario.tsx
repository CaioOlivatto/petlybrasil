import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Filter,
  Syringe,
  Stethoscope,
  Bug,
  Pill,
  Wrench,
  Plane,
  FileCheck,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ImageOff,
  Upload,
  Camera,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const categories = [
  { key: "vacina", label: "Vacina", icon: Syringe },
  { key: "exame", label: "Exame", icon: FileCheck },
  { key: "consulta", label: "Consulta", icon: Stethoscope },
  { key: "vermifugo", label: "Vermífugo", icon: Bug },
  { key: "medicacao", label: "Medicação", icon: Pill },
  { key: "procedimento", label: "Procedimento", icon: Wrench },
  { key: "viagem", label: "Viagem", icon: Plane },
  { key: "documento", label: "Documento", icon: FileText },
  { key: "observacao", label: "Observação", icon: MessageSquare },
];

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
}

export default function Prontuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pet, setPet] = useState<any>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user || !pet) return;
    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
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
    if (!user) return;
    supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPet(data);
        else setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (pet) fetchRecords();
  }, [pet, fetchRecords]);

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
  };

  const handleSave = async () => {
    if (!user || !pet || !selectedCategory || !newName || !newDate) return;
    setSaving(true);

    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      // Upload attachment if present
      if (attachedFile) {
        const ext = attachedFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-attachments")
          .upload(path, attachedFile, { upsert: true });

        if (uploadError) {
          toast.error("Erro ao enviar anexo: " + uploadError.message);
        } else {
          const { data } = supabase.storage.from("medical-attachments").getPublicUrl(path);
          attachment_url = data.publicUrl;
          attachment_name = attachedFile.name;
        }
      }

      const { error } = await supabase.from("medical_records").insert({
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
      } as any);

      if (error) throw error;

      toast.success("Registro salvo com sucesso!");
      resetForm();
      fetchRecords();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", recordToDelete.id);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Registro excluído!");
      fetchRecords();
    }
    setRecordToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pt-BR");
  };

  const isExpired = (validityDate: string | null) => {
    if (!validityDate) return false;
    return new Date(validityDate) < new Date();
  };

  const isExpiringSoon = (validityDate: string | null) => {
    if (!validityDate) return false;
    const d = new Date(validityDate);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  const filteredRecords = records.filter((r) => {
    const matchCategory = activeFilter === "todas" || r.category === activeFilter;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const groupedRecords = filteredRecords.reduce<{ [key: string]: MedicalRecord[] }>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const categoryCount = (key: string) =>
    records.filter((r) => key === "todas" || r.category === key).length;

  const getCategoryInfo = (key: string) => categories.find((c) => c.key === key);

  const filterTabs = [
    { key: "todas", label: "Todas" },
    ...categories.filter((c) => records.some((r) => r.category === c.key)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
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
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Prontuário</h1>
              <p className="text-sm text-muted-foreground">Histórico completo de {pet?.name || "seu pet"}</p>
            </div>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5 text-accent" />
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
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-muted-foreground hover:border-accent/50"
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

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Data *</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Validity toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Tem validade?</label>
                <button
                  onClick={() => setHasValidity(!hasValidity)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${hasValidity ? "bg-accent" : "bg-muted"}`}
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

              {/* Observations */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Observações</label>
                <textarea
                  placeholder="Digite algo que aconteceu hoje..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Attachment */}
              {selectedCategory && categoriesWithAttachment.includes(selectedCategory) && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Anexo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Enviar Arquivo</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors">
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
                    <p className="text-xs text-accent font-medium mt-1">
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
                  className="h-12 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
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

      {/* Filter tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtrar por categoria:
        </div>
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const count = categoryCount(tab.key);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-background text-muted-foreground border border-border hover:border-accent/50"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-accent-foreground/20" : "bg-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar registros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 bg-background rounded-xl text-base"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            Vencido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Vencendo em 7 dias
          </span>
        </div>
        <span className="hidden sm:inline text-accent italic">
          Clique em um registro para ver detalhes e baixar anexos
        </span>
      </div>

      {/* Records grouped by category */}
      {Object.keys(groupedRecords).length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-background">
          <ImageOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum registro ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Clique em "+ Novo Registro" para começar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedRecords).map(([catKey, catRecords]) => {
            const catInfo = getCategoryInfo(catKey);
            const isExpanded = expandedCategory === catKey;
            const Icon = catInfo?.icon || FileText;

            return (
              <div key={catKey} className="border-2 border-accent/20 rounded-2xl bg-background overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-base">{catInfo?.label}</p>
                      <p className="text-xs text-muted-foreground">{catRecords.length} registro(s)</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/30">
                            <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Nome</th>
                            <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Data</th>
                            <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Validade</th>
                            <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Observações</th>
                            <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Anexo</th>
                            <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catRecords.map((record) => (
                            <tr
                              key={record.id}
                              className="border-t border-border/50 hover:bg-accent/5 transition-colors"
                            >
                              <td className="px-5 py-4 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  {isExpired(record.validity_date) && <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />}
                                  {isExpiringSoon(record.validity_date) && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                                  {record.name}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-muted-foreground">{formatDate(record.date)}</td>
                              <td className="px-5 py-4 text-muted-foreground">
                                {record.validity_date ? formatDate(record.validity_date) : "-"}
                              </td>
                              <td className="px-5 py-4 text-muted-foreground max-w-[200px] truncate">{record.notes || "-"}</td>
                              <td className="px-5 py-4 text-center">
                                {record.attachment_url ? (
                                  <a href={record.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline text-xs">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {record.attachment_name || "Ver"}
                                  </a>
                                ) : (
                                  <ImageOff className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                                )}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  onClick={() => { setRecordToDelete(record); setDeleteConfirmOpen(true); }}
                                  className="text-destructive hover:text-destructive/80 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y divide-border/50">
                      {catRecords.map((record) => (
                        <div key={record.id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpired(record.validity_date) && <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />}
                              {isExpiringSoon(record.validity_date) && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
                              <p className="font-medium text-foreground">{record.name}</p>
                            </div>
                            <button
                              onClick={() => { setRecordToDelete(record); setDeleteConfirmOpen(true); }}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.date)}
                            </span>
                            {record.validity_date && (
                              <span>Val: {formatDate(record.validity_date)}</span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground">{record.notes}</p>
                          )}
                          {record.attachment_url && (
                            <a href={record.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent text-xs hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              {record.attachment_name || "Ver anexo"}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
