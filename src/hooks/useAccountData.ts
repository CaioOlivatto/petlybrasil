import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQueryOptions = (userId: string) => queryOptions({
  queryKey: ["account", userId, "profile"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, name, email, phone, birthday, avatar_url, onboarding_completed, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});

export const primaryPetQueryOptions = (userId: string) => queryOptions({
  queryKey: ["account", userId, "primary-pet", "v2"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("id, user_id, name, species, breed, sex, birth_date, weight, blood_type, mother_name, father_name, pedigree, kennel, photo_url, is_neutered, allergies, health_conditions, emergency_token")
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
