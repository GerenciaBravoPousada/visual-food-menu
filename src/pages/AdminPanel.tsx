import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AdditionalsTab } from "./AdditionalsTab";
import { CategoriesTab } from "./CategoriesTab";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCheck,
  adminLogout,
  deleteCategory,
  deleteCompany,
  deleteMarker,
  deleteProduct,
  listCompaniesAdmin,
  updateTheme,
  upsertCategory,
  upsertCompany,
  upsertMarker,
  upsertProduct,
  uploadProductImage,
} from "@/lib/admin.functions";
import {
  fetchMenu,
  fetchTheme,
  type Additional,
  type Category,
  type Company,
  type Marker,
  type Product,
  type ThemeSettings,
} from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coffee,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  ImageOff,
  Calendar,
  Clock,
  X,
  RotateCcw,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MarkerIcon, MARKER_ICON_OPTIONS } from "@/components/MarkerIcon";

export function AdminPanel() {
  const navigate = useNavigate();
  const check = adminCheck;
  const logout = adminLogout;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });
  const listCompanies = listCompaniesAdmin;
  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = (await listCompanies()) as Company[];
      return (res ?? []).sort((a, b) =>
        (a.fantasy_name || (a as any).name || "").localeCompare(
          b.fantasy_name || (b as any).name || "",
          "pt-BR",
          { sensitivity: "base" }
        )
      );
    },
  });
  const { data: theme } = useQuery({ queryKey: ["theme"], queryFn: fetchTheme });
  const [activeTab, setActiveTab] = useState("categories");

  useEffect(() => {
    check().then((r) => {
      if (!r.authed) navigate("/admin");
    });
  }, [check, navigate]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["menu"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
    qc.invalidateQueries({ queryKey: ["theme"] });
    qc.invalidateQueries({ queryKey: ["primary-company"] });
  };

  const navItemClass = (tab: string) =>
    `w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
      activeTab === tab
        ? "bg-stone-800 text-white font-semibold"
        : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
    }`;

  return (
    <div className="min-h-screen bg-stone-100 flex text-stone-900">
      {/* Left Sidebar Toolbar */}
      <aside className="w-64 bg-[#1d1b18] text-white p-5 flex flex-col justify-between shrink-0 min-h-screen border-r border-stone-800">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <LogoAvatar companies={companies ?? []} onChange={refresh} />
            <div>
              <strong className="block text-base font-semibold leading-tight text-white">Visual Food Menu</strong>
              <span className="text-xs text-stone-400">Área administrativa</span>
            </div>
          </div>

          <nav className="space-y-5">
            {/* Cardápio */}
            <div>
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Cardápio
              </div>
              <div className="space-y-0.5">
                <button type="button" onClick={() => setActiveTab("categories")} className={navItemClass("categories")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Categorias
                </button>
                <button type="button" onClick={() => setActiveTab("products")} className={navItemClass("products")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Produtos
                </button>
                <button type="button" onClick={() => setActiveTab("additionals")} className={navItemClass("additionals")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Adicionais
                </button>
                <button type="button" onClick={() => setActiveTab("markers")} className={navItemClass("markers")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Marcadores
                </button>
                <button type="button" onClick={() => setActiveTab("qr")} className={navItemClass("qr")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> QR Code
                </button>
              </div>
            </div>

            {/* Fichas Técnicas */}
            <div>
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Fichas Técnicas
              </div>
              <div className="space-y-0.5">
                <button type="button" onClick={() => setActiveTab("tech_dashboard")} className={navItemClass("tech_dashboard")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Dashboard
                </button>
                <button type="button" onClick={() => setActiveTab("tech_inputs")} className={navItemClass("tech_inputs")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Insumos
                </button>
                <button type="button" onClick={() => setActiveTab("tech_preparations")} className={navItemClass("tech_preparations")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Preparos
                </button>
                <button type="button" onClick={() => setActiveTab("tech_products")} className={navItemClass("tech_products")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Produtos finais
                </button>
              </div>
            </div>

            {/* Configurações */}
            <div>
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Configurações
              </div>
              <div className="space-y-0.5">
                <button type="button" onClick={() => setActiveTab("companies")} className={navItemClass("companies")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Empresa
                </button>
                <button type="button" onClick={() => setActiveTab("theme")} className={navItemClass("theme")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Cores
                </button>
                <button type="button" onClick={() => setActiveTab("profile")} className={navItemClass("profile")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Minha conta
                </button>
                <button type="button" onClick={() => setActiveTab("users")} className={navItemClass("users")}>
                  <span className="text-xs text-stone-500 font-bold">&gt;</span> Usuários
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800/80"
            onClick={async () => {
              await logout();
              navigate("/admin");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              {activeTab === "categories" && "Cardápio — Categorias"}
              {activeTab === "products" && "Cardápio — Produtos"}
              {activeTab === "additionals" && "Cardápio — Adicionais"}
              {activeTab === "markers" && "Cardápio — Marcadores"}
              {activeTab === "qr" && "Cardápio — QR Code"}
              {activeTab === "tech_dashboard" && "Fichas Técnicas — Dashboard"}
              {activeTab === "tech_inputs" && "Fichas Técnicas — Insumos"}
              {activeTab === "tech_preparations" && "Fichas Técnicas — Preparos"}
              {activeTab === "tech_products" && "Fichas Técnicas — Produtos finais"}
              {activeTab === "companies" && "Configurações — Empresa"}
              {activeTab === "theme" && "Configurações — Cores"}
              {activeTab === "profile" && "Configurações — Minha conta"}
              {activeTab === "users" && "Configurações — Usuários"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Ver cardápio</Link>
            </Button>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-auto max-w-7xl w-full">
          {isLoading ? (
            <p className="py-20 text-center text-muted-foreground">Carregando…</p>
          ) : (
            <div>
              {activeTab === "categories" && (
                <CategoriesTab categories={data?.categories ?? []} onChange={refresh} />
              )}
              {activeTab === "products" && (
                <ProductsTab
                  products={data?.products ?? []}
                  categories={data?.categories ?? []}
                  markers={data?.markers ?? []}
                  additionals={data?.additionals ?? []}
                  onChange={refresh}
                />
              )}
              {activeTab === "additionals" && (
                <AdditionalsTab
                  additionals={data?.additionals ?? []}
                  products={data?.products ?? []}
                  companies={companies ?? []}
                  companyId={companies?.[0]?.id ?? "all"}
                />
              )}
              {activeTab === "markers" && (
                <MarkersTab markers={data?.markers ?? []} onChange={refresh} />
              )}
              {activeTab === "qr" && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-4">QR Code do Cardápio</h2>
                  <p className="text-muted-foreground mb-4">
                    Acesse ou baixe o QR Code do seu cardápio público para divulgação nas mesas e balcão.
                  </p>
                  <Button asChild>
                    <Link to="/" target="_blank">Abrir cardápio público</Link>
                  </Button>
                </div>
              )}
              {activeTab.startsWith("tech_") && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-2">
                    {activeTab === "tech_dashboard" && "Dashboard de Fichas Técnicas"}
                    {activeTab === "tech_inputs" && "Insumos Cadastrados"}
                    {activeTab === "tech_preparations" && "Preparos Intermediários"}
                    {activeTab === "tech_products" && "Fichas Técnicas dos Produtos Finais"}
                  </h2>
                  <p className="text-muted-foreground">
                    Módulo de Engenharia de Cardápio e Fichas Técnicas em sincronização operacional.
                  </p>
                </div>
              )}
              {activeTab === "companies" && (
                <CompaniesTab companies={companies ?? []} onChange={refresh} />
              )}
              {activeTab === "theme" && (
                <ThemeTab theme={theme} onChange={refresh} />
              )}
              {activeTab === "profile" && (
                <div className="rounded-lg border bg-white p-6 shadow-sm max-w-xl">
                  <h2 className="text-lg font-bold mb-2">Minha Conta</h2>
                  <p className="text-muted-foreground mb-4">
                    Informações da sua sessão e credenciais de acesso ao painel.
                  </p>
                  <Button variant="destructive" onClick={async () => { await logout(); navigate("/admin"); }}>
                    Sair da conta
                  </Button>
                </div>
              )}
              {activeTab === "users" && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold mb-2">Usuários do Sistema</h2>
                  <p className="text-muted-foreground">
                    Gerenciamento de acessos administrativos, editores e visualizadores por empresa.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */

function ProductsTab({
  products,
  categories,
  markers,
  additionals,
  onChange,
}: {
  products: Product[];
  categories: Category[];
  markers: Marker[];
  additionals: Additional[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const del = deleteProduct;

  const newProduct = (): Partial<Product> => ({
    category_id: categories[0]?.id ?? "",
    sort_order: 0,
    active: true,
    price: null,
    image_url: null,
    name_pt: "",
    name_en: "",
    name_es: "",
    description_pt: "",
    description_en: "",
    description_es: "",
    available_days: [],
    time_start_1: null,
    time_end_1: null,
    time_start_2: null,
    time_end_2: null,
    ingredients_pt: "",
    ingredients_en: "",
    ingredients_es: "",
    marker_ids: [],
    additional_ids: [],
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing(newProduct())} disabled={!categories.length}>
          <Plus className="mr-1 h-4 w-4" /> Novo produto
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return (
            <div
              key={p.id}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-tight">{p.name_pt}</p>
                    <p className="text-xs text-muted-foreground">{cat?.name_pt ?? "—"}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="mt-auto flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Excluir produto?")) return;
                      await del({ data: { id: p.id } });
                      toast.success("Produto excluído");
                      onChange();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <ProductDialog
          product={editing}
          categories={categories}
          markers={markers}
          additionals={additionals}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function ProductDialog({
  product,
  categories,
  markers,
  additionals,
  onClose,
  onSaved,
}: {
  product: Partial<Product>;
  categories: Category[];
  markers: Marker[];
  additionals: Additional[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [p, setP] = useState<Partial<Product>>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const save = upsertProduct;
  const upload = uploadProductImage;

  const update = <K extends keyof Product>(k: K, v: Product[K]) => setP((s) => ({ ...s, [k]: v }));

  const toggleMarker = (id: string) => {
    const cur = new Set(p.marker_ids ?? []);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    update("marker_ids", Array.from(cur) as any);
  };

  const toggleAdditional = (id: string) => {
    const cur = new Set(p.additional_ids ?? []);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    update("additional_ids", Array.from(cur) as any);
  };

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const r = await upload({
        data: { fileName: file.name, contentType: file.type || "image/jpeg", base64 },
      });
      update("image_url", r.url);
      toast.success("Foto enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!p.category_id || !p.name_pt || !p.name_en || !p.name_es) {
      toast.error("Preencha categoria e nomes nos 3 idiomas");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: p.id,
          category_id: p.category_id!,
          sort_order: Number(p.sort_order ?? 0),
          active: p.active ?? true,
          price: p.price != null ? Number(p.price) : null,
          image_url: p.image_url ?? null,
          name_pt: p.name_pt!,
          name_en: p.name_en!,
          name_es: p.name_es!,
          description_pt: p.description_pt ?? null,
          description_en: p.description_en ?? null,
          description_es: p.description_es ?? null,
          available_days: p.available_days ?? [],
          time_start_1: p.time_start_1 ?? null,
          time_end_1: p.time_end_1 ?? null,
          time_start_2: p.time_start_2 ?? null,
          time_end_2: p.time_end_2 ?? null,
          ingredients_pt: p.ingredients_pt ?? null,
          ingredients_en: p.ingredients_en ?? null,
          ingredients_es: p.ingredients_es ?? null,
          marker_ids: p.marker_ids ?? [],
          additional_ids: p.additional_ids ?? [],
        } as any,
      });
      toast.success("Salvo");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const activeMarkers = markers.filter((m) => m.active);
  const activeAdditionals = additionals.filter((a) => a.active);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{p.id ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Categoria</Label>
              <Select
                value={p.category_id ?? ""}
                onValueChange={(v) => update("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={p.price ?? ""}
                onChange={(e) => update("price", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={p.sort_order ?? 0}
                onChange={(e) => update("sort_order", Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                checked={p.active ?? true}
                onCheckedChange={(v) => update("active", v)}
                id="active"
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>

          <div>
            <Label>Foto</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
                <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando…" : "Enviar foto"}
                </span>
              </label>
              {p.image_url && (
                <Button variant="ghost" size="sm" onClick={() => update("image_url", null)}>
                  Remover
                </Button>
              )}
            </div>
          </div>

          <AvailabilityControls p={p} update={update} />

          <div className="rounded-lg border border-border p-3">
            <Label className="mb-2 block text-sm font-semibold">Marcadores</Label>
            {activeMarkers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum marcador cadastrado. Vá em "Marcadores" para criar.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeMarkers.map((m) => {
                  const checked = (p.marker_ids ?? []).includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleMarker(m.id)} />
                      <MarkerIcon name={m.icon_name} className="h-4 w-4" style={{ color: m.icon_color }} />
                      {m.label_pt}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <Label className="mb-2 block text-sm font-semibold">Adicionais</Label>
            {activeAdditionals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum adicional cadastrado. Vá em "Adicionais" para criar.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeAdditionals.map((a) => {
                  const checked = (p.additional_ids ?? []).includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center justify-between text-sm hover:bg-muted/50 p-1 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={checked} onCheckedChange={() => toggleAdditional(a.id)} />
                        {a.icon && <span className="text-base">{a.icon}</span>}
                        <span>{a.name}</span>
                      </div>
                      {a.price != null && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          + R$ {Number(a.price).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <Tabs defaultValue="pt">
            <TabsList>
              <TabsTrigger value="pt">🇧🇷 Português</TabsTrigger>
              <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
              <TabsTrigger value="es">🇪🇸 Español</TabsTrigger>
            </TabsList>
            {(["pt", "en", "es"] as const).map((lng) => (
              <TabsContent key={lng} value={lng} className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={(p[`name_${lng}` as keyof Product] as string) ?? ""}
                    onChange={(e) => update(`name_${lng}` as keyof Product, e.target.value as any)}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    rows={3}
                    value={(p[`description_${lng}` as keyof Product] as string) ?? ""}
                    onChange={(e) =>
                      update(`description_${lng}` as keyof Product, e.target.value as any)
                    }
                  />
                </div>
                <div>
                  <Label>Ingredientes</Label>
                  <Textarea
                    rows={3}
                    placeholder="Um por linha ou separados por vírgula"
                    value={(p[`ingredients_${lng}` as keyof Product] as string) ?? ""}
                    onChange={(e) =>
                      update(`ingredients_${lng}` as keyof Product, e.target.value as any)
                    }
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Categories ---------------- */



/* ---------------- Markers ---------------- */

function MarkersTab({ markers, onChange }: { markers: Marker[]; onChange: () => void }) {
  const [editing, setEditing] = useState<Partial<Marker> | null>(null);
  const del = deleteMarker;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() =>
            setEditing({
              slug: "",
              label_pt: "",
              label_en: "",
              label_es: "",
              icon_name: "leaf",
              icon_color: "#16a34a",
              active: true,
              sort_order: (markers.at(-1)?.sort_order ?? 0) + 1,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" /> Novo marcador
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">Ícone</th>
              <th className="px-3 py-2">PT</th>
              <th className="px-3 py-2">EN</th>
              <th className="px-3 py-2">ES</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Ativo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {markers.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <MarkerIcon name={m.icon_name} className="h-5 w-5" style={{ color: m.icon_color }} />
                </td>
                <td className="px-3 py-2">{m.label_pt}</td>
                <td className="px-3 py-2">{m.label_en}</td>
                <td className="px-3 py-2">{m.label_es}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{m.slug}</td>
                <td className="px-3 py-2">{m.active ? "Sim" : "Não"}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Excluir marcador?")) return;
                      await del({ data: { id: m.id } });
                      toast.success("Marcador excluído");
                      onChange();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <MarkerDialog
          marker={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function MarkerDialog({
  marker,
  onClose,
  onSaved,
}: {
  marker: Partial<Marker>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [m, setM] = useState<Partial<Marker>>(marker);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const save = upsertMarker;
  const upload = uploadProductImage;
  const update = <K extends keyof Marker>(k: K, v: Marker[K]) => setM((s) => ({ ...s, [k]: v }));

  const onIconFile = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const r = await upload({
        data: {
          fileName: file.name,
          contentType: file.type || "image/png",
          base64,
          folder: "markers",
        },
      });
      update("icon_name", r.url as any);
      toast.success("Ícone enviado");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!m.slug || !m.label_pt || !m.label_en || !m.label_es || !m.icon_name) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: m.id,
          slug: m.slug!,
          label_pt: m.label_pt!,
          label_en: m.label_en!,
          label_es: m.label_es!,
          icon_name: m.icon_name!,
          icon_color: m.icon_color ?? "#16a34a",
          active: m.active ?? true,
          sort_order: Number(m.sort_order ?? 0),
        } as any,
      });
      toast.success("Salvo");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.id ? "Editar marcador" : "Novo marcador"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slug</Label>
              <Input
                value={m.slug ?? ""}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="ex: vegan"
              />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={m.sort_order ?? 0}
                onChange={(e) => update("sort_order", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Nome PT</Label>
            <Input value={m.label_pt ?? ""} onChange={(e) => update("label_pt", e.target.value)} />
          </div>
          <div>
            <Label>Nome EN</Label>
            <Input value={m.label_en ?? ""} onChange={(e) => update("label_en", e.target.value)} />
          </div>
          <div>
            <Label>Nome ES</Label>
            <Input value={m.label_es ?? ""} onChange={(e) => update("label_es", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ícone (Lucide)</Label>
              <Select
                value={
                  m.icon_name && MARKER_ICON_OPTIONS.includes(m.icon_name)
                    ? m.icon_name
                    : ""
                }
                onValueChange={(v) => update("icon_name", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="— ou envie abaixo —" />
                </SelectTrigger>
                <SelectContent>
                  {MARKER_ICON_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      <span className="inline-flex items-center gap-2">
                        <MarkerIcon name={name} className="h-4 w-4" />
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <Input
                type="color"
                value={m.icon_color ?? "#16a34a"}
                onChange={(e) => update("icon_color", e.target.value)}
                className="h-10 p-1"
              />
            </div>
          </div>
          <div>
            <Label>Ou envie um ícone próprio</Label>
            <div className="mt-1 flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onIconFile(f);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando…" : "Enviar ícone"}
                </span>
              </label>
              {m.icon_name && /^(https?:\/\/|\/|data:)/i.test(m.icon_name) && (
                <Button variant="ghost" size="sm" onClick={() => update("icon_name", "leaf" as any)}>
                  Remover
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PNG ou SVG, fundo transparente recomendado.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm"
              style={{ color: m.icon_color ?? "#16a34a" }}
            >
              <MarkerIcon name={m.icon_name ?? "leaf"} className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">{m.label_pt ?? ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={m.active ?? true}
              onCheckedChange={(v) => update("active", v)}
              id="mact"
            />
            <Label htmlFor="mact">Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Companies ---------------- */

function CompaniesTab({ companies, onChange }: { companies: Company[]; onChange: () => void }) {
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const del = deleteCompany;

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a: Company, b: Company) =>
      (a.fantasy_name || (a as any).name || "").localeCompare(
        b.fantasy_name || (b as any).name || "",
        "pt-BR",
        { sensitivity: "base" }
      )
    );
  }, [companies]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() =>
            setEditing({
              fantasy_name: "",
              legal_name: "",
              cnpj: "",
              address: "",
              logo_url: "",
              instagram: "",
              site: "",
              is_primary: companies.length === 0,
              active: true,
              sort_order: (companies.at(-1)?.sort_order ?? 0) + 1,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" /> Nova empresa
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sortedCompanies.map((c: Company) => (
          <div
            key={c.id}
            className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {c.logo_url ? (
                <img src={c.logo_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-tight">{c.fantasy_name}</p>
                  <p className="text-xs text-muted-foreground">{c.cnpj ?? "—"}</p>
                </div>
                {c.is_primary && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Principal
                  </span>
                )}
              </div>
              <div className="mt-auto flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Excluir empresa?")) return;
                    await del({ data: { id: c.id } });
                    toast.success("Empresa excluída");
                    onChange();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <CompanyDialog
          company={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function CompanyDialog({
  company,
  onClose,
  onSaved,
}: {
  company: Partial<Company>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [c, setC] = useState<Partial<Company>>(company);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const save = upsertCompany;
  const upload = uploadProductImage;
  const update = <K extends keyof Company>(k: K, v: Company[K]) => setC((s) => ({ ...s, [k]: v }));

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const r = await upload({
        data: {
          fileName: file.name,
          contentType: file.type || "image/png",
          base64,
          folder: "companies",
        },
      });
      update("logo_url", r.url);
      toast.success("Logo enviada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!c.fantasy_name) {
      toast.error("Informe o nome fantasia");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: c.id,
          fantasy_name: c.fantasy_name!,
          legal_name: c.legal_name || null,
          cnpj: c.cnpj || null,
          address: c.address || null,
          logo_url: c.logo_url || null,
          instagram: c.instagram || null,
          site: c.site || null,
          is_primary: c.is_primary ?? false,
          active: c.active ?? true,
          sort_order: Number(c.sort_order ?? 0),
        } as any,
      });
      toast.success("Salvo");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{c.id ? "Editar empresa" : "Nova empresa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Logo</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
                <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando…" : "Enviar logo"}
                </span>
              </label>
              {c.logo_url && (
                <Button variant="ghost" size="sm" onClick={() => update("logo_url", null)}>
                  Remover
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label>Nome fantasia</Label>
            <Input
              value={c.fantasy_name ?? ""}
              onChange={(e) => update("fantasy_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Razão social</Label>
            <Input
              value={c.legal_name ?? ""}
              onChange={(e) => update("legal_name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CNPJ</Label>
              <Input value={c.cnpj ?? ""} onChange={(e) => update("cnpj", e.target.value)} />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={c.sort_order ?? 0}
                onChange={(e) => update("sort_order", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Endereço</Label>
            <Textarea
              rows={2}
              value={c.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Instagram</Label>
              <Input
                value={c.instagram ?? ""}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="@bravocafe"
              />
            </div>
            <div>
              <Label>Site</Label>
              <Input
                value={c.site ?? ""}
                onChange={(e) => update("site", e.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={c.is_primary ?? false}
                onCheckedChange={(v) => update("is_primary", v)}
                id="cprim"
              />
              <Label htmlFor="cprim">Empresa principal</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={c.active ?? true}
                onCheckedChange={(v) => update("active", v)}
                id="cactc"
              />
              <Label htmlFor="cactc">Ativa</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Theme ---------------- */

const DEFAULT_THEME = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  primary_color: "oklch(0.205 0 0)",
  primary_foreground: "oklch(0.985 0 0)",
  accent: "oklch(0.97 0 0)",
  accent_foreground: "oklch(0.205 0 0)",
  muted: "oklch(0.97 0 0)",
  border: "oklch(0.922 0 0)",
};

const THEME_FIELDS: Array<{ key: keyof typeof DEFAULT_THEME; label: string; cssVar: string }> = [
  { key: "background", label: "Fundo (background)", cssVar: "--background" },
  { key: "foreground", label: "Texto (foreground)", cssVar: "--foreground" },
  { key: "primary_color", label: "Cor primária", cssVar: "--primary" },
  { key: "primary_foreground", label: "Texto sobre primária", cssVar: "--primary-foreground" },
  { key: "accent", label: "Acento", cssVar: "--accent" },
  { key: "accent_foreground", label: "Texto sobre acento", cssVar: "--accent-foreground" },
  { key: "muted", label: "Suave (muted)", cssVar: "--muted" },
  { key: "border", label: "Borda", cssVar: "--border" },
];

function ThemeTab({ theme, onChange }: { theme: ThemeSettings | null | undefined; onChange: () => void }) {
  const [t, setT] = useState(() => ({
    background: theme?.background ?? DEFAULT_THEME.background,
    foreground: theme?.foreground ?? DEFAULT_THEME.foreground,
    primary_color: theme?.primary_color ?? DEFAULT_THEME.primary_color,
    primary_foreground: theme?.primary_foreground ?? DEFAULT_THEME.primary_foreground,
    accent: theme?.accent ?? DEFAULT_THEME.accent,
    accent_foreground: theme?.accent_foreground ?? DEFAULT_THEME.accent_foreground,
    muted: theme?.muted ?? DEFAULT_THEME.muted,
    border: theme?.border ?? DEFAULT_THEME.border,
  }));
  const [saving, setSaving] = useState(false);
  const save = updateTheme;

  useEffect(() => {
    if (!theme) return;
    setT({
      background: theme.background,
      foreground: theme.foreground,
      primary_color: theme.primary_color,
      primary_foreground: theme.primary_foreground,
      accent: theme.accent,
      accent_foreground: theme.accent_foreground,
      muted: theme.muted,
      border: theme.border,
    });
  }, [theme]);

  // Live preview
  useEffect(() => {
    const root = document.documentElement;
    THEME_FIELDS.forEach((f) => root.style.setProperty(f.cssVar, t[f.key]));
  }, [t]);

  const submit = async () => {
    setSaving(true);
    try {
      await save({ data: t });
      toast.success("Tema salvo");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setT(DEFAULT_THEME);

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Os valores devem estar em formato CSS (ex:{" "}
        <code className="rounded bg-muted px-1">oklch(0.7 0.18 30)</code>,{" "}
        <code className="rounded bg-muted px-1">#1a1a1a</code>,{" "}
        <code className="rounded bg-muted px-1">hsl(220 90% 50%)</code>). As alterações aparecem em
        tempo real.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEME_FIELDS.map((f) => (
          <div key={f.key} className="rounded-lg border border-border p-3">
            <Label className="text-xs font-semibold">{f.label}</Label>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-10 w-10 shrink-0 rounded-md border border-border"
                style={{ backgroundColor: t[f.key] }}
              />
              <Input
                value={t[f.key]}
                onChange={(e) => setT((s) => ({ ...s, [f.key]: e.target.value }))}
                className="font-mono text-xs"
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{f.cssVar}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving}>
          {saving ? "Salvando…" : "Salvar tema"}
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Restaurar padrão
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Availability ---------------- */

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  return t.slice(0, 5);
}

function AvailabilityControls({
  p,
  update,
}: {
  p: Partial<Product>;
  update: <K extends keyof Product>(k: K, v: Product[K]) => void;
}) {
  const days = p.available_days ?? [];
  const has2 = !!(p.time_start_2 || p.time_end_2);

  const toggleDay = (d: number) => {
    const set = new Set(days);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    update("available_days", Array.from(set).sort() as any);
  };

  const daysLabel =
    !days.length
      ? "Todos os dias"
      : days.length === 7
        ? "Todos os dias"
        : days.map((d) => DAYS_PT[d]).join(", ");

  const r1 = p.time_start_1 && p.time_end_1 ? `${fmtTime(p.time_start_1)}–${fmtTime(p.time_end_1)}` : "";
  const r2 = p.time_start_2 && p.time_end_2 ? `${fmtTime(p.time_start_2)}–${fmtTime(p.time_end_2)}` : "";
  const timesLabel = !r1 && !r2 ? "Dia todo" : [r1, r2].filter(Boolean).join(" e ");

  return (
    <div>
      <Label>Disponibilidade</Label>
      <div className="mt-1 flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button">
              <Calendar className="mr-2 h-4 w-4" />
              {daysLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => update("available_days", [0, 1, 2, 3, 4, 5, 6] as any)}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => update("available_days", [] as any)}
                >
                  Limpar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_PT.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={days.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Vazio = disponível todos os dias.
              </p>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button">
              <Clock className="mr-2 h-4 w-4" />
              {timesLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Faixa 1</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="time"
                    value={fmtTime(p.time_start_1)}
                    onChange={(e) => update("time_start_1", (e.target.value || null) as any)}
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={fmtTime(p.time_end_1)}
                    onChange={(e) => update("time_end_1", (e.target.value || null) as any)}
                  />
                </div>
              </div>
              {has2 ? (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Faixa 2</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        update("time_start_2", null as any);
                        update("time_end_2", null as any);
                      }}
                    >
                      <X className="h-3 w-3" /> Remover
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="time"
                      value={fmtTime(p.time_start_2)}
                      onChange={(e) => update("time_start_2", (e.target.value || null) as any)}
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={fmtTime(p.time_end_2)}
                      onChange={(e) => update("time_end_2", (e.target.value || null) as any)}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    update("time_start_2", "00:00" as any);
                    update("time_end_2", "00:00" as any);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Adicionar segunda faixa
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Vazio = disponível o dia todo.</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/* ---------------- Logo Avatar (header) ---------------- */

function LogoAvatar({ companies, onChange }: { companies: Company[]; onChange: () => void }) {
  const upload = uploadProductImage;
  const save = upsertCompany;
  const [uploading, setUploading] = useState(false);
  const primary = companies.find((c) => c.is_primary && c.active) ?? companies[0];

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const r = await upload({
        data: {
          fileName: file.name,
          contentType: file.type || "image/png",
          base64,
          folder: "companies",
        },
      });
      await save({
        data: {
          id: primary?.id,
          fantasy_name: primary?.fantasy_name || "Bravo Café",
          legal_name: primary?.legal_name ?? null,
          cnpj: primary?.cnpj ?? null,
          address: primary?.address ?? null,
          logo_url: r.url,
          instagram: primary?.instagram ?? null,
          site: primary?.site ?? null,
          is_primary: true,
          active: true,
          sort_order: primary?.sort_order ?? 0,
        } as any,
      });
      toast.success("Logo atualizada");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label
      className="group relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
      title="Trocar logo"
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {primary?.logo_url ? (
        <img src={primary.logo_url} alt="" className="h-full w-full object-contain" />
      ) : (
        <Coffee className="h-5 w-5 text-primary" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        {uploading ? (
          <span className="text-[10px] text-white">…</span>
        ) : (
          <Upload className="h-4 w-4 text-white" />
        )}
      </div>
    </label>
  );
}
