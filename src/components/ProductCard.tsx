import { useState } from "react";
import { type Lang, formatPrice, pickDesc, pickName, pickIngredients, t } from "@/lib/i18n";
import type { Marker, Product } from "@/lib/menu";
import { ImageOff } from "lucide-react";
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
}: {
  product: Product;
  lang: Lang;
  markers: Marker[];
}) {
  const [open, setOpen] = useState(false);
  const ingredients = pickIngredients(product, lang);
  const productMarkers = markers.filter(
    (m) => m.active && product.marker_ids.includes(m.id),
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

        {/* Pílula de Adicionais Disponíveis (Inferior Direito) */}
        {product.additional_ids && product.additional_ids.length > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {t(lang, "additionals_available") ?? "Adicionais disponíveis"}
          </span>
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
    </article>
  );
}
