import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminCheck, adminLogin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("jeanballan@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminCheck().then((r) => {
      if (r.authed) navigate("/admin/painel");
    }).catch(() => undefined);
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    setLoading(true);
    try {
      const r = await adminLogin({ data: { email: email.trim(), password } });
      if (r.ok) {
        toast.success("Login realizado com sucesso!");
        navigate("/admin/painel");
      } else {
        toast.error(r.error || "E-mail ou senha inválidos");
      }
    } catch (error: any) {
      toast.error(error?.message || "Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1329] px-4 py-8 text-stone-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-white/10 space-y-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#111927] text-amber-400 shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
            GRUPO QU4TRO
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Gestão de Cardápio • Identifique-se para entrar
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              E-mail ou Telefone *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@bravopousada.com.br ou celular"
              className="h-11 rounded-lg border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pw" className="text-xs font-semibold text-slate-700">
              Senha *
            </Label>
            <div className="relative">
              <Input
                id="pw"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-lg border-slate-200 bg-slate-50/50 pr-10 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(Boolean(v))}
            />
            <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
              Manter conectado neste aparelho
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#111927] font-semibold text-sm text-white shadow-md hover:bg-[#1c2738] active:scale-[0.99] transition-all"
          >
            {loading ? "Entrando..." : "Entrar no Sistema"}
          </Button>
        </form>

        {/* Footer info inside card */}
        <p className="text-[11px] text-center text-slate-400 leading-tight pt-2 border-t border-slate-100">
          Acesso restrito a colaboradores autorizados.<br />
          Todos os termos de uso observam as leis vigentes.
        </p>
      </div>

      {/* Voltar ao Cardápio */}
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          ← Voltar ao cardápio público
        </Link>
      </div>
    </div>
  );
}
