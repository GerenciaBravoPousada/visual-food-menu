import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  sort_order: number;
  active: boolean;
  name_pt: string;
  name_en: string;
  name_es: string;
};

export type Marker = {
  id: string;
  slug: string;
  label_pt: string;
  label_en: string;
  label_es: string;
  icon_name: string;
  icon_color: string;
  active: boolean;
  sort_order: number;
};

export type Additional = {
  id: string;
  name: string;
  price: number;
  company_id: string;
  active: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  company_id?: string;
  sort_order: number;
  active: boolean;
  price: number | null;
  image_url: string | null;
  name_pt: string;
  name_en: string;
  name_es: string;
  description_pt: string | null;
  description_en: string | null;
  description_es: string | null;
  available_days: number[];
  time_start_1: string | null;
  time_end_1: string | null;
  time_start_2: string | null;
  time_end_2: string | null;
  ingredients_pt: string | null;
  ingredients_en: string | null;
  ingredients_es: string | null;
  marker_ids: string[];
  additional_ids?: string[];
};

export type Company = {
  id: string;
  fantasy_name: string;
  legal_name: string | null;
  cnpj: string | null;
  address: string | null;
  logo_url: string | null;
  instagram: string | null;
  site: string | null;
  is_primary: boolean;
  active: boolean;
  sort_order: number;
};

export type ThemeSettings = {
  id: string;
  background: string;
  foreground: string;
  primary_color: string;
  primary_foreground: string;
  accent: string;
  accent_foreground: string;
  muted: string;
  border: string;
};

export async function fetchMenu() {
  try {
    const [cats, prods, links, addLinks, adds] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("sort_order"),

      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("sort_order"),

      supabase
        .from("product_markers")
        .select("*"),
        
      supabase
        .from("product_additionals" as any)
        .select("*"),
        
      supabase
        .from("additionals" as any)
        .select("*")
        .order("name"),
    ]);

    const byProduct = new Map<string, string[]>();
    for (const l of (links.data ?? []) as { product_id: string; marker_id: string; }[]) {
      const arr = byProduct.get(l.product_id) ?? [];
      arr.push(l.marker_id);
      byProduct.set(l.product_id, arr);
    }
    
    const addsByProduct = new Map<string, string[]>();
    for (const l of (addLinks.data ?? []) as unknown as { product_id: string; additional_id: string; }[]) {
      const arr = addsByProduct.get(l.product_id) ?? [];
      arr.push(l.additional_id);
      addsByProduct.set(l.product_id, arr);
    }

    const products: Product[] = ((prods.data ?? []) as any[]).map(
      (p) => ({
        ...p,
        marker_ids: byProduct.get(p.id) ?? [],
        additional_ids: addsByProduct.get(p.id) ?? [],
      })
    );

    return {
      categories: (cats.data ?? []) as unknown as Category[],
      products,
      markers: [],
      additionals: (adds.data ?? []) as unknown as Additional[],
    };

  } catch (error) {
    console.error("Erro ao carregar menu:", error);

    return {
      categories: [],
      products: [],
      markers: [],
    };
  }
}

const COMPANY_PUBLIC_COLS =
"id, fantasy_name, logo_url, instagram, site, is_primary, active, sort_order, created_at, updated_at";

export type PublicCompany = Omit<
Company,
"legal_name" | "cnpj" | "address"
>;

export async function fetchCompanies() {
  const { data } = await supabase
    .from("companies")
    .select(COMPANY_PUBLIC_COLS)
    .order("sort_order");

  return (data ?? []) as PublicCompany[];
}

export async function fetchPrimaryCompany() {
  const { data } = await supabase
    .from("companies")
    .select(COMPANY_PUBLIC_COLS)
    .eq("is_primary", true)
    .eq("active", true)
    .maybeSingle();

  return (data ?? null) as PublicCompany | null;
}

export async function fetchTheme() {
  const { data } = await supabase
    .from("theme_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (data ?? null) as ThemeSettings | null;
}
