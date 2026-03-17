import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Sparkles, Save, Plus, Trash2, Edit3, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SavedList = {
  id: string;
  title: string;
  questions: string[];
  createdAt: Date;
};

const suggestedQuestions = {
  importantes: [
    "Qual o diagnóstico e tratamento?",
    "Precisa de exames adicionais?",
    "Quais os efeitos colaterais dos medicamentos?",
    "Quando devo retornar?",
  ],
  acompanhamento: [
    "O tratamento está funcionando?",
    "Posso interromper a medicação?",
    "Quando repetir os exames?",
    "Preciso mudar a alimentação?",
  ],
  prevencao: [
    "As vacinas estão em dia?",
    "Qual antipulgas/carrapato usar?",
    "Precisa de vermífugo?",
    "Como prevenir problemas dentários?",
  ],
};

const QuestoesVeterinario = () => {
  const { toast } = useToast();
  const [userInput, setUserInput] = useState("");
  const [organizedQuestions, setOrganizedQuestions] = useState<string[]>([]);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [editingList, setEditingList] = useState<SavedList | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInput, setEditInput] = useState("");
  const [editMode, setEditMode] = useState<"add" | "replace">("add");

  const fetchSavedLists = useCallback(async () => {
    const { data, error } = await supabase
      .from("vet_question_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching lists:", error);
      return;
    }

    setSavedLists(
      (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        questions: row.questions || [],
        createdAt: new Date(row.created_at),
      }))
    );
  }, []);

  useEffect(() => {
    fetchSavedLists();
  }, [fetchSavedLists]);

  const handleAddSuggested = (question: string) => {
    if (!organizedQuestions.includes(question)) {
      setOrganizedQuestions((prev) => [...prev, question]);
      toast({ title: "Pergunta adicionada! ✅" });
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setOrganizedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrganizeWithAI = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Escreva suas dúvidas",
        description: "Descreva seus sintomas ou dúvidas para a IA organizar.",
        variant: "destructive",
      });
      return;
    }

    setIsOrganizing(true);

    try {
      const { data, error } = await supabase.functions.invoke("organize-questions", {
        body: { userInput: userInput.trim() },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        setIsOrganizing(false);
        return;
      }

      const questions: string[] = data?.questions || [];
      if (questions.length === 0) {
        toast({ title: "Nenhuma pergunta gerada", description: "Tente descrever com mais detalhes.", variant: "destructive" });
        setIsOrganizing(false);
        return;
      }

      setOrganizedQuestions((prev) => [...prev, ...questions]);
      setUserInput("");
      toast({ title: "Perguntas organizadas! ✨", description: `${questions.length} pergunta(s) formulada(s) pela IA.` });
    } catch (e) {
      console.error("Error organizing questions:", e);
      toast({ title: "Erro ao organizar", description: "Tente novamente em alguns segundos.", variant: "destructive" });
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleSaveList = async () => {
    if (organizedQuestions.length === 0) {
      toast({ title: "Nenhuma pergunta para salvar", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("vet_question_lists").insert({
      title: `Consulta ${savedLists.length + 1}`,
      questions: organizedQuestions,
    });

    if (error) {
      console.error("Error saving list:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
      return;
    }

    setOrganizedQuestions([]);
    await fetchSavedLists();
    toast({ title: "Lista salva! 📋", description: "Suas perguntas foram salvas para a consulta." });
  };

  const handleEditList = (list: SavedList) => {
    setEditingList(list);
    setEditInput("");
    setEditMode("add");
    setEditDialogOpen(true);
  };

  const handleApplyEdit = async () => {
    if (!editingList) return;

    const newQuestions = editInput
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .map((q) => (q.endsWith("?") ? q : `${q}?`));

    const updatedQuestions = editMode === "replace"
      ? newQuestions
      : [...editingList.questions, ...newQuestions];

    const { error } = await supabase
      .from("vet_question_lists")
      .update({ questions: updatedQuestions })
      .eq("id", editingList.id);

    if (error) {
      console.error("Error updating list:", error);
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }

    await fetchSavedLists();
    toast({ title: editMode === "replace" ? "Lista substituída! ✅" : "Perguntas acrescentadas! ✅" });
    setEditDialogOpen(false);
    setEditingList(null);
    setEditInput("");
  };

  const handleDeleteList = async (id: string) => {
    const { error } = await supabase.from("vet_question_lists").delete().eq("id", id);
    if (error) {
      console.error("Error deleting list:", error);
      toast({ title: "Erro ao remover", variant: "destructive" });
      return;
    }
    await fetchSavedLists();
    toast({ title: "Lista removida" });
  };

  const handleDeleteQuestionFromList = async (listId: string, qIndex: number) => {
    const list = savedLists.find((l) => l.id === listId);
    if (!list) return;

    const updatedQuestions = list.questions.filter((_, i) => i !== qIndex);
    const { error } = await supabase
      .from("vet_question_lists")
      .update({ questions: updatedQuestions })
      .eq("id", listId);

    if (error) {
      console.error("Error removing question:", error);
      return;
    }
    await fetchSavedLists();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Stethoscope className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Questões para o Veterinário</h1>
        </div>
        <p className="text-muted-foreground">Prepare suas perguntas antes da consulta</p>
      </div>

      {/* Input area */}
      <Card className="bg-background border-border">
        <CardContent className="p-5 space-y-4">
          <Textarea
            placeholder={"Descreva sintomas, comportamentos ou qualquer dúvida que você queira discutir com o veterinário...\n\nExemplo: Notei que ela está coçando muito a orelha e tem um cheiro diferente. Também está bebendo mais água que o normal."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="min-h-[120px]"
            maxLength={1000}
          />
          <Button
            onClick={handleOrganizeWithAI}
            disabled={isOrganizing || !userInput.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isOrganizing ? "Organizando..." : "Organizar Perguntas com IA"}
          </Button>
        </CardContent>
      </Card>

      {/* Organized questions (working area) */}
      {organizedQuestions.length > 0 && (
        <Card className="bg-background border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" />
                Suas Perguntas ({organizedQuestions.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOrganizedQuestions([]);
                  toast({ title: "Todas as perguntas removidas" });
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Deletar todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {organizedQuestions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30"
              >
                <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs min-w-[28px] justify-center">
                  {i + 1}
                </Badge>
                <span className="text-sm text-foreground flex-1">{q}</span>
                <button
                  onClick={() => handleRemoveQuestion(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Separator className="my-3" />
            <Button onClick={handleSaveList} className="w-full" size="lg">
              <Save className="h-4 w-4 mr-2" />
              Salvar lista de perguntas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggested questions */}
      <div className="space-y-5">
        {Object.entries(suggestedQuestions).map(([category, questions]) => {
          const categoryConfig: Record<string, { icon: typeof AlertCircle; label: string }> = {
            importantes: { icon: AlertCircle, label: "Perguntas Importantes" },
            acompanhamento: { icon: Clock, label: "Acompanhamento" },
            prevencao: { icon: CheckCircle2, label: "Prevenção" },
          };
          const config = categoryConfig[category];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-secondary" />
                <h2 className="text-base font-bold text-foreground">{config.label}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddSuggested(q)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background text-left transition-all hover:border-secondary/50 hover:bg-secondary/5 ${
                      organizedQuestions.includes(q) ? "opacity-50 border-secondary/30 bg-secondary/5" : ""
                    }`}
                  >
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-xs min-w-[28px] justify-center text-secondary border-secondary/30">
                      {i + 1}
                    </Badge>
                    <span className="text-sm text-foreground">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved lists */}
      {savedLists.length > 0 && (
        <div>
          <Separator className="mb-5" />
          <h2 className="text-lg font-bold text-foreground mb-4">📋 Listas salvas</h2>
          <div className="space-y-4">
            {savedLists.map((list) => (
              <Card key={list.id} className="bg-background border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-foreground">{list.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {list.createdAt.toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditList(list)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteList(list.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {list.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <span className="text-xs text-muted-foreground mt-1 w-5 shrink-0">{i + 1}.</span>
                        <span className="text-sm text-foreground flex-1">{q}</span>
                        <button
                          onClick={() => handleDeleteQuestionFromList(list.id, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar lista: {editingList?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditMode("add")}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  editMode === "add"
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border bg-background hover:border-secondary/40"
                }`}
              >
                <Plus className="h-4 w-4 mx-auto mb-1" />
                Acrescentar
              </button>
              <button
                onClick={() => setEditMode("replace")}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  editMode === "replace"
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border bg-background hover:border-secondary/40"
                }`}
              >
                <Edit3 className="h-4 w-4 mx-auto mb-1" />
                Substituir tudo
              </button>
            </div>
            <Textarea
              placeholder={
                editMode === "add"
                  ? "Escreva as perguntas adicionais (uma por linha)..."
                  : "Escreva todas as perguntas novas (uma por linha)..."
              }
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              className="min-h-[120px]"
            />
            <Button onClick={handleApplyEdit} disabled={!editInput.trim()} className="w-full">
              {editMode === "add" ? "Acrescentar perguntas" : "Substituir lista"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestoesVeterinario;
