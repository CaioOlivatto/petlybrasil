import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import {
  Syringe,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getVaccinesForSpecies,
  getVaccineStatus,
  type VaccineItem,
} from "@/data/vaccinationCalendar";
import { differenceInDays, format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  pet: any;
}

type VaccinationStatus = "taken" | "not_taken" | "will_not_take" | "pending";

interface VaccinationRecord {
  vaccine_key: string;
  status: VaccinationStatus;
  date_taken: string | null;
  notes: string | null;
}

export function VaccinationSchedule({ pet }: Props) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record<string, VaccinationRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [dateTaken, setDateTaken] = useState<Record<string, string>>({});

  const vaccines = getVaccinesForSpecies(pet?.species || "dog");
  const birthDate = pet?.birth_date ? parseISO(pet.birth_date) : null;
  const petAgeDays = birthDate ? differenceInDays(new Date(), birthDate) : null;

  useEffect(() => {
    if (!pet?.id) return;
    fetchRecords();
  }, [pet?.id]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("pet_vaccinations")
      .select("vaccine_key, status, date_taken, notes")
      .eq("pet_id", pet.id);

    if (data) {
      const map: Record<string, VaccinationRecord> = {};
      data.forEach((r: any) => {
        map[r.vaccine_key] = r;
      });
      setRecords(map);
    }
    setLoading(false);
  };

  const handleStatusChange = async (vaccine: VaccineItem, status: VaccinationStatus) => {
    if (!user || !pet?.id) return;
    setSaving(vaccine.key);

    const existing = records[vaccine.key];
    const dateValue = status === "taken" ? (dateTaken[vaccine.key] || format(new Date(), "yyyy-MM-dd")) : null;

    const payload = {
      pet_id: pet.id,
      user_id: user.id,
      vaccine_key: vaccine.key,
      status,
      date_taken: dateValue,
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("pet_vaccinations")
        .update({ status, date_taken: dateValue })
        .eq("pet_id", pet.id)
        .eq("vaccine_key", vaccine.key));
    } else {
      ({ error } = await supabase.from("pet_vaccinations").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar vacinação");
    } else {
      toast.success(`${vaccine.name} atualizada!`);
      setRecords((prev) => ({
        ...prev,
        [vaccine.key]: { ...payload, notes: null },
      }));
    }
    setSaving(null);
  };

  const getStatusColor = (vaccine: VaccineItem) => {
    const record = records[vaccine.key];
    if (record?.status === "taken") return "border-green-500/30 bg-green-500/5";
    if (record?.status === "will_not_take") return "border-muted bg-muted/20 opacity-60";
    if (record?.status === "not_taken") return "border-destructive/30 bg-destructive/5";
    if (!petAgeDays) return "border-border";
    const urgency = getVaccineStatus(petAgeDays, vaccine.ageDays);
    if (urgency === "overdue") return "border-destructive/40 bg-destructive/5";
    if (urgency === "due") return "border-primary/40 bg-primary/5";
    return "border-border";
  };

  const getUrgencyBadge = (vaccine: VaccineItem) => {
    const record = records[vaccine.key];
    if (record?.status === "taken") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Tomou
        </span>
      );
    }
    if (record?.status === "will_not_take") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          <Ban className="h-3 w-3" /> Não irá tomar
        </span>
      );
    }
    if (record?.status === "not_taken") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
          <XCircle className="h-3 w-3" /> Não tomou
        </span>
      );
    }
    if (!petAgeDays) return null;
    const urgency = getVaccineStatus(petAgeDays, vaccine.ageDays);
    if (urgency === "overdue") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3" /> Atrasada
        </span>
      );
    }
    if (urgency === "due") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" /> Na hora
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        <Calendar className="h-3 w-3" /> Futura
      </span>
    );
  };

  const getDueDate = (vaccine: VaccineItem) => {
    if (!birthDate) return null;
    return addDays(birthDate, vaccine.ageDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-accent mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">
            Calendário de Vacinação — {pet?.species === "cat" ? "Gato" : "Cachorro"}
          </p>
          <p className="text-muted-foreground mt-1">
            {birthDate
              ? `${pet?.name} tem ${petAgeDays} dias de vida. As vacinas são calculadas com base na data de nascimento.`
              : `Cadastre a data de nascimento de ${pet?.name || "seu pet"} no perfil para ver as datas recomendadas.`}
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong>Dica veterinária:</strong> Nunca deixe filhotes pisarem no chão da rua antes da 3ª dose da vacina. Parvovirose e cinomose matam muitos filhotes.
        </p>
      </div>

      {/* Vaccine list */}
      <div className="space-y-3">
        {vaccines.map((vaccine) => {
          const record = records[vaccine.key];
          const dueDate = getDueDate(vaccine);
          const isSaving = saving === vaccine.key;

          return (
            <div
              key={vaccine.key}
              className={`border-2 rounded-xl p-4 transition-all bg-background ${getStatusColor(vaccine)}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Syringe className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {vaccine.name}
                      {vaccine.isOptional && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(Opcional)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{vaccine.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      📅 {vaccine.ageLabel}
                      {dueDate && (
                        <span className="ml-1">
                          — prevista para {format(dueDate, "dd/MM/yyyy")}
                        </span>
                      )}
                    </p>
                    {vaccine.protectsAgainst && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vaccine.protectsAgainst.map((p) => (
                          <span key={p} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {getUrgencyBadge(vaccine)}
              </div>

              {/* Date input for "taken" */}
              {record?.status === "taken" && record.date_taken && (
                <p className="text-xs text-green-600 mb-2 ml-12">
                  ✅ Tomou em {format(parseISO(record.date_taken), "dd/MM/yyyy")}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 ml-12">
                {(!record || record.status === "pending") && (
                  <>
                    <Input
                      type="date"
                      value={dateTaken[vaccine.key] || ""}
                      onChange={(e) => setDateTaken((prev) => ({ ...prev, [vaccine.key]: e.target.value }))}
                      className="h-8 w-40 text-xs"
                      placeholder="Data"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                      disabled={isSaving}
                      onClick={() => handleStatusChange(vaccine, "taken")}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Tomou
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-destructive border-destructive/30"
                      disabled={isSaving}
                      onClick={() => handleStatusChange(vaccine, "not_taken")}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Não tomou
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground"
                      disabled={isSaving}
                      onClick={() => handleStatusChange(vaccine, "will_not_take")}
                    >
                      <Ban className="h-3 w-3 mr-1" /> Não irá tomar
                    </Button>
                  </>
                )}

                {record && record.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    disabled={isSaving}
                    onClick={() => handleStatusChange(vaccine, "pending" as VaccinationStatus)}
                  >
                    Alterar status
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Annual reminder */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">📆 Reforços Anuais</p>
        <p>Após 1 ano de idade, seu pet precisa de reforço anual de V8/V10 (ou V3/V4/V5 para gatos) + Antirrábica.</p>
      </div>
    </div>
  );
}
