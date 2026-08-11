import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQueryOptions = (userId: string) => queryOptions({
  queryKey: ["account", userId, "profile"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, onboarding_completed, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});

export const primaryPetQueryOptions = (userId: string) => queryOptions({
  queryKey: ["account", userId, "primary-pet"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("id, name, photo_url, species, birth_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});

export const useProfile = (userId?: string) => useQuery({
  ...profileQueryOptions(userId ?? ""),
  enabled: Boolean(userId),
});

export const usePrimaryPet = (userId?: string) => useQuery({
  ...primaryPetQueryOptions(userId ?? ""),
  enabled: Boolean(userId),
});
