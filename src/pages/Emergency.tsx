import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { PawPrint, Phone, Mail, Heart, AlertTriangle, Droplets, Weight, Calendar } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import petlyLogo from "@/assets/petly-logo.png";

export default function Emergency() {
  const [params] = useSearchParams();

  const data = useMemo(() => {
    try {
      const raw = params.get("data");
      if (!raw) return null;
      return JSON.parse(atob(raw));
    } catch {
      return null;
    }
  }, [params]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-800">QR Code inválido</h1>
          <p className="text-red-600 mt-2">Não foi possível ler os dados deste QR Code.</p>
        </div>
      </div>
    );
  }

  const { pet, tutor } = data;

  const petAge = pet?.birth_date
    ? (() => {
        const birth = new Date(pet.birth_date + "T12:00:00");
        const years = differenceInYears(new Date(), birth);
        const months = differenceInMonths(new Date(), birth) % 12;
        if (years > 0) return `${years} ano${years > 1 ? "s" : ""}${months > 0 ? ` e ${months} mes${months > 1 ? "es" : ""}` : ""}`;
        return `${months} mes${months > 1 ? "es" : ""}`;
      })()
    : null;

  const sexLabel = pet?.sex === "male" ? "Macho" : pet?.sex === "female" ? "Fêmea" : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <div>
            <h1 className="text-lg font-bold">Ficha de Emergência Veterinária</h1>
            <p className="text-red-100 text-sm">Dados gerados pelo Petly</p>
          </div>
          <img src={petlyLogo} alt="Petly" className="h-8 w-8 ml-auto" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Pet info */}
        {pet && (
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-red-600" />
                <h2 className="font-bold text-red-800 text-lg">Dados do Pet</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow label="Nome" value={pet.name} highlight />
              <InfoRow label="Espécie" value={pet.species === "dog" ? "🐕 Cachorro" : pet.species === "cat" ? "🐈 Gato" : pet.species} />
              <InfoRow label="Raça" value={pet.breed} />
              {sexLabel && <InfoRow label="Sexo" value={sexLabel} />}
              {petAge && (
                <InfoRow label="Idade" value={petAge} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
              )}
              {pet.weight && (
                <InfoRow label="Peso" value={`${pet.weight} kg`} icon={<Weight className="h-4 w-4 text-muted-foreground" />} />
              )}
              {pet.blood_type && (
                <InfoRow label="Tipo Sanguíneo" value={pet.blood_type} icon={<Droplets className="h-4 w-4 text-red-500" />} highlight />
              )}
              {pet.allergies && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">⚠️ ALERGIAS</p>
                  <p className="text-sm text-yellow-900">{pet.allergies}</p>
                </div>
              )}
              {pet.health_conditions && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-800 mb-1">🏥 CONDIÇÕES DE SAÚDE</p>
                  <p className="text-sm text-orange-900">{pet.health_conditions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tutor info */}
        {tutor && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-blue-800 text-lg">Tutor / Responsável</h2>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow label="Nome" value={tutor.name} highlight />
              {tutor.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Telefone</span>
                  <a href={`tel:${tutor.phone}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 underline">
                    <Phone className="h-4 w-4" />
                    {tutor.phone}
                  </a>
                </div>
              )}
              {tutor.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <a href={`mailto:${tutor.email}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 underline">
                    <Mail className="h-4 w-4" />
                    {tutor.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2 pb-8">
          Gerado pelo Petly • petlybrasil.lovable.app
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, highlight }: { label: string; value?: string | null; icon?: React.ReactNode; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-sm ${highlight ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
