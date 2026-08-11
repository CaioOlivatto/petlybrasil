import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CalendarDays, CalendarRange, Sparkles, LogOut, ArrowLeft } from "lucide-react";
import petlyLogo from "@/assets/petly-logo.png";
import pawPattern from "@/assets/paw-pattern.png";

const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === "true";

const plans = [
  {
    id: "mensal",
    name: "Essencial",
    subtitle: "Mensal",
    price: "R$ 34,90",
    pricePerMonth: "R$ 34,90/mês",
    total: null,
    icon: CalendarDays,
    features: [
      "Multi-pet incluso",
      "Petlyzinho IA (em breve)",
      "Diário completo",
      "Dicas personalizadas por raça",
    ],
    popular: false,
  },
  {
    id: "semestral",
    name: "Essencial",
    subtitle: "Semestral",
    price: "R$ 29,90",
    pricePerMonth: "R$ 29,90/mês",
    total: "Total: R$ 179,40 a cada 6 meses",
    icon: CalendarRange,
    features: [
      "Multi-pet incluso",
      "Petlyzinho IA (em breve)",
      "Diário completo",
      "Dicas personalizadas por raça",
      "Economia de 14%",
    ],
    popular: true,
  },
  {
    id: "anual",
    name: "Essencial",
    subtitle: "Anual",
    price: "R$ 24,90",
    pricePerMonth: "R$ 24,90/mês",
    total: "Total: R$ 298,80 por ano",
    icon: Sparkles,
    features: [
      "Multi-pet incluso",
      "Petlyzinho IA (em breve)",
      "Diário completo",
      "Dicas personalizadas por raça",
      "Economia de 29%",
    ],
    popular: false,
  },
];

export default function Assinatura() {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      if (!BILLING_ENABLED) {
        setCanGoBack(true);
        return;
      }
      // Check trial
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at")
        .eq("user_id", userId)
        .maybeSingle();
      const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      if (trialEndsAt && trialEndsAt > new Date()) {
        setCanGoBack(true);
        return;
      }
      // Check subscription
      try {
        const { data: subData } = await supabase.functions.invoke("check-subscription");
        if (subData?.subscribed === true) {
          setCanGoBack(true);
          return;
        }
      } catch {
        // Keep the page available even if the subscription service is unreachable.
      }
      setCanGoBack(false);
    };
    void check();
  }, [userId]);

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
        {/* Back button */}
        {canGoBack && (
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao sistema
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <img src={petlyLogo} alt="Petly" className="h-20 w-20 mx-auto object-contain" />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Plano Essencial
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha a periodicidade que combina com você. O conteúdo é o mesmo em todas as opções.
          </p>
          {!BILLING_ENABLED && (
            <p className="text-sm text-muted-foreground">
              Pagamentos estão em preparação. O acesso ao sistema permanece liberado durante os testes.
            </p>
          )}
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
                    disabled
                    className={`w-full h-12 text-base font-semibold rounded-xl ${
                      plan.popular
                        ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    Assinaturas em breve
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            7 dias de teste grátis • Multi-pet incluso • Cancele a qualquer momento
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
