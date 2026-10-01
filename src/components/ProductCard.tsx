import { useState } from "react";
import { type Lang, formatPrice, pickDesc, pickName, pickIngredients, t } from "@/lib/i18n";
import type { Additional, Marker, Product } from "@/lib/menu";
import { ImageOff, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkerIcon } from "@/components/MarkerIcon";

function labelOf(m: Marker, lang: Lang) {
  return lang === "en" ? m.label_en : lang === "es" ? m.label_es : m.label_pt;
}

export function ProductCard({
  product,
  lang,
  markers,
  additionals = [],
}: {
  product: Product;
  lang: Lang;
  markers: Marker[];
  additionals?: Additional[];
}) {
  const [open, setOpen] = useState(false);
  const [openAdditionals, setOpenAdditionals] = useState(false);
  const ingredients = pickIngredients(product, lang);
  const productMarkers = markers.filter(
    (m) => m.active && product.marker_ids.includes(m.id),
  );
  const productAdditionals = (additionals || []).filter(
    (a) => a.active !== false && product.additional_ids?.includes(a.id),
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={pickName(product, lang)}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        
        {/* Pílula de Quantidade de Fotos (Superior Direito) */}
        {(product as any).photos && (product as any).photos.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {(product as any).photos.length} fotos
          </span>
        )}

        {/* Botão Flutuante de Adicionais (Canto Inferior Direito) */}
        {productAdditionals.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenAdditionals(true);
            }}
            className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95"
            title={t(lang, "view_additionals") ?? "Ver adicionais"}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t(lang, "view_additionals") ?? "Ver adicionais"}</span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold leading-tight">{pickName(product, lang)}</h3>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {formatPrice(product.price, lang)}
          </span>
        </div>
        {pickDesc(product, lang) && (
          <p className="text-sm text-muted-foreground">{pickDesc(product, lang)}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {ingredients ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t(lang, "ingredients")}
            </button>
          ) : (
            <span />
          )}
          {productMarkers.length > 0 && (
            <div className="flex flex-row-reverse items-center gap-2">
              {productMarkers.map((m) => (
                <span
                  key={m.id}
                  title={labelOf(m, lang)}
                  className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-full border border-border bg-background shadow-sm"
                  style={{ color: m.icon_color }}
                >
                  <MarkerIcon name={m.icon_name} className="h-[46px] w-[46px]" />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ingredientes */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t(lang, "ingredients")} — {pickName(product, lang)}
            </DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm text-foreground">{ingredients}</p>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionais */}
      <Dialog open={openAdditionals} onOpenChange={setOpenAdditionals}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">
              {lang === "en" ? "Options & Additionals" : lang === "es" ? "Opciones y Adicionales" : "Opções & Adicionais"}
            </div>
            <DialogTitle className="text-lg font-bold">
              {pickName(product, lang)}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {productAdditionals.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {a.icon || a.icon_url ? (
                    <img
                      src={a.icon || a.icon_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover bg-muted"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight text-foreground truncate">
                      {a.name}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  + {formatPrice(a.price, lang)}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
