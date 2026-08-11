import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye, Lightbulb } from "lucide-react";
import { useRef } from "react";
import petlyLogo from "@/assets/petly-logo.png";
import type { Database } from "@/integrations/supabase/types";

type Pet = Database["public"]["Tables"]["pets"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  pet: Pet | null;
  profile: Profile | null;
}

export function QRCodeSection({ pet, profile }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const petName = pet?.name || "seu pet";

  const qrValue = `${window.location.origin}/emergency?token=${pet?.emergency_token || ""}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qrcode-${petName}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-bold text-foreground">QR Code de Emergência</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Ao escanear, o QR Code abre a ficha completa do {petName} com dados médicos, bem-estar e contatos do tutor.
      </p>

      <div className="flex justify-center mb-6">
        <div ref={qrRef} className="border-2 border-accent/30 rounded-2xl p-8 bg-card">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="M"
            imageSettings={{
              src: petlyLogo,
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-6">
        Ao escanear o QR Code, a ficha completa abre<br />direto no celular.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Button onClick={handlePrint} className="flex-1 bg-accent hover:bg-accent/90">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
        <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Baixar QR Code
        </Button>
      </div>

      <div className="text-center mb-6">
        <a href={qrValue} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto justify-center">
          <Eye className="h-4 w-4" />
          Ver prévia do documento
        </a>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Dica:</p>
            <p className="text-sm text-muted-foreground">
              O QR Code inclui medicamentos ativos, últimas consultas, procedimentos, histórico de bem-estar e observações recentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
