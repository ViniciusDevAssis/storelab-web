"use client";

import { ApiErrorMessage, Brand } from "@/components/ui";
import { apiUrl, authRoutes } from "@/lib/api/config";
import { useAuth } from "./auth-provider";

export function LoginPanel() {
  const { error, notice, refreshUser } = useAuth();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-12 sm:px-8">
      <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
        <section>
          <Brand />
          <p className="mb-4 mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Gestão de lojas
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sua loja.
            <br />
            Tudo no lugar.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
            Organize o catálogo, acompanhe o estoque e trabalhe com a sua equipe
            em um só espaço.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="badge border border-slate-200 bg-white">
              Catálogo
            </span>
            <span className="badge border border-slate-200 bg-white">
              Estoque
            </span>
            <span className="badge border border-slate-200 bg-white">
              Equipe por loja
            </span>
          </div>
        </section>
        <section className="panel p-6 sm:p-9" aria-labelledby="login-title">
          <h2 id="login-title" className="text-2xl font-semibold">
            Bem-vindo à StoreLab
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Entre com sua conta para acessar suas lojas.
          </p>
          {notice && (
            <p
              role="status"
              className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
            >
              {notice}
            </p>
          )}
          <ApiErrorMessage error={error} retry={refreshUser} />
          <div className="mt-7 space-y-4">
            {/* Navegação de documento para a API: o backend conduz todo o login e seus redirects. */}
            <a
              className="btn-secondary w-full"
              href={apiUrl(authRoutes.googleLogin).href}
            >
              Entrar com Google
            </a>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              ou
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <a
              className="btn-secondary w-full border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
              href={apiUrl(authRoutes.appleLogin).href}
            >
              Entrar com Apple
            </a>
          </div>
          <p className="mt-7 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
            Login e sessão dependem da próxima versão da StoreLab API. Os
            destinos destes botões são previstos e ainda precisam ser
            disponibilizados pelo backend.
          </p>
        </section>
      </div>
    </main>
  );
}
