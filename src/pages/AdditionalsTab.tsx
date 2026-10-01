import { useState } from "react";
import { type Additional, type Company, type Product } from "@/lib/menu";
import { pickName } from "@/lib/i18n";
import { upsertAdditional, deleteAdditional } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";

export function AdditionalsTab({
  additionals,
  products,
  companies,
  companyId,
}: {
  additionals: Additional[];
  products: Product[];
  companies: Company[];
  companyId: string;
}) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Additional> & { nameEn?: string; nameEs?: string; product_ids: string[] }>({
    name: "",
    nameEn: "",
    nameEs: "",
    price: 0,
    active: true,
    icon: "",
    icon_url: "",
    product_ids: [],
  });

  const filtered = companyId === "all" ? additionals : additionals.filter((a) => a.company_id === companyId);
  const filteredProducts = companyId === "all" ? products : products.filter((p) => p.company_id === companyId);

  const handleEdit = (add: Additional) => {
    setEditingId(add.id);
    const pIds = products.filter(p => p.additional_ids?.includes(add.id)).map(p => p.id);
    const t = add.translations || {};
    setFormData({
      ...add,
      name: t.pt || add.name || "",
      nameEn: t.en || "",
      nameEs: t.es || "",
      icon: add.icon || add.icon_url || "",
      icon_url: add.icon || add.icon_url || "",
      product_ids: pIds,
    });
  };

  const handleCreate = () => {
    setEditingId("new");
    setFormData({
      name: "",
      nameEn: "",
      nameEs: "",
      price: 0,
      active: true,
      icon: "",
      icon_url: "",
      product_ids: [],
    });
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error("Nome em Português é obrigatório");
    const iconVal = formData.icon || formData.icon_url || "";
    const payload = {
      name: formData.name,
      price: formData.price || 0,
      active: formData.active ?? true,
      icon: iconVal || null,
      icon_url: iconVal || null,
      translations: {
        pt: formData.name,
        en: formData.nameEn || formData.name,
        es: formData.nameEs || formData.name,
      },
      product_ids: formData.product_ids || [],
      company_id: companyId === "all" ? companies[0]?.id : companyId,
    };
    if (editingId && editingId !== "new") {
      (payload as any).id = editingId;
    }
    const t = toast.loading("Salvando adicional...");
    try {
      await upsertAdditional({ data: payload });
      toast.success("Salvo com sucesso", { id: t });
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar", { id: t });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este adicional?")) return;
    const t = toast.loading("Excluindo...");
    try {
      await deleteAdditional({ data: { id } });
      toast.success("Excluído com sucesso", { id: t });
      qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (e: any) {
      toast.error(e.message || "Erro", { id: t });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Adicionais</h2>
          <span className="text-sm text-muted-foreground">{filtered.length} cadastrados</span>
        </div>
        <Button onClick={handleCreate} disabled={companyId === "all" && companies.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Novo Adicional
        </Button>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_110px_80px_100px] items-center gap-4 border-b p-4 font-semibold text-sm text-muted-foreground">
          <div>Ícone</div>
          <div>PT</div>
          <div>EN</div>
          <div>ES</div>
          <div>Valor</div>
          <div>Ativo</div>
          <div className="text-right">Ações</div>
        </div>
        <div className="divide-y">
          {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum adicional encontrado</div>}
          {filtered.map((add) => {
            const iconSrc = add.icon || add.icon_url;
            const t = add.translations || {};
            const pt = t.pt || add.name || "";
            const en = t.en || add.name || "";
            const es = t.es || add.name || "";
            return (
              <div key={add.id} className="grid grid-cols-[60px_1fr_1fr_1fr_110px_80px_100px] items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                <div>
                  {iconSrc ? (
                    <img src={iconSrc} alt={pt} className="w-9 h-9 object-cover rounded-md border border-stone-200 shadow-sm" />
                  ) : (
                    <span className="w-9 h-9 rounded-md bg-stone-200 text-stone-500 text-xs font-bold flex items-center justify-center">
                      Ícone
                    </span>
                  )}
                </div>
                <div className="font-medium text-sm">{pt}</div>
                <div className="text-sm text-stone-600">{en}</div>
                <div className="text-sm text-stone-600">{es}</div>
                <div className="font-semibold text-sm text-amber-800">
                  R$ {(add.price || 0).toFixed(2).replace(".", ",")}
                </div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${add.active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}>
                    {add.active ? "Sim" : "Não"}
                  </span>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(add)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(add.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editingId} onOpenChange={(v) => !v && setEditingId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId === "new" ? "Novo Adicional" : "Editar Adicional"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>PT (Português)</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Camarão grelhado"
                />
              </div>
              <div className="grid gap-2">
                <Label>EN (Inglês)</Label>
                <Input
                  value={formData.nameEn || ""}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Ex: Grilled Shrimp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>ES (Espanhol)</Label>
                <Input
                  value={formData.nameEs || ""}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  placeholder="Ex: Camarón a la plancha"
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>URL do Ícone / Imagem</Label>
              <div className="flex items-center gap-3">
                {formData.icon ? (
                  <img src={formData.icon} alt="Preview" className="w-10 h-10 object-cover rounded-md border" />
                ) : (
                  <span className="w-10 h-10 rounded-md bg-stone-100 border text-xs flex items-center justify-center text-stone-400">
                    Sem foto
                  </span>
                )}
                <Input
                  value={formData.icon || ""}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value, icon_url: e.target.value })}
                  placeholder="https://... ou preenchida ao enviar"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>Ativo no cardápio</Label>
              <Switch
                checked={formData.active ?? true}
                onCheckedChange={(v) => setFormData({ ...formData, active: v })}
              />
            </div>
            
            <div className="mt-4">
              <Label className="mb-2 block font-semibold">Vincular aos Produtos:</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-60 overflow-y-auto bg-stone-50/50">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`p-${p.id}`}
                      checked={formData.product_ids?.includes(p.id)}
                      onCheckedChange={(checked) => {
                        const current = formData.product_ids || [];
                        if (checked) {
                          setFormData({ ...formData, product_ids: [...current, p.id] });
                        } else {
                          setFormData({ ...formData, product_ids: current.filter((id) => id !== p.id) });
                        }
                      }}
                    />
                    <label
                      htmlFor={`p-${p.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {pickName(p, "pt")}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
