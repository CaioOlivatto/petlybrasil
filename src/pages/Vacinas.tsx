import { useState, useEffect } from "react";
import { ArrowLeft, Syringe, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VaccinationSchedule } from "@/components/prontuario/VaccinationSchedule";

export default function Vacinas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPet(data);
        setLoading(false);
      });
  }, [user]);

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
              <Syringe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vacinas</h1>
              <p className="text-sm text-muted-foreground">
                Calendário de vacinação de {pet?.name || "seu pet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      ) : !pet ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-background">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum pet cadastrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Cadastre seu pet no perfil para ver o calendário de vacinação
          </p>
        </div>
      ) : (
        <VaccinationSchedule pet={pet} />
      )}
    </div>
  );
}
