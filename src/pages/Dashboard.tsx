import { useEffect, useState } from "react";
import {
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Dumbbell,
  Bot,
  HelpCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInYears, differenceInMonths, parseISO } from "date-fns";

const quickActions = [
  { title: "Prontuário", icon: FileText, url: "/prontuario" },
  { title: "Vacinas", icon: Syringe, url: "/vacinas", highlight: true },
  { title: "Agenda", icon: Calendar, url: "/agenda" },
  { title: "Diário", icon: BookOpen, url: "/diario" },
  { title: "Treino", icon: Dumbbell, url: "/treino" },
  { title: "Petzinho IA", icon: Bot, url: "/petzinho-ia" },
  { title: "Vet. Perguntas", icon: HelpCircle, url: "/questoes-veterinario" },
];

const periodTabs = ["Hoje", "7 dias", "30 dias"];

function formatAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = parseISO(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  if (years >= 1) return `${years} ano${years > 1 ? "s" : ""}`;
  const months = differenceInMonths(now, birth);
  return months > 0 ? `${months} ${months > 1 ? "meses" : "mês"}` : "Filhote";
}

function formatSex(sex: string | null): string {
  if (sex === "male") return "Macho";
  if (sex === "female") return "Fêmea";
  return "";
}

function formatSpecies(species: string): string {
  if (species === "dog") return "Cão";
  if (species === "cat") return "Gato";
  return species;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null } | null>(null);
  const [pet, setPet] = useState<{
    name: string;
    species: string;
    breed: string | null;
    weight: number | null;
    sex: string | null;
    birth_date: string | null;
    photo_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, petRes] = await Promise.all([
        supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle(),
        supabase.from("pets").select("name, species, breed, weight, sex, birth_date, photo_url").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
      ]);

      setProfile(profileRes.data);
      setPet(petRes.data);
      setLoading(false);
    };

    void fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const tutorName = profile?.name || "Tutor";
  const petName = pet?.name || "seu pet";
  const petDetails: string[] = [];
  if (pet?.breed) petDetails.push(pet.breed);
  if (pet?.species) petDetails.push(formatSpecies(pet.species));
  const petInfo: string[] = [];
  if (pet?.birth_date) petInfo.push(formatAge(pet.birth_date));
  if (pet?.weight) petInfo.push(`${pet.weight} kg`);
  if (pet?.sex) petInfo.push(formatSex(pet.sex));

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Olá, {tutorName}! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Confira como está <span className="text-accent font-medium">{petName}</span> hoje
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.url)}
            className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 rounded-2xl border-2 border-accent/30 transition-all hover:border-accent hover:shadow-md ${
              action.highlight
                ? "bg-accent/15 border-accent bg-background"
                : "bg-background backdrop-blur-sm"
            }`}
          >
            <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            <span className="text-xs sm:text-sm font-medium text-foreground">{action.title}</span>
          </button>
        ))}
      </div>

      {/* Pet Card */}
      <div className="border-2 border-accent/30 rounded-2xl p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5">
          <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl bg-muted overflow-hidden shrink-0">
            {pet?.photo_url ? (
              <img src={pet.photo_url} alt={petName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl sm:text-4xl">
                {pet?.species === "cat" ? "🐱" : "🐶"}
              </div>
            )}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{petName}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" />
                Tudo em dia
              </span>
            </div>
            {petDetails.length > 0 && (
              <p className="text-sm text-muted-foreground">{petDetails.join(" · ")}</p>
            )}
            {petInfo.length > 0 && (
              <p className="text-sm text-muted-foreground">{petInfo.join(" · ")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="border-2 border-accent/30 rounded-2xl p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Como {petName} está?</h3>
        <div className="flex gap-2">
          {periodTabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
