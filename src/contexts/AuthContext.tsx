import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Product IDs for tier checking
const PRO_PRODUCT_IDS = [
  "prod_UAPlcsCOMTE5kg", // Semestral/Pro
  "prod_UAPllCb7ehCAqH", // Anual/Master
];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  subscriptionProductId: string | null;
  hasIAAccess: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  subscriptionProductId: null,
  hasIAAccess: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionProductId, setSubscriptionProductId] = useState<string | null>(null);
  const subscriptionCheckedFor = useRef<string | null>(null);

  const checkSubscription = useCallback(async (userId: string) => {
    if (subscriptionCheckedFor.current === userId) return;
    subscriptionCheckedFor.current = userId;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed && data?.product_id) {
        setSubscriptionProductId(data.product_id);
      } else {
        setSubscriptionProductId(null);
      }
    } catch {
      setSubscriptionProductId(null);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          setTimeout(() => checkSubscription(session.user.id), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        checkSubscription(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const signOut = async () => {
    subscriptionCheckedFor.current = null;
    setSubscriptionProductId(null);
    await supabase.auth.signOut();
  };

  const hasIAAccess = PRO_PRODUCT_IDS.includes(subscriptionProductId || "");

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signOut,
      subscriptionProductId,
      hasIAAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
