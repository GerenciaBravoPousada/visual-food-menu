import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchMenu, fetchPrimaryCompany } from "@/lib/menu";
import { useLang } from "@/hooks/use-lang";
import { pickName, t, formatPrice, pickDesc } from "@/lib/i18n";
import { LangSwitch } from "@/components/LangSwitch";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Images, Search, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import logoBravo from "@/assets/logo-bravo-cafe.png";

type View = "grid" | "carousel";

export function MenuPage() {
  const [lang, setLang] = useLang();
  const [view, setView] = useState<View>("grid");
  const [selectedCat, setSelectedCat] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [carouselIdx, setCarouselIdx] = useState(0);

  const { data, isLoading } = useQuery({ queryKey: ["menu"], queryFn: fetchMenu });
  const { data: company } = useQuery({ queryKey: ["primary-company"], queryFn: fetchPrimaryCompany });
  const logoSrc = company?.logo_url || logoBravo;
  const logoAlt = company?.fantasy_name || "Bravo Café";

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  const categories = useMemo(() => (data?.categories ?? []).filter((c) => c.active), [data]);
  const filteredProducts = useMemo(() => {
    const all = (data?.products ?? []).filter((p) => p.active && isAvailable(p, now));
    const q = search.trim().toLowerCase();
    if (q) {
      const markersById = new Map((data?.markers ?? []).map((m: any) => [m.id, m]));
      return all.filter((p: any) =>
        [
          p.name_pt, p.name_en, p.name_es,
          p.description_pt, p.description_en, p.description_es,
          p.ingredients_pt, p.ingredients_en, p.ingredients_es,
          ...((p.markers ?? []).flatMap((m: any) => {
            const full: any = markersById.get(m.id) ?? m;
            return [full?.label_pt, full?.label_en, full?.label_es, full?.slug];
          })),
        ].some((v) => typeof v === "string" && v.toLowerCase().includes(q)),
      );
    }
    if (selectedCat !== "all") return all.filter((p) => p.category_id === selectedCat);
    return all;
  }, [data, selectedCat, search, now]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredProducts>();
    for (const p of filteredProducts) {
      const arr = map.get(p.category_id) ?? [];
      arr.push(p);
      map.set(p.category_id, arr);
    }
    return map;
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt={logoAlt} className="h-20 w-auto object-contain sm:h-24" />
            <p className="sr-only">{logoAlt} — {t(lang, "menu")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-border bg-card p-1 sm:flex">
              <Button
                size="sm"
                variant={view === "grid" ? "default" : "ghost"}
                onClick={() => setView("grid")}
                className="rounded-full"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="ml-1 hidden md:inline">{t(lang, "grid")}</span>
              </Button>
              <Button
                size="sm"
                variant={view === "carousel" ? "default" : "ghost"}
                onClick={() => {
                  setView("carousel");
                  setCarouselIdx(0);
                }}
                className="rounded-full"
              >
                <Images className="h-4 w-4" />
                <span className="ml-1 hidden md:inline">{t(lang, "carousel")}</span>
              </Button>
            </div>
            <LangSwitch value={lang} onChange={setLang} />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(lang, "search")}
                className="pl-9"
              />
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <CatChip active={selectedCat === "all"} onClick={() => setSelectedCat("all")}>
                {t(lang, "all")}
              </CatChip>
              {categories.map((c) => (
                <CatChip
                  key={c.id}
                  active={selectedCat === c.id}
                  onClick={() => setSelectedCat(c.id)}
                >
                  {pickName(c, lang)}
                </CatChip>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <p className="py-20 text-center text-muted-foreground">…</p>
        ) : view === "grid" ? (
          <div className="space-y-12">
            {(selectedCat === "all" ? categories : categories.filter((c) => c.id === selectedCat)).map(
              (cat) => {
                const items = grouped.get(cat.id) ?? [];
                if (!items.length) return null;
                return (
                  <section key={cat.id}>
                    <div className="mb-5 flex items-end justify-between border-b border-border pb-2">
                      <h2 className="font-serif text-3xl font-bold text-primary">
                        {pickName(cat, lang)}
                      </h2>
                      <span className="text-sm text-muted-foreground">{items.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((p) => (
                        <ProductCard key={p.id} product={p} lang={lang} markers={data?.markers ?? []} />
                      ))}
                    </div>
                  </section>
                );
              },
            )}
            {filteredProducts.length === 0 && (
              <p className="py-20 text-center text-muted-foreground">{t(lang, "empty")}</p>
            )}
          </div>
        ) : (
          <CarouselView
            products={filteredProducts}
            lang={lang}
            idx={carouselIdx}
            setIdx={setCarouselIdx}
          />
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <a href="/admin" className="hover:text-foreground">
          {t(lang, "admin")}
        </a>
      </footer>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function CarouselView({
  products,
  lang,
  idx,
  setIdx,
}: {
  products: ReturnType<typeof useMemo<any[]>>;
  lang: ReturnType<typeof useLang>[0];
  idx: number;
  setIdx: (n: number) => void;
}) {
  const list = products as any[];
  if (!list.length) {
    return <p className="py-20 text-center text-muted-foreground">{t(lang, "empty")}</p>;
  }
  const p = list[Math.min(idx, list.length - 1)];
  const prev = () => setIdx((idx - 1 + list.length) % list.length);
  const next = () => setIdx((idx + 1) % list.length);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="relative aspect-[4/3] bg-muted">
          {p.image_url ? (
            <img src={p.image_url} alt={pickName(p, lang)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
          {p.additional_ids && p.additional_ids.length > 0 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
              {t(lang, "additionals_available") ?? "Adicionais disponíveis"}
            </span>
          )}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background"
            aria-label={t(lang, "prev")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background"
            aria-label={t(lang, "next")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold">{pickName(p, lang)}</h2>
            <span className="rounded-full bg-primary/10 px-4 py-1.5 font-semibold text-primary">
              {formatPrice(p.price, lang)}
            </span>
          </div>
          {pickDesc(p, lang) && <p className="text-muted-foreground">{pickDesc(p, lang)}</p>}
          <p className="pt-2 text-center text-xs text-muted-foreground">
            {idx + 1} {t(lang, "of")} {list.length}
          </p>
        </div>
      </div>
    </div>
  );
}

function toMin(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isAvailable(p: any, now: Date) {
  const days: number[] = p.available_days ?? [];
  if (days.length && !days.includes(now.getDay())) return false;
  const ranges: Array<[number, number]> = [];
  const s1 = toMin(p.time_start_1), e1 = toMin(p.time_end_1);
  const s2 = toMin(p.time_start_2), e2 = toMin(p.time_end_2);
  if (s1 != null && e1 != null) ranges.push([s1, e1]);
  if (s2 != null && e2 != null) ranges.push([s2, e2]);
  if (!ranges.length) return true;
  const cur = now.getHours() * 60 + now.getMinutes();
  return ranges.some(([s, e]) => (s <= e ? cur >= s && cur <= e : cur >= s || cur <= e));
}
