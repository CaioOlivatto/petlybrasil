import {
  FileText,
  Syringe,
  Calendar,
  BookOpen,
  Dumbbell,
  Bot,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Confira como está <span className="text-accent font-medium">Lilly</span> hoje
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.url)}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-accent/30 transition-all hover:border-accent hover:shadow-md ${
              action.highlight
                ? "bg-accent/15 border-accent"
                : "bg-background/80 backdrop-blur-sm"
            }`}
          >
            <action.icon className="h-6 w-6 text-accent" />
            <span className="text-sm font-medium text-foreground">{action.title}</span>
          </button>
        ))}
      </div>

      {/* Pet Card */}
      <div className="border-2 border-accent/30 rounded-2xl p-6 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className="h-28 w-28 rounded-2xl bg-muted overflow-hidden shrink-0">
            <div className="h-full w-full flex items-center justify-center text-4xl">🐶</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">Lilly</h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" />
                Tudo em dia
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Shih Tzu · Cão</p>
            <p className="text-sm text-muted-foreground">1 ano · 7 kg · Fêmea</p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="border-2 border-accent/30 rounded-2xl p-6 bg-background/80 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Como Lilly está?</h3>
        <div className="flex gap-2">
          {periodTabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
