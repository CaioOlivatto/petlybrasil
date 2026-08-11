import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Settings, User, PawPrint, QrCode, Download, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrimaryPet, useProfile } from "@/hooks/useAccountData";
import { TutorProfileSection } from "@/components/profile/TutorProfileSection";
import { PetDataSection } from "@/components/profile/PetDataSection";
import { QRCodeSection } from "@/components/profile/QRCodeSection";
import { ExportDataSection } from "@/components/profile/ExportDataSection";

const tabs = [
  { id: "tutor", label: "Perfil do Tutor", icon: User },
  { id: "pet", label: "Dados do Pet", icon: PawPrint },
  { id: "qrcode", label: "QR Code", icon: QrCode },
  { id: "export", label: "Exportar Dados", icon: Download },
];

export default function Perfil() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tutor");
  const queryClient = useQueryClient();
  const profileQuery = useProfile(user?.id);
  const petQuery = usePrimaryPet(user?.id);
  const profile = profileQuery.data;
  const pet = petQuery.data;
  const loading = profileQuery.isLoading || petQuery.isLoading;

  const refreshAccount = async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: ["account", user.id] });
  };

  useEffect(() => {
    if (profileQuery.error || petQuery.error) {
      toast.error("Não foi possível carregar os dados do perfil.");
    }
  }, [profileQuery.error, petQuery.error]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="md:w-64 shrink-0">
          <div className="bg-card rounded-xl border border-border p-2 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && <span className="ml-auto text-xs">›</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-xl border border-border p-6">
            {loading && (
              <div className="flex min-h-48 items-center justify-center" role="status">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="sr-only">Carregando perfil</span>
              </div>
            )}
            {!loading && activeTab === "tutor" && (
              <TutorProfileSection profile={profile} onUpdate={refreshAccount} />
            )}
            {!loading && activeTab === "pet" && (
              <PetDataSection pet={pet} onUpdate={refreshAccount} />
            )}
            {!loading && activeTab === "qrcode" && (
              <QRCodeSection pet={pet} profile={profile} />
            )}
            {!loading && activeTab === "export" && (
              <ExportDataSection pet={pet} profile={profile} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
