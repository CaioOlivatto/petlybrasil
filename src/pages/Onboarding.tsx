import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Camera, Heart, PawPrint, Image as ImageIcon, Dog, Cat, Bird, Rabbit, Rat, HelpCircle } from "lucide-react";
import { dogBreeds, catBreeds, bloodTypes } from "@/data/petData";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import pawPattern from "@/assets/paw-pattern.png";
import petlyLogo from "@/assets/petly-logo.png";

const TOTAL_STEPS = 5;

const speciesOptions = [
  { value: "dog", label: "Cachorro", icon: Dog, available: true },
  { value: "cat", label: "Gato", icon: Cat, available: true },
  { value: "bird", label: "Pássaro", icon: Bird, available: false },
  { value: "rabbit", label: "Coelho", icon: Rabbit, available: false },
  { value: "hamster", label: "Hamster", icon: Rat, available: false },
  { value: "other", label: "Outro", icon: HelpCircle, available: false },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [breedOpen, setBreedOpen] = useState(false);
  const [customBreed, setCustomBreed] = useState(false);

  const [tutorForm, setTutorForm] = useState({
    tutor_name: "",
    tutor_phone: "",
    tutor_birthday: "",
  });

  const [form, setForm] = useState({
    name: "",
    species: "dog",
    breed: "",
    birth_date: "",
    sex: "",
    weight: "",
    is_neutered: false,
    blood_type: "",
    allergies: "",
    health_conditions: "",
    mother_name: "",
    father_name: "",
    pedigree: "",
    kennel: "",
  });

  const breeds = form.species === "cat" ? catBreeds : dogBreeds;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleFinish = async () => {
    if (!user || !form.name || !tutorForm.tutor_name || !form.weight) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      let photo_url = null;

      // Upload photo if selected
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/pet.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(path, photoFile, { upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from("pet-photos").getPublicUrl(path);
          photo_url = data.publicUrl;
        }
      }

      // Create pet
      const { error: petError } = await supabase.from("pets").insert({
        user_id: user.id,
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        birth_date: form.birth_date || null,
        sex: form.sex || null,
        weight: form.weight ? Number(form.weight) : null,
        is_neutered: form.is_neutered,
        blood_type: form.blood_type || null,
        allergies: form.allergies || null,
        health_conditions: form.health_conditions || null,
        mother_name: form.mother_name || null,
        father_name: form.father_name || null,
        pedigree: form.pedigree || null,
        kennel: form.kennel || null,
        photo_url,
      });

      if (petError) throw petError;

      // Save tutor profile + mark onboarding completed + set 3-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);
      
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          name: tutorForm.tutor_name,
          phone: tutorForm.tutor_phone || null,
          birthday: tutorForm.tutor_birthday || null,
          onboarding_completed: true,
          email: user.email || null,
          trial_ends_at: trialEndsAt.toISOString(),
        } as any, { onConflict: "user_id" });

      if (profileError) throw profileError;

      toast.success("Tudo pronto! Bem-vindo ao Petly 🐾");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !tutorForm.tutor_name) {
      toast.error("Informe seu nome");
      return;
    }
    if (step === 1 && !tutorForm.tutor_phone) {
      toast.error("Informe seu telefone");
      return;
    }
    if (step === 1 && !tutorForm.tutor_birthday) {
      toast.error("Informe sua data de nascimento");
      return;
    }
    if (step === 2 && !form.name) {
      toast.error("Informe o nome do pet");
      return;
    }
    if (step === 3 && !form.breed) {
      toast.error("Informe a raça do pet");
      return;
    }
    if (step === 4 && !form.sex) {
      toast.error("Informe o sexo do pet");
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const petName = form.name || "seu pet";

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
        <CardContent className="pt-8 pb-6 px-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i + 1 === step ? "w-8 bg-accent" : i + 1 < step ? "w-8 bg-accent/50" : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Tutor info */}
          {step === 1 && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Bem-vindo ao Petly!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Primeiro, precisamos saber um pouco sobre você
              </p>

              <div className="text-left space-y-4">
                <div>
                  <Label className="font-semibold">Seu nome *</Label>
                  <Input
                    value={tutorForm.tutor_name}
                    onChange={(e) => setTutorForm({ ...tutorForm, tutor_name: e.target.value })}
                    placeholder="Nome completo"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Telefone *</Label>
                  <Input
                    value={tutorForm.tutor_phone}
                    onChange={(e) => setTutorForm({ ...tutorForm, tutor_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Data de nascimento *</Label>
                  <Input
                    type="date"
                    value={tutorForm.tutor_birthday}
                    onChange={(e) => setTutorForm({ ...tutorForm, tutor_birthday: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pet Name + Photo */}
          {step === 2 && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Vamos conhecer seu pet!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Essas informações ajudarão a personalizar a experiência do app
              </p>

              <div className="text-left mb-6">
                <Label className="font-semibold">Qual é o nome do seu pet? *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Luna, Max, Thor..."
                  className="mt-2"
                />
              </div>

              <div className="border-t border-border pt-6">
                <p className="font-semibold text-foreground mb-4">Foto do seu pet</p>
                <div className="flex justify-center mb-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`h-32 w-32 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden ${
                      photoPreview ? "border-solid border-accent/30" : ""
                    }`}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Pet" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-3 mb-2">
                  <Button variant="outline" size="sm" onClick={() => cameraRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" /> Tirar foto
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Escolher da galeria
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Opcional - Máximo 5MB (JPG, PNG, WebP)</p>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>
          )}

          {/* Step 3: Species + Breed */}
          {step === 3 && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-1">Sobre {petName}</h2>
              <p className="text-sm text-muted-foreground mb-6">Conte mais sobre a espécie e raça</p>

              <div className="text-left mb-6">
                <Label className="font-semibold mb-3 block">Qual é a espécie?</Label>
                <div className="grid grid-cols-3 gap-3">
                  {speciesOptions.map((opt) => {
                    const isSelected = form.species === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        disabled={!opt.available}
                        onClick={() => {
                          if (opt.available) {
                            setForm({ ...form, species: opt.value, breed: "" });
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-accent bg-accent/10"
                            : opt.available
                            ? "border-border hover:border-accent/40"
                            : "border-border opacity-40 cursor-not-allowed"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", isSelected ? "text-accent" : "text-muted-foreground")} />
                        <span className={cn("text-sm", isSelected ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {opt.label}
                        </span>
                        {!opt.available && <span className="text-[10px] text-muted-foreground">Em breve</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-left">
                <Label className="font-semibold mb-2 block">Qual é a raça? *</Label>
                <Popover open={breedOpen} onOpenChange={setBreedOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={breedOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.breed || "Digite ou selecione a raça"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar raça..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma raça encontrada</CommandEmpty>
                        <CommandGroup>
                          {breeds.map((breedItem) => (
                            <CommandItem
                              key={breedItem}
                              value={breedItem}
                              onSelect={() => {
                                setForm((prev) => ({ ...prev, breed: breedItem }));
                                setCustomBreed(false);
                                setBreedOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.breed === breedItem ? "opacity-100" : "opacity-0")} />
                              {breedItem}
                            </CommandItem>
                          ))}
                          <CommandItem
                            value="outra"
                            onSelect={() => {
                              setForm({ ...form, breed: "" });
                              setCustomBreed(true);
                              setBreedOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", customBreed ? "opacity-100" : "opacity-0")} />
                            Outra (digitar manualmente)
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {customBreed && (
                  <Input
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    placeholder="Digite a raça do seu pet"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Age + Sex */}
          {step === 4 && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground mb-1">Idade e sexo</h2>
              <p className="text-sm text-muted-foreground mb-6">Quando {petName} nasceu?</p>

              <div className="text-left space-y-6">
                <div>
                  <Label className="font-semibold">Data de nascimento</Label>
                  <Input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                    className="mt-2"
                    placeholder="DD/MM/AAAA"
                  />
                  {form.birth_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(form.birth_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold mb-3 block">Sexo *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "male", label: "Macho", emoji: "♂" },
                      { value: "female", label: "Fêmea", emoji: "♀" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm({ ...form, sex: opt.value })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                          form.sex === opt.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/40"
                        )}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className={cn("text-sm", form.sex === opt.value ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Additional info */}
          {step === 5 && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-accent" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Informações adicionais</h2>
              <p className="text-sm text-muted-foreground mb-6">Opcional, mas ajuda a IA a dar melhores orientações</p>

              <div className="text-left space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <div>
                  <Label className="font-semibold">Peso atual (kg) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="Ex: 12.5"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Castrado(a)?</p>
                    <p className="text-xs text-muted-foreground">{petName} foi castrado(a)?</p>
                  </div>
                  <Switch
                    checked={form.is_neutered}
                    onCheckedChange={(v) => setForm({ ...form, is_neutered: v })}
                  />
                </div>

                <div>
                  <Label className="font-semibold">Tipo Sanguíneo (opcional)</Label>
                  <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o tipo sanguíneo" /></SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Importante para emergências veterinárias</p>
                </div>

                <div>
                  <Label className="font-semibold">Alergias conhecidas</Label>
                  <Textarea
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    placeholder="Ex: Alergia a frango, pólen..."
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <Label className="font-semibold">Condições de saúde</Label>
                  <Textarea
                    value={form.health_conditions}
                    onChange={(e) => setForm({ ...form, health_conditions: e.target.value })}
                    placeholder="Ex: Displasia coxofemoral, epilepsia..."
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-3">Informações de Pedigree</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Nome do pai do pet (opcional)</Label>
                      <Input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} placeholder="Nome do pai" className="mt-1" />
                    </div>
                    <div>
                      <Label>Nome da mãe do pet (opcional)</Label>
                      <Input value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} placeholder="Nome da mãe" className="mt-1" />
                    </div>
                    <div>
                      <Label>Pedigree</Label>
                      <Input value={form.pedigree} onChange={(e) => setForm({ ...form, pedigree: e.target.value })} placeholder="Número ou registro do pedigree" className="mt-1" />
                    </div>
                    <div>
                      <Label>Canil onde foi adquirido</Label>
                      <Input value={form.kennel} onChange={(e) => setForm({ ...form, kennel: e.target.value })} placeholder="Nome do canil" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button onClick={nextStep} className="flex-1 bg-accent hover:bg-accent/90">
                Próximo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="flex-1 bg-accent hover:bg-accent/90" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PawPrint className="h-4 w-4 mr-2" />}
                Começar!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
