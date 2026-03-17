import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  FileText,
  Award,
  Home,
  Users,
  Heart,
  ShieldCheck,
  Globe,
  Loader2,
  ExternalLink,
  ImageOff,
  Trash2,
  Search,
  Upload,
  Camera,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface DocumentRecord {
  id: string;
  name: string;
  date: string;
  notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
}

const documentTypes = [
  { key: "pedigree", label: "Pedigree", icon: Award, description: "Registro genealógico oficial" },
  { key: "canil", label: "Registro de Canil", icon: Home, description: "Documentação do canil de origem" },
  { key: "pais", label: "Documentos dos Pais", icon: Users, description: "Pedigree ou registros dos pais" },
  { key: "microchip", label: "Microchip", icon: ShieldCheck, description: "Certificado de microchipagem" },
  { key: "seguro", label: "Seguro Pet", icon: Heart, description: "Apólice de seguro do animal" },
  { key: "passaporte", label: "Passaporte Pet", icon: Globe, description: "Passaporte para viagens internacionais" },
  { key: "registro", label: "Registro Municipal", icon: FileText, description: "Registro na prefeitura/CCZ" },
  { key: "contrato", label: "Contrato de Adoção/Compra", icon: FileText, description: "Contrato de aquisição do pet" },
  { key: "outro", label: "Outros Documentos", icon: FileText, description: "Outros documentos relevantes" },
];

export default function Documentos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DocumentRecord | null>(null);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof documentTypes[0] | null>(null);
  const [docName, setDocName] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [docNotes, setDocNotes] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

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

  const fetchDocuments = useCallback(async () => {
    if (!user || !pet) return;
    const { data, error } = await supabase
      .from("medical_records")
      .select("id, name, date, notes, attachment_url, attachment_name")
      .eq("user_id", user.id)
      .eq("pet_id", pet.id)
      .eq("category", "documento")
      .order("date", { ascending: false });

    if (!error && data) setDocuments(data);
    setLoading(false);
  }, [user, pet]);

  useEffect(() => {
    if (pet) fetchDocuments();
  }, [pet, fetchDocuments]);

  const openCreateDialog = (type: typeof documentTypes[0]) => {
    setSelectedType(type);
    setDocName(type.label);
    setDocDate(new Date().toISOString().split("T")[0]);
    setDocNotes("");
    setAttachedFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setDocName("");
    setDocNotes("");
    setAttachedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!user || !pet || !docName || !docDate) return;
    setSaving(true);

    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;

      if (attachedFile) {
        const ext = attachedFile.name.split(".").pop();
        const path = `${user.id}/${pet.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-attachments")
          .upload(path, attachedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("medical-attachments")
          .getPublicUrl(path);

        attachment_url = data.publicUrl;
        attachment_name = attachedFile.name;
      }

      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        pet_id: pet.id,
        category: "documento",
        name: docName,
        date: docDate,
        notes: docNotes || null,
        attachment_url,
        attachment_name,
      } as any);

      if (error) throw error;

      toast.success("Documento salvo com sucesso!");
      resetForm();
      fetchDocuments();
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
      toast.success("Documento excluído!");
      fetchDocuments();
    }
    setRecordToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
  };

  const filteredDocuments = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDocTypeForRecord = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("pedigree")) return "pedigree";
    if (lower.includes("canil")) return "canil";
    if (lower.includes("pai") || lower.includes("mãe") || lower.includes("mae")) return "pais";
    if (lower.includes("microchip") || lower.includes("chip")) return "microchip";
    if (lower.includes("seguro")) return "seguro";
    if (lower.includes("passaporte")) return "passaporte";
    if (lower.includes("registro") || lower.includes("municipal") || lower.includes("ccz")) return "registro";
    if (lower.includes("contrato") || lower.includes("adoção") || lower.includes("adocao") || lower.includes("compra")) return "contrato";
    return "outro";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documentos</h1>
              <p className="text-sm text-muted-foreground">
                Documentação completa de {pet?.name || "seu pet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Document type cards - clickable to create */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {documentTypes.map((type) => {
          const count = documents.filter((d) => getDocTypeForRecord(d.name) === type.key).length;
          const Icon = type.icon;
          return (
            <button
              key={type.key}
              onClick={() => openCreateDialog(type)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left cursor-pointer hover:shadow-md ${
                count > 0
                  ? "border-primary/30 bg-primary/5 hover:border-primary/60"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                count > 0 ? "bg-primary/15" : "bg-muted"
              }`}>
                <Icon className={`h-5 w-5 ${count > 0 ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate">{type.label}</p>
                <p className="text-xs text-muted-foreground">
                  {count > 0 ? `${count} doc(s)` : "Clique para adicionar"}
                </p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Search */}
      {documents.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-background rounded-xl text-base"
          />
        </div>
      )}

      {/* Documents list */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-background">
          <ImageOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum documento cadastrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Clique em um tipo de documento acima para começar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const typeKey = getDocTypeForRecord(doc.name);
            const typeInfo = documentTypes.find((t) => t.key === typeKey);
            const Icon = typeInfo?.icon || FileText;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(doc.date)}</span>
                    {typeInfo && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{typeInfo.label}</span>}
                  </div>
                  {doc.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{doc.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.attachment_url ? (
                    <a
                      href={doc.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline text-xs font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </a>
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                  )}
                  <button
                    onClick={() => { setRecordToDelete(doc); setDeleteConfirmOpen(true); }}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedType && <selectedType.icon className="h-5 w-5 text-accent" />}
              {selectedType?.label || "Novo Documento"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedType?.description}</p>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nome / Título *</label>
              <Input
                placeholder="Ex: Pedigree CBKC"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Data *</label>
              <Input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Observações</label>
              <textarea
                placeholder="Detalhes adicionais sobre o documento..."
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" className="h-12 text-base rounded-xl" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                className="h-12 text-base font-semibold rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!docName || !docDate || saving}
                onClick={handleSave}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento "{recordToDelete?.name}" será excluído permanentemente.
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
