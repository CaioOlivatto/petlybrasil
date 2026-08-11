import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { profileQueryOptions } from "@/hooks/useAccountData";

const BILLING_ENABLED = import.meta.env.VITE_BILLING_ENABLED === "true";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkOnboarding = async () => {
      if (!user) {
        if (isMounted) {
          setCheckingOnboarding(false);
          setOnboardingCompleted(null);
          setHasAccess(null);
        }
        return;
      }

      if (isMounted) setCheckingOnboarding(true);

      // Check profile for onboarding and trial
      let data;
      let error: unknown = null;
      try {
        data = await queryClient.fetchQuery(profileQueryOptions(user.id));
      } catch (queryError) {
        error = queryError;
      }

      if (!isMounted) return;

      if (error) {
        console.error("Erro ao verificar onboarding:", error);
        setOnboardingCompleted(false);
        setHasAccess(false);
        setCheckingOnboarding(false);
        return;
      }

      setOnboardingCompleted(data?.onboarding_completed ?? false);

      // Billing remains disabled until the Stripe setup is ready. Keeping this
      // behind an environment flag lets migrated users review the full system.
      if (!BILLING_ENABLED) {
        setHasAccess(true);
        setCheckingOnboarding(false);
        return;
      }

      // Check if trial is still active
      const trialEndsAt = (data as any)?.trial_ends_at ? new Date((data as any).trial_ends_at) : null;
      const isTrialActive = trialEndsAt ? trialEndsAt > new Date() : false;

      if (isTrialActive) {
        setHasAccess(true);
        setCheckingOnboarding(false);
        return;
      }

      // If trial expired, check Stripe subscription
      if (data?.onboarding_completed) {
        try {
          const { data: subData, error: subError } = await supabase.functions.invoke("check-subscription");
          if (!isMounted) return;
          if (subError) {
            console.error("Erro ao verificar assinatura:", subError);
            setHasAccess(false);
          } else {
            setHasAccess(subData?.subscribed === true || subData?.trial_active === true);
          }
        } catch {
          if (isMounted) setHasAccess(false);
        }
      } else {
        setHasAccess(true); // hasn't finished onboarding yet
      }

      if (isMounted) setCheckingOnboarding(false);
    };

    void checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, [user?.id, location.pathname, queryClient]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to onboarding if not completed
  if (onboardingCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect away from onboarding if already completed
  if (onboardingCompleted === true && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to subscription page if no access (trial expired + no subscription)
  if (hasAccess === false && location.pathname !== "/assinatura" && location.pathname !== "/onboarding") {
    return <Navigate to="/assinatura" replace />;
  }

  return <>{children}</>;
}
