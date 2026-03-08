import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkOnboarding = async () => {
      if (!user) {
        if (isMounted) {
          setCheckingOnboarding(false);
          setOnboardingCompleted(null);
        }
        return;
      }

      if (isMounted) setCheckingOnboarding(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Erro ao verificar onboarding:", error);
        setOnboardingCompleted(false);
      } else {
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      }

      setCheckingOnboarding(false);
    };

    void checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, [user?.id, location.pathname]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (onboardingCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

