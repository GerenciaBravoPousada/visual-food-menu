export type Lang = "pt" | "en" | "es";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "pt";
  const l = (navigator.language || "pt").toLowerCase();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("es")) return "es";
  return "pt";
}

const dict = {
  pt: {
    menu: "Cardápio",
    grid: "Grade",
    carousel: "Carrossel",
    all: "Todos",
    search: "Buscar...",
    admin: "Admin",
    login: "Entrar",
    password: "Senha",
    logout: "Sair",
    products: "Produtos",
    categories: "Categorias",
    add: "Adicionar",
    edit: "Editar",
    delete: "Excluir",
    save: "Salvar",
    cancel: "Cancelar",
    name: "Nome",
    description: "Descrição",
    price: "Preço",
    image: "Imagem",
    category: "Categoria",
    active: "Ativo",
    order: "Ordem",
    uploadImage: "Enviar foto",
    confirmDelete: "Tem certeza?",
    empty: "Nenhum produto nesta categoria.",
    next: "Próximo",
    prev: "Anterior",
    of: "de",
    ingredients: "Ingredientes",
    additionals_available: "adicionais disponíveis",
    additionals: "Adicionais",
    view_additionals: "Ver adicionais",
  },
  en: {
    menu: "Menu",
    grid: "Grid",
    carousel: "Carousel",
    all: "All",
    search: "Search...",
    admin: "Admin",
    login: "Log in",
    password: "Password",
    logout: "Log out",
    products: "Products",
    categories: "Categories",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    name: "Name",
    description: "Description",
    price: "Price",
    image: "Image",
    category: "Category",
    active: "Active",
    order: "Order",
    uploadImage: "Upload photo",
    confirmDelete: "Are you sure?",
    empty: "No products in this category.",
    next: "Next",
    prev: "Previous",
    of: "of",
    ingredients: "Ingredients",
    additionals_available: "Additionals available",
    additionals: "Additionals",
    view_additionals: "View additionals",
  },
  es: {
    menu: "Menú",
    grid: "Cuadrícula",
    carousel: "Carrusel",
    all: "Todos",
    search: "Buscar...",
    admin: "Admin",
    login: "Entrar",
    password: "Contraseña",
    logout: "Salir",
    products: "Productos",
    categories: "Categorías",
    add: "Añadir",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    name: "Nombre",
    description: "Descripción",
    price: "Precio",
    image: "Imagen",
    category: "Categoría",
    active: "Activo",
    order: "Orden",
    uploadImage: "Subir foto",
    confirmDelete: "¿Estás seguro?",
    empty: "No hay productos en esta categoría.",
    next: "Siguiente",
    prev: "Anterior",
    of: "de",
    ingredients: "Ingredientes",
    additionals_available: "adicionales disponibles",
    additionals: "Adicionales",
    view_additionals: "Ver adicionales",
  },
} as const;

export function pickIngredients(
  p: { ingredients_pt: string | null; ingredients_en: string | null; ingredients_es: string | null },
  lang: Lang,
) {
  return (lang === "en" ? p.ingredients_en : lang === "es" ? p.ingredients_es : p.ingredients_pt) || "";
}

export function t(lang: Lang, key: keyof (typeof dict)["pt"]): string {
  return dict[lang][key];
}

export function pickName(p: { name_pt?: string; name_en?: string; name_es?: string; name?: string }, lang: Lang) {
  return (lang === "en" ? p.name_en : lang === "es" ? p.name_es : p.name_pt) || p.name || p.name_pt || "";
}
export function pickDesc(
  p: { description_pt: string | null; description_en: string | null; description_es: string | null },
  lang: Lang,
) {
  return (lang === "en" ? p.description_en : lang === "es" ? p.description_es : p.description_pt) || "";
}

export function formatPrice(price: number | null, lang: Lang) {
  if (price == null) return "";
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  const currency = lang === "en" ? "USD" : lang === "es" ? "EUR" : "BRL";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(price));
  } catch {
    return `R$ ${Number(price).toFixed(2)}`;
  }
}
