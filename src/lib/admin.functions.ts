type ServerFnArg<T> = { data: T };

type Action =
  | "adminCheck"
  | "adminLogin"
  | "adminLogout"
  | "listCompaniesAdmin"
  | "upsertProduct"
  | "deleteProduct"
  | "upsertCategory"
  | "deleteCategory"
  | "upsertMarker"
  | "deleteMarker"
  | "upsertAdditional"
  | "deleteAdditional"
  | "upsertCompany"
  | "deleteCompany"
  | "updateTheme"
  | "uploadProductImage";

async function callAdmin<T = any>(action: Action, data?: any): Promise<T> {
  let token = "";
  try {
    const raw = localStorage.getItem("visual-food-menu-supabase-session");
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed.access_token || "";
    }
  } catch {}

  const headers: Record<string, string> = {
    ...(data === undefined ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`/api/admin?action=${action}`, {
    method: data === undefined ? "GET" : "POST",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    credentials: "include",
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || `Erro na ação ${action}`);
  return payload as T;
}

const unwrap = <T>(arg: ServerFnArg<T> | T): T => (arg && typeof arg === "object" && "data" in (arg as any) ? (arg as ServerFnArg<T>).data : (arg as T));

export const adminCheck = () => callAdmin<{ authed: boolean }>("adminCheck");
export const adminLogin = (arg: ServerFnArg<{ password: string }>) => callAdmin<{ ok: boolean }>("adminLogin", unwrap(arg));
export const adminLogout = () => callAdmin<{ ok: boolean }>("adminLogout", {});

export const listCompaniesAdmin = () => callAdmin<any[]>("listCompaniesAdmin");

export const upsertProduct = (arg: ServerFnArg<any>) => callAdmin("upsertProduct", unwrap(arg));
export const deleteProduct = (arg: ServerFnArg<{ id: string }>) => callAdmin("deleteProduct", unwrap(arg));
export const upsertCategory = (arg: ServerFnArg<any>) => callAdmin("upsertCategory", unwrap(arg));
export const deleteCategory = (arg: ServerFnArg<{ id: string }>) => callAdmin("deleteCategory", unwrap(arg));
export const upsertMarker = (arg: ServerFnArg<any>) => callAdmin("upsertMarker", unwrap(arg));
export const deleteMarker = (arg: ServerFnArg<{ id: string }>) => callAdmin("deleteMarker", unwrap(arg));
export const upsertCompany = (arg: ServerFnArg<any>) => callAdmin("upsertCompany", unwrap(arg));
export const deleteCompany = (arg: ServerFnArg<{ id: string }>) => callAdmin("deleteCompany", unwrap(arg));
export const updateTheme = (arg: ServerFnArg<any>) => callAdmin("updateTheme", unwrap(arg));
export const uploadProductImage = (arg: ServerFnArg<{ fileName: string; contentType: string; base64: string; folder?: string }>) => callAdmin<{ url: string }>("uploadProductImage", unwrap(arg));
export const upsertAdditional = (arg: ServerFnArg<any>) => callAdmin("upsertAdditional", unwrap(arg));
export const deleteAdditional = (arg: ServerFnArg<{ id: string }>) => callAdmin("deleteAdditional", unwrap(arg));
