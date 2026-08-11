import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  profile: Profile | null;
  onUpdate: () => void | Promise<void>;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const getAvatarPath = (publicUrl?: string | null) => {
  if (!publicUrl) return null;
  try {
    const marker = "/storage/v1/object/public/avatars/";
    const pathname = new URL(publicUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex >= 0 ? decodeURIComponent(pathname.slice(markerIndex + marker.length)) : null;
  } catch {
    return null;
  }
};

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

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      birthday: profile?.birthday || "",
    });
  }, [profile]);

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
      await onUpdate();
    }
    setSaving(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = IMAGE_EXTENSIONS[file.type];
    if (!ext) {
      toast.error("Envie uma imagem JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Arquivo deve ter no máximo 5MB");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      toast.error("Erro ao enviar foto: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      await supabase.storage.from("avatars").remove([path]);
      toast.error("Erro ao atualizar foto: " + updateError.message);
      setUploading(false);
      return;
    }

    const previousPath = getAvatarPath(profile?.avatar_url);
    if (previousPath && previousPath !== path) {
      await supabase.storage.from("avatars").remove([previousPath]);
    }

    toast.success("Foto atualizada!");
    await onUpdate();
    setUploading(false);
    e.target.value = "";
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
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · Máx. 5MB</p>
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
