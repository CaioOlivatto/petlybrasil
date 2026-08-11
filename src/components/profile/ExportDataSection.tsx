import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { Database } from "@/integrations/supabase/types";

type Pet = Database["public"]["Tables"]["pets"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  pet: Pet | null;
  profile: Profile | null;
}

const escapeHtml = (value: unknown) => String(value ?? "-")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export function ExportDataSection({ pet, profile }: Props) {
  const petName = pet?.name || "Pet";

  const buildPetSummary = () => {
    const lines: string[][] = [];
    
    // Tutor info
    lines.push(["=== DADOS DO TUTOR ===", ""]);
    lines.push(["Nome", profile?.name || "-"]);
    lines.push(["Email", profile?.email || "-"]);
    lines.push(["Telefone", profile?.phone || "-"]);
    lines.push(["Data de Nascimento", profile?.birthday || "-"]);
    lines.push([]);
    
    // Pet info
    lines.push(["=== DADOS DO PET ===", ""]);
    lines.push(["Nome", pet?.name || "-"]);
    lines.push(["Espécie", pet?.species === "dog" ? "Cachorro" : pet?.species === "cat" ? "Gato" : pet?.species || "-"]);
    lines.push(["Raça", pet?.breed || "-"]);
    lines.push(["Sexo", pet?.sex === "male" ? "Macho" : pet?.sex === "female" ? "Fêmea" : pet?.sex || "-"]);
    lines.push(["Data de Nascimento", pet?.birth_date || "-"]);
    lines.push(["Peso (kg)", pet?.weight ? String(pet.weight) : "-"]);
    lines.push(["Tipo Sanguíneo", pet?.blood_type || "-"]);
    lines.push(["Castrado", pet?.is_neutered ? "Sim" : "Não"]);
    lines.push(["Alergias", pet?.allergies || "Nenhuma"]);
    lines.push(["Condições de Saúde", pet?.health_conditions || "Nenhuma"]);
    lines.push(["Canil", pet?.kennel || "-"]);
    lines.push(["Pedigree", pet?.pedigree || "-"]);
    lines.push(["Nome da Mãe", pet?.mother_name || "-"]);
    lines.push(["Nome do Pai", pet?.father_name || "-"]);
    
    return lines;
  };

  const handleExportCSV = () => {
    try {
      const lines = buildPetSummary();
      const csv = lines
        .map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prontuario-${petName.toLowerCase().replace(/\s+/g, "-")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar CSV.");
    }
  };

  const handleExportPDF = () => {
    const species = pet?.species === "dog" ? "Cachorro" : pet?.species === "cat" ? "Gato" : pet?.species || "-";
    const sex = pet?.sex === "male" ? "Macho" : pet?.sex === "female" ? "Fêmea" : pet?.sex || "-";

    const safe = escapeHtml;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prontuário - ${safe(petName)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 4px; color: #7c5cfc; }
          .subtitle { color: #666; font-size: 13px; margin-bottom: 30px; }
          h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #7c5cfc; color: #7c5cfc; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          td { padding: 8px 12px; border: 1px solid #e5e5e5; font-size: 13px; }
          td:first-child { font-weight: 600; width: 180px; background: #f9f9fb; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Prontuário de ${safe(petName)}</h1>
        <p class="subtitle">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>

        <h2>Dados do Tutor</h2>
        <table>
          <tr><td>Nome</td><td>${safe(profile?.name)}</td></tr>
          <tr><td>Email</td><td>${safe(profile?.email)}</td></tr>
          <tr><td>Telefone</td><td>${safe(profile?.phone)}</td></tr>
          <tr><td>Data de Nascimento</td><td>${safe(profile?.birthday)}</td></tr>
        </table>

        <h2>Dados do Pet</h2>
        <table>
          <tr><td>Nome</td><td>${safe(pet?.name)}</td></tr>
          <tr><td>Espécie</td><td>${safe(species)}</td></tr>
          <tr><td>Raça</td><td>${safe(pet?.breed)}</td></tr>
          <tr><td>Sexo</td><td>${safe(sex)}</td></tr>
          <tr><td>Data de Nascimento</td><td>${safe(pet?.birth_date)}</td></tr>
          <tr><td>Peso (kg)</td><td>${safe(pet?.weight)}</td></tr>
          <tr><td>Tipo Sanguíneo</td><td>${safe(pet?.blood_type)}</td></tr>
          <tr><td>Castrado</td><td>${pet?.is_neutered ? "Sim" : "Não"}</td></tr>
          <tr><td>Alergias</td><td>${safe(pet?.allergies || "Nenhuma")}</td></tr>
          <tr><td>Condições de Saúde</td><td>${safe(pet?.health_conditions || "Nenhuma")}</td></tr>
          <tr><td>Canil</td><td>${safe(pet?.kennel)}</td></tr>
          <tr><td>Pedigree</td><td>${safe(pet?.pedigree)}</td></tr>
          <tr><td>Nome da Mãe</td><td>${safe(pet?.mother_name)}</td></tr>
          <tr><td>Nome do Pai</td><td>${safe(pet?.father_name)}</td></tr>
        </table>

        <div class="footer">
          Gerado pelo Petly Brasil &bull; petlybrasil.lovable.app
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      toast.success("PDF pronto para impressão!");
    } else {
      toast.error("Popup bloqueado. Permita popups para exportar o PDF.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">Exportar Dados</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Baixe uma cópia de todos os dados do {petName}, incluindo prontuário e informações do tutor.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors text-left"
        >
          <FileText className="h-5 w-5 text-foreground" />
          <div>
            <p className="font-medium text-foreground">Exportar PDF</p>
            <p className="text-xs text-muted-foreground">Prontuário completo</p>
          </div>
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors text-left"
        >
          <Table className="h-5 w-5 text-foreground" />
          <div>
            <p className="font-medium text-foreground">Exportar CSV</p>
            <p className="text-xs text-muted-foreground">Dados em planilha</p>
          </div>
        </button>
      </div>
    </div>
  );
}
