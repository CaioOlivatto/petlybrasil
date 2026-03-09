import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const petId = url.searchParams.get("pet_id");

    if (!petId) {
      return new Response(JSON.stringify({ error: "pet_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pet data
    const { data: pet } = await supabase
      .from("pets")
      .select("*")
      .eq("id", petId)
      .single();

    if (!pet) {
      return new Response(JSON.stringify({ error: "Pet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile (tutor)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, email")
      .eq("user_id", pet.user_id)
      .single();

    const today = new Date().toISOString().split("T")[0];

    // Active medications
    const { data: medications } = await supabase
      .from("medical_records")
      .select("name, date, frequency, usage_end_date, notes")
      .eq("pet_id", petId)
      .eq("category", "medicacao")
      .or(`usage_end_date.gte.${today},usage_end_date.is.null`)
      .order("date", { ascending: false })
      .limit(5);

    // Last consultations
    const { data: consultations } = await supabase
      .from("medical_records")
      .select("name, date, notes")
      .eq("pet_id", petId)
      .eq("category", "consulta")
      .order("date", { ascending: false })
      .limit(3);

    // Procedures
    const { data: procedures } = await supabase
      .from("medical_records")
      .select("name, date, category, notes")
      .eq("pet_id", petId)
      .in("category", ["exame", "cirurgia"])
      .order("date", { ascending: false })
      .limit(3);

    // Vaccinations
    const { data: vaccinations } = await supabase
      .from("pet_vaccinations")
      .select("vaccine_key, date_taken, status, notes")
      .eq("pet_id", petId)
      .eq("status", "done")
      .order("date_taken", { ascending: false })
      .limit(5);

    // Recent daily checkins
    const { data: checkins } = await supabase
      .from("daily_checkins")
      .select("date, energia, apetite, humor, sono, mudanca_rotina, observacoes")
      .eq("pet_id", petId)
      .order("date", { ascending: false })
      .limit(7);

    const travel = checkins
      ?.filter((c: any) => c.mudanca_rotina && c.mudanca_rotina !== "nenhuma")
      .map((c: any) => ({ date: c.date, reason: c.mudanca_rotina }))
      .slice(0, 3) || [];

    const observations = checkins
      ?.filter((c: any) => c.observacoes)
      .map((c: any) => ({ date: c.date, text: c.observacoes }))
      .slice(0, 3) || [];

    const wellness = checkins?.map((c: any) => ({
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
