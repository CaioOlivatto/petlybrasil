import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import {
  PawPrint, Phone, Mail, Heart, AlertTriangle, Droplets, Weight, Calendar,
  Pill, Stethoscope, ClipboardList, Plane, Activity, MessageSquare
} from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import petlyLogo from "@/assets/petly-logo.png";

const energiaLabels: Record<string, string> = { alta: "🔋 Alta", normal: "⚡ Normal", baixa: "🪫 Baixa" };
const apetiteLabels: Record<string, string> = { normal: "🍽️ Normal", aumentado: "🍔 Aumentado", reduzido: "📉 Reduzido", nenhum: "❌ Nenhum" };
const humorLabels: Record<string, string> = { feliz: "😊 Feliz", calmo: "😌 Calmo", ansioso: "😰 Ansioso", triste: "😢 Triste", agressivo: "😡 Agressivo" };
const sonoLabels: Record<string, string> = { normal: "😴 Normal", muito: "💤 Muito", pouco: "👁️ Pouco" };
const travelLabels: Record<string, string> = { viagem: "✈️ Viagem", ausencia_tutor: "🏠 Ausência do tutor", mudanca_ambiente: "🔄 Mudança de ambiente" };

export default function Emergency() {
  const [params] = useSearchParams();

  const data = useMemo(() => {
    try {
      const raw = params.get("data");
      if (!raw) return null;
      return JSON.parse(atob(decodeURIComponent(raw)));
    } catch {
      try {
        const raw = params.get("data");
        if (!raw) return null;
        return JSON.parse(atob(raw));
      } catch {
        return null;
      }
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

  const { pet, tutor, medications, consultations, procedures, wellness, travel, observations } = data;

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

  const formatDate = (d: string) => {
    try { return format(new Date(d + "T12:00:00"), "dd/MM/yyyy"); } catch { return d; }
  };

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
              {petAge && <InfoRow label="Idade" value={petAge} icon={<Calendar className="h-4 w-4 text-gray-400" />} />}
              {pet.weight && <InfoRow label="Peso" value={`${pet.weight} kg`} icon={<Weight className="h-4 w-4 text-gray-400" />} />}
              {pet.blood_type && <InfoRow label="Tipo Sanguíneo" value={pet.blood_type} icon={<Droplets className="h-4 w-4 text-red-500" />} highlight />}
              {pet.is_neutered && <InfoRow label="Castrado" value="Sim" />}
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

        {/* Medications */}
        {medications && medications.length > 0 && (
          <SectionCard title="Medicamentos em Uso" icon={<Pill className="h-5 w-5 text-green-600" />} borderColor="border-green-100" headerBg="bg-green-50" titleColor="text-green-800">
            <div className="space-y-3">
              {medications.map((m: any, i: number) => (
                <div key={i} className="bg-green-50/50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-gray-500">Início: {formatDate(m.date)}</span>
                    {m.end && <span className="text-xs text-gray-500">Término: {formatDate(m.end)}</span>}
                    {m.frequency && <span className="text-xs text-gray-500">Freq: {m.frequency}</span>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Last Consultations */}
        {consultations && consultations.length > 0 && (
          <SectionCard title="Últimas Consultas" icon={<Stethoscope className="h-5 w-5 text-purple-600" />} borderColor="border-purple-100" headerBg="bg-purple-50" titleColor="text-purple-800">
            <div className="space-y-3">
              {consultations.map((c: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    {c.notes && <p className="text-xs text-gray-500 mt-0.5">{c.notes}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(c.date)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Procedures */}
        {procedures && procedures.length > 0 && (
          <SectionCard title="Procedimentos / Exames" icon={<ClipboardList className="h-5 w-5 text-indigo-600" />} borderColor="border-indigo-100" headerBg="bg-indigo-50" titleColor="text-indigo-800">
            <div className="space-y-3">
              {procedures.map((p: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <span className="text-xs text-gray-400">{p.cat === "exame" ? "Exame" : "Cirurgia"}</span>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(p.date)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Wellness */}
        {wellness && wellness.length > 0 && (
          <SectionCard title="Histórico de Bem-Estar" icon={<Activity className="h-5 w-5 text-teal-600" />} borderColor="border-teal-100" headerBg="bg-teal-50" titleColor="text-teal-800">
            <div className="space-y-3">
              {wellness.map((w: any, i: number) => (
                <div key={i} className="bg-teal-50/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">{formatDate(w.date)}</p>
                  <div className="flex flex-wrap gap-2">
                    {w.e && <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-gray-100">{energiaLabels[w.e] || w.e}</span>}
                    {w.a && <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-gray-100">{apetiteLabels[w.a] || w.a}</span>}
                    {w.h && <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-gray-100">{humorLabels[w.h] || w.h}</span>}
                    {w.s && <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-gray-100">{sonoLabels[w.s] || w.s}</span>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Travel / Routine changes */}
        {travel && travel.length > 0 && (
          <SectionCard title="Mudanças de Rotina" icon={<Plane className="h-5 w-5 text-amber-600" />} borderColor="border-amber-100" headerBg="bg-amber-50" titleColor="text-amber-800">
            <div className="space-y-2">
              {travel.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{travelLabels[t.reason] || t.reason}</span>
                  <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Observations */}
        {observations && observations.length > 0 && (
          <SectionCard title="Observações Recentes" icon={<MessageSquare className="h-5 w-5 text-sky-600" />} borderColor="border-sky-100" headerBg="bg-sky-50" titleColor="text-sky-800">
            <div className="space-y-2">
              {observations.map((o: any, i: number) => (
                <div key={i}>
                  <p className="text-xs text-gray-400 mb-0.5">{formatDate(o.date)}</p>
                  <p className="text-sm text-gray-700">{o.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>
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
                  <span className="text-sm text-gray-500">Telefone</span>
                  <a href={`tel:${tutor.phone}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 underline">
                    <Phone className="h-4 w-4" />
                    {tutor.phone}
                  </a>
                </div>
              )}
              {tutor.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Email</span>
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
        <p className="text-center text-xs text-gray-400 pt-2 pb-8">
          Gerado pelo Petly • petlybrasil.lovable.app
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, borderColor, headerBg, titleColor, children }: {
  title: string; icon: React.ReactNode; borderColor: string; headerBg: string; titleColor: string; children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
      <div className={`${headerBg} px-4 py-3 border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className={`font-bold ${titleColor} text-lg`}>{title}</h2>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon, highlight }: { label: string; value?: string | null; icon?: React.ReactNode; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`text-sm ${highlight ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}
