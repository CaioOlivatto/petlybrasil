import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Settings, User, PawPrint, QrCode, Download, Bell, Shield, Wrench } from "lucide-react";
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
  const [profile, setProfile] = useState<any>(null);
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, petRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("pets").select("*").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (petRes.data) setPet(petRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-accent" />
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
                      ? "bg-accent text-accent-foreground font-semibold"
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
            {activeTab === "tutor" && (
              <TutorProfileSection profile={profile} onUpdate={fetchData} />
            )}
            {activeTab === "pet" && (
              <PetDataSection pet={pet} onUpdate={fetchData} />
            )}
            {activeTab === "qrcode" && (
              <QRCodeSection pet={pet} profile={profile} />
            )}
            {activeTab === "export" && (
              <ExportDataSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
