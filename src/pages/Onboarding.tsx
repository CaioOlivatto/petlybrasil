import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, PawPrint, User } from "lucide-react";
import pawPattern from "@/assets/paw-pattern.png";
import petlyLogo from "@/assets/petly-logo.png";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [tutorForm, setTutorForm] = useState({
    name: "",
    phone: "",
    birthday: "",
  });

  const [petForm, setPetForm] = useState({
    name: "",
    species: "dog",
    breed: "",
  });

  const handleFinish = async () => {
    if (!user) return;
    if (!tutorForm.name || !petForm.name) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: tutorForm.name,
          phone: tutorForm.phone || null,
          birthday: tutorForm.birthday || null,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Create pet
      const { error: petError } = await supabase.from("pets").insert({
        user_id: user.id,
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed || null,
      });

      if (petError) throw petError;

      toast.success("Tudo pronto! Bem-vindo ao Petly 🐾");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${pawPattern})`,
        backgroundSize: "300px",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="absolute inset-0 bg-background/60" />
      <Card className="w-full max-w-lg relative z-10 shadow-xl border-accent/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src={petlyLogo} alt="Petly" className="h-14 w-14 rounded-full" />
          </div>
          <CardTitle className="text-xl">
            {step === 1 ? "Sobre você" : "Sobre seu pet"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Precisamos de algumas informações para começar"
              : "Agora conte-nos sobre seu companheiro"}
          </CardDescription>
          <div className="flex justify-center gap-2 mt-3">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-accent" : "bg-muted"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-accent" : "bg-muted"}`} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label>Nome do tutor *</Label>
                <Input
                  value={tutorForm.name}
                  onChange={(e) => setTutorForm({ ...tutorForm, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={tutorForm.phone}
                  onChange={(e) => setTutorForm({ ...tutorForm, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label>Aniversário</Label>
                <Input
                  type="date"
                  value={tutorForm.birthday}
                  onChange={(e) => setTutorForm({ ...tutorForm, birthday: e.target.value })}
                />
              </div>
              <Button
                onClick={() => {
                  if (!tutorForm.name) {
                    toast.error("Informe seu nome");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Próximo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Nome do pet *</Label>
                <Input
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  placeholder="Nome do pet"
                />
              </div>
              <div>
                <Label>Espécie</Label>
                <Select value={petForm.species} onValueChange={(v) => setPetForm({ ...petForm, species: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cachorro</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Raça</Label>
                <Input
                  value={petForm.breed}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  placeholder="Raça do pet"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button onClick={handleFinish} className="flex-1 bg-accent hover:bg-accent/90" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PawPrint className="h-4 w-4 mr-2" />}
                  Começar!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
