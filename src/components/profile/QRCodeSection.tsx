import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye, Lightbulb } from "lucide-react";
import { useRef } from "react";
import petlyLogo from "@/assets/petly-logo.png";

interface Props {
  pet: any;
  profile: any;
}

export function QRCodeSection({ pet, profile }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const petName = pet?.name || "seu pet";

  // The QR code will encode a URL that could resolve to a public emergency page
  // For now, encode the pet data as a data URI
  const emergencyData = JSON.stringify({
    pet: pet ? {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      birth_date: pet.birth_date,
      weight: pet.weight,
      blood_type: pet.blood_type,
    } : null,
    tutor: profile ? {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
    } : null,
  });

  const qrValue = `https://petly.app/emergency?data=${encodeURIComponent(btoa(emergencyData))}`;

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
        Ao escanear, o QR Code abre o prontuário em PDF do {petName} (com dados do pet e do tutor).
      </p>

      {/* QR Code display */}
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
        Ao escanear o QR Code, o prontuário abre direto<br />em PDF no celular.
      </p>

      {/* Buttons */}
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
        <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
          <Eye className="h-4 w-4" />
          Ver prévia do documento
        </button>
      </div>

      {/* Tip */}
      <div className="bg-muted/50 rounded-xl p-4 border border-border">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Dica:</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Imprimir / Salvar PDF" para gerar um documento completo com todos os dados do pet. No celular, escolha "Salvar como PDF" para manter uma cópia digital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
