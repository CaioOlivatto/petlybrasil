import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Loader2, LogOut } from "lucide-react";
import petlyLogo from "@/assets/petly-logo.png";
import pawPattern from "@/assets/paw-pattern.png";

const plans = [
  {
    id: "mensal",
    name: "Mensal",
    price: "R$ 65,00",
    pricePerMonth: "R$ 65,00/mês",
    total: null,
    priceId: "price_1TC5AzHZyP9nfelE6ITARmAL",
    icon: Zap,
    features: [
      "Prontuário completo",
      "Diário do pet",
      "Agenda de consultas",
      "Alertas de vacinas",
      "Petzinho IA",
      "Dicas de treino",
    ],
    popular: false,
  },
  {
    id: "semestral",
    name: "Pro",
    subtitle: "Semestral",
    price: "R$ 49,90",
    pricePerMonth: "R$ 49,90/mês",
    total: "Total: R$ 299,40",
    priceId: "price_1TC4vrHZyP9nfelEyLli3vDP",
    icon: Star,
    features: [
      "Tudo do plano Mensal",
      "Economia de 23%",
      "Suporte prioritário",
      "Relatórios avançados",
      "Exportação de dados",
      "Múltiplos pets",
    ],
    popular: true,
  },
  {
    id: "anual",
    name: "Master",
    subtitle: "Anual",
    price: "R$ 39,90",
    pricePerMonth: "R$ 39,90/mês",
    total: "Total: R$ 479,80",
    priceId: "price_1TC4wAHZyP9nfelEz9GQxznq",
    icon: Crown,
    features: [
      "Tudo do plano Pro",
      "Economia de 39%",
      "Acesso antecipado a novidades",
      "Suporte VIP",
      "Histórico ilimitado",
      "Compartilhamento familiar",
    ],
    popular: false,
  },
];

export default function Assinatura() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar checkout: " + (error.message || "Tente novamente."));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{
        backgroundImage: `url(${pawPattern})`,
        backgroundSize: "300px",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="absolute inset-0 bg-background/70" />

      <div className="relative z-10 w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={petlyLogo} alt="Petly" className="h-20 w-20 mx-auto object-contain" />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Seu período de teste terminou
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para continuar cuidando do seu pet com inteligência
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? "border-2 border-accent shadow-xl ring-2 ring-accent/20"
                    : "border-border shadow-md"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1">
                    Mais popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3 ${
                    plan.popular ? "bg-accent/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-7 w-7 ${plan.popular ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <CardTitle className="text-xl">
                    {plan.name}
                    {plan.subtitle && (
                      <span className="block text-sm font-normal text-muted-foreground mt-1">
                        {plan.subtitle}
                      </span>
                    )}
                  </CardTitle>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  {plan.total && (
                    <CardDescription className="text-xs mt-1">{plan.total}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className={`h-4 w-4 flex-shrink-0 ${plan.popular ? "text-accent" : "text-primary"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.priceId, plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full h-12 text-base font-semibold rounded-xl ${
                      plan.popular
                        ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Assinar agora"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem 3 dias de teste grátis • Cancele a qualquer momento
          </p>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
