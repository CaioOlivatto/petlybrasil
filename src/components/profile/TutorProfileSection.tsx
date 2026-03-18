import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";

interface Props {
  profile: any;
  onUpdate: () => void;
}

export function TutorProfileSection({ profile, onUpdate }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    birthday: profile?.birthday || "",
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthday: form.birthday || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil salvo com sucesso!");
      onUpdate();
    }
    setSaving(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 15MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    toast.success("Foto atualizada!");
    onUpdate();
    setUploading(false);
  };

  const initials = (form.name || profile?.email || "U").charAt(0).toUpperCase();

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">Perfil do Tutor</h2>

      {/* Avatar */}
      <div className="mb-6">
        <Label className="mb-2 block">Foto do Perfil</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-xl bg-accent text-accent-foreground">{initials}</AvatarFallback>
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
            <p className="text-xs text-muted-foreground mt-1"><p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · Máx. 15MB</p></p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUploadAvatar}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="tutor-name">Nome</Label>
          <Input
            id="tutor-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do tutor"
          />
        </div>
        <div>
          <Label htmlFor="tutor-email">Email</Label>
          <Input
            id="tutor-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="seu@email.com"
          />
          <p className="text-xs text-muted-foreground mt-1">Usado para contato no prontuário de saúde</p>
        </div>
        <div>
          <Label htmlFor="tutor-phone">Telefone</Label>
          <Input
            id="tutor-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-muted-foreground mt-1">Usado para contato no prontuário de saúde</p>
        </div>
        <div>
          <Label htmlFor="tutor-birthday">Aniversário</Label>
          <Input
            id="tutor-birthday"
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
          />
        </div>
      </div>

      <Button onClick={handleSave} className="mt-6 bg-accent hover:bg-accent/90" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar alterações
      </Button>
    </div>
  );
}
