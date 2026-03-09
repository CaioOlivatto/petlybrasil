import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye, Lightbulb } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import petlyLogo from "@/assets/petly-logo.png";

interface Props {
  pet: any;
  profile: any;
}

export function QRCodeSection({ pet, profile }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [extraData, setExtraData] = useState<any>(null);

  const petName = pet?.name || "seu pet";

  useEffect(() => {
    if (!pet?.id || !user?.id) return;

    const fetchExtraData = async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch active medications (no end date or end date >= today)
      const { data: meds } = await supabase
        .from("medical_records")
        .select("name, date, frequency, usage_end_date, notes")
        .eq("pet_id", pet.id)
        .eq("user_id", user.id)
        .eq("category", "medicacao")
        .or(`usage_end_date.gte.${today},usage_end_date.is.null`)
        .order("date", { ascending: false })
        .limit(5);

      // Fetch last consultations
      const { data: consults } = await supabase
        .from("medical_records")
        .select("name, date, notes")
        .eq("pet_id", pet.id)
        .eq("user_id", user.id)
        .eq("category", "consulta")
        .order("date", { ascending: false })
        .limit(3);

      // Fetch recent procedures (exame, cirurgia)
      const { data: procedures } = await supabase
        .from("medical_records")
        .select("name, date, category, notes")
        .eq("pet_id", pet.id)
        .eq("user_id", user.id)
        .in("category", ["exame", "cirurgia"])
        .order("date", { ascending: false })
        .limit(3);

      // Fetch recent daily checkins for wellness & travel
      const { data: checkins } = await supabase
        .from("daily_checkins")
        .select("date, energia, apetite, humor, sono, mudanca_rotina, observacoes")
        .eq("pet_id", pet.id)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      setExtraData({
        medications: meds?.map(m => ({
          name: m.name,
          date: m.date,
          frequency: m.frequency,
          end: m.usage_end_date,
        })) || [],
        consultations: consults?.map(c => ({
          name: c.name,
          date: c.date,
          notes: c.notes?.slice(0, 60),
        })) || [],
        procedures: procedures?.map(p => ({
          name: p.name,
          date: p.date,
          cat: p.category,
        })) || [],
        wellness: checkins?.map(c => ({
          date: c.date,
          e: c.energia,
          a: c.apetite,
          h: c.humor,
          s: c.sono,
        })) || [],
        travel: checkins?.some(c => c.mudanca_rotina && c.mudanca_rotina !== "nenhuma")
          ? checkins.filter(c => c.mudanca_rotina && c.mudanca_rotina !== "nenhuma").map(c => ({
              date: c.date,
              reason: c.mudanca_rotina,
            })).slice(0, 2)
          : [],
        observations: checkins
          ?.filter(c => c.observacoes)
          .map(c => ({ date: c.date, text: c.observacoes?.slice(0, 80) }))
          .slice(0, 2) || [],
      });
    };

    fetchExtraData();
  }, [pet?.id, user?.id]);

  const emergencyData = JSON.stringify({
    pet: pet ? {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      birth_date: pet.birth_date,
      weight: pet.weight,
      blood_type: pet.blood_type,
      allergies: pet.allergies,
      health_conditions: pet.health_conditions,
      is_neutered: pet.is_neutered,
    } : null,
    tutor: profile ? {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
    } : null,
    ...(extraData || {}),
  });

  const qrValue = `${window.location.origin}/emergency?data=${encodeURIComponent(btoa(emergencyData))}`;

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

      {/* QR Code display */}
      <div className="flex justify-center mb-6">
        <div ref={qrRef} className="border-2 border-accent/30 rounded-2xl p-8 bg-card">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="L"
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
        <a href={qrValue} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto justify-center">
          <Eye className="h-4 w-4" />
          Ver prévia do documento
        </a>
      </div>

      {/* Tip */}
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
