import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2, PawPrint } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  pet: any;
  onUpdate: () => void;
}

const bloodTypes = ["DEA 1.1+", "DEA 1.1-", "DEA 1.2+", "DEA 1.2-", "DEA 3", "DEA 4", "DEA 5", "DEA 7", "Tipo A", "Tipo B", "Tipo AB"];

export function PetDataSection({ pet, onUpdate }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: pet?.name || "",
    species: pet?.species || "dog",
    breed: pet?.breed || "",
    sex: pet?.sex || "",
    birth_date: pet?.birth_date || "",
    weight: pet?.weight || "",
    blood_type: pet?.blood_type || "",
    is_neutered: pet?.is_neutered || false,
    allergies: pet?.allergies || "",
    health_conditions: pet?.health_conditions || "",
    mother_name: pet?.mother_name || "",
    father_name: pet?.father_name || "",
    pedigree: pet?.pedigree || "",
    kennel: pet?.kennel || "",
  });

  const handleSave = async () => {
    if (!user || !form.name) {
      toast.error("Nome do pet é obrigatório");
      return;
    }
    setSaving(true);

    const data = {
      ...form,
      weight: form.weight ? Number(form.weight) : null,
      birth_date: form.birth_date || null,
      user_id: user.id,
    };

    let error;
    if (pet?.id) {
      ({ error } = await supabase.from("pets").update(data).eq("id", pet.id));
    } else {
      ({ error } = await supabase.from("pets").insert(data));
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Dados do pet salvos!");
      onUpdate();
    }
    setSaving(false);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/pet.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("pet-photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(path);

    if (pet?.id) {
      await supabase.from("pets").update({ photo_url: publicUrl }).eq("id", pet.id);
    }
    toast.success("Foto do pet atualizada!");
    onUpdate();
    setUploading(false);
  };

  const birthDate = form.birth_date ? new Date(form.birth_date + "T12:00:00") : undefined;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">Dados do Pet</h2>

      {/* Photo */}
      <div className="mb-6">
        <Label className="mb-2 block">Foto do Pet</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={pet?.photo_url} />
            <AvatarFallback className="text-xl bg-muted text-muted-foreground">
              <PawPrint className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
              Trocar foto
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · Máx. 5MB</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadPhoto} />
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nome do Pet</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
        </div>
        <div>
          <Label>Espécie</Label>
          <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Cachorro</SelectItem>
              <SelectItem value="cat">Gato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Raça</Label>
          <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Raça" />
        </div>
        <div>
          <Label>Sexo</Label>
          <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Fêmea</SelectItem>
              <SelectItem value="male">Macho</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data de Nascimento</Label>
          <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          {birthDate && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(birthDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div>
          <Label>Peso (kg)</Label>
          <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="0" />
        </div>
      </div>

      {/* Blood type */}
      <div className="mt-4">
        <Label>Tipo Sanguíneo</Label>
        <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {bloodTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Health info */}
      <div className="mt-6">
        <h3 className="text-base font-semibold text-foreground mb-3">Saúde</h3>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Castrado(a)?</p>
            <p className="text-xs text-muted-foreground">{form.name || "Seu pet"} foi castrado(a)?</p>
          </div>
          <Switch
            checked={form.is_neutered}
            onCheckedChange={(v) => setForm({ ...form, is_neutered: v })}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label>Alergias conhecidas</Label>
            <Textarea
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="Ex: Alergia a frango, pólen..."
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div>
            <Label>Condições de saúde / Doenças crônicas</Label>
            <Textarea
              value={form.health_conditions}
              onChange={(e) => setForm({ ...form, health_conditions: e.target.value })}
              placeholder="Ex: Displasia coxofemoral, epilepsia..."
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-base font-semibold text-foreground mb-3">Informações de Pedigree</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome da Mãe</Label>
            <Input value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} />
          </div>
          <div>
            <Label>Nome do Pai</Label>
            <Input value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
          </div>
          <div>
            <Label>Pedigree</Label>
            <Input value={form.pedigree} onChange={(e) => setForm({ ...form, pedigree: e.target.value })} />
          </div>
          <div>
            <Label>Canil</Label>
            <Input value={form.kennel} onChange={(e) => setForm({ ...form, kennel: e.target.value })} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="mt-6 bg-accent hover:bg-accent/90" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar alterações
      </Button>
    </div>
  );
}
