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
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
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

  // Match documents to document types by name
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Documentos</h1>
              <p className="text-sm text-muted-foreground">
                Documentação completa de {pet?.name || "seu pet"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/prontuario")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors shadow-lg"
        >
          <FileText className="h-4 w-4" />
          Adicionar via Prontuário
        </button>
      </div>

      {/* Document type cards overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {documentTypes.map((type) => {
          const count = documents.filter((d) => getDocTypeForRecord(d.name) === type.key).length;
          const Icon = type.icon;
          return (
            <div
              key={type.key}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                count > 0
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-background opacity-60"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                count > 0 ? "bg-accent/15" : "bg-muted"
              }`}>
                <Icon className={`h-5 w-5 ${count > 0 ? "text-accent" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{type.label}</p>
                <p className="text-xs text-muted-foreground">
                  {count > 0 ? `${count} documento(s)` : "Nenhum"}
                </p>
              </div>
            </div>
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
            Vá ao Prontuário e adicione registros na categoria "Documento"
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
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-accent/20 bg-background hover:border-accent/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(doc.date)}</span>
                    {typeInfo && <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">{typeInfo.label}</span>}
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
