import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportDataSection() {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-2">Exportar Dados</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Baixe uma cópia de todos os dados do seu pet, incluindo prontuário, diário e eventos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors text-left">
          <Download className="h-5 w-5 text-foreground" />
          <div>
            <p className="font-medium text-foreground">Exportar PDF</p>
            <p className="text-xs text-muted-foreground">Prontuário completo</p>
          </div>
        </button>
        <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors text-left">
          <Download className="h-5 w-5 text-foreground" />
          <div>
            <p className="font-medium text-foreground">Exportar CSV</p>
            <p className="text-xs text-muted-foreground">Dados em planilha</p>
          </div>
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Funcionalidade em desenvolvimento. Em breve você poderá exportar seus dados.
      </p>
    </div>
  );
}
