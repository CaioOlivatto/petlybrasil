import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = {
  ...corsHeaders,
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type Checkin = {
  date: string;
  energia: string | null;
  apetite: string | null;
  humor: string | null;
  sono: string | null;
  mudanca_rotina: string | null;
  observacoes: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const emergencyToken = url.searchParams.get("token");

    if (!emergencyToken || !isUuid(emergencyToken)) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pet data
    const { data: pet } = await supabase
      .from("pets")
      .select("id, user_id, name, species, breed, sex, birth_date, weight, blood_type, allergies, health_conditions, is_neutered")
      .eq("emergency_token", emergencyToken)
      .single();

    if (!pet) {
      return new Response(JSON.stringify({ error: "Pet not found" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const petId = pet.id;

    const today = new Date().toISOString().split("T")[0];

    // Recent daily checkins - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [profileResult, medicationsResult, consultationsResult, proceduresResult, vaccinationsResult, checkinsResult] = await Promise.all([
      supabase.from("profiles").select("name, phone, email").eq("user_id", pet.user_id).maybeSingle(),
      supabase.from("medical_records").select("name, date, frequency, usage_end_date, notes").eq("pet_id", petId).eq("category", "medicacao").or(`usage_end_date.gte.${today},usage_end_date.is.null`).order("date", { ascending: false }).limit(5),
      supabase.from("medical_records").select("name, date, notes").eq("pet_id", petId).eq("category", "consulta").order("date", { ascending: false }).limit(3),
      supabase.from("medical_records").select("name, date, category, notes").eq("pet_id", petId).in("category", ["exame", "cirurgia"]).order("date", { ascending: false }).limit(3),
      supabase.from("pet_vaccinations").select("vaccine_key, date_taken").eq("pet_id", petId).eq("status", "taken").order("date_taken", { ascending: false }).limit(5),
      supabase.from("daily_checkins").select("date, energia, apetite, humor, sono, mudanca_rotina, observacoes").eq("pet_id", petId).gte("date", thirtyDaysAgoStr).order("date", { ascending: false }),
    ]);

    const profile = profileResult.data;
    const medications = medicationsResult.data;
    const consultations = consultationsResult.data;
    const procedures = proceduresResult.data;
    const vaccinations = vaccinationsResult.data;
    const checkins = checkinsResult.data as Checkin[] | null;

    const travel = checkins
      ?.filter((c) => c.mudanca_rotina && c.mudanca_rotina !== "nenhuma")
      .map((c) => ({ date: c.date, reason: c.mudanca_rotina }))
      .slice(0, 3) || [];

    const observations = checkins
      ?.filter((c) => c.observacoes)
      .map((c) => ({ date: c.date, text: c.observacoes }))
      .slice(0, 3) || [];

    const wellness = checkins?.map((c) => ({
      date: c.date,
      energia: c.energia,
      apetite: c.apetite,
      humor: c.humor,
      sono: c.sono,
    })) || [];

    const result = {
      pet: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        sex: pet.sex,
        birth_date: pet.birth_date,
        weight: pet.weight,
        blood_type: pet.blood_type,
        allergies: pet.allergies,
        health_conditions: pet.health_conditions,
        is_neutered: pet.is_neutered,
      },
      tutor: profile ? {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
      } : null,
      medications: medications || [],
      consultations: consultations || [],
      procedures: procedures || [],
      vaccinations: vaccinations || [],
      wellness,
      travel,
      observations,
    };

    return new Response(JSON.stringify(result), {
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("Emergency data request failed", error);
    return new Response(JSON.stringify({ error: "Unable to load emergency data" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
