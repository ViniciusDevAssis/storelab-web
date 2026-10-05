"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LoginPanel } from "./login-panel";
import { ApiErrorMessage, Brand, Loading } from "@/components/ui";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, status, signOut, signingOut, logoutError } = useAuth();
  if (status === "loading")
    return (
      <div className="p-8">
        <Loading text="Consultando sua sessão…" />
      </div>
    );
  if (!user) return <LoginPanel />;
  return (
    <>
      <a className="skip-link" href="#content">
        Ir para o conteúdo
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/dashboard" aria-label="StoreLab, minhas lojas">
            <Brand />
          </Link>
          <div className="flex items-center gap-4">
            <details className="relative text-sm">
              <summary className="max-w-48 cursor-pointer truncate font-medium">
                {user.name}
              </summary>
              <div className="absolute right-0 z-20 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                <p className="break-words">
                  {user.email ?? "Email não informado"}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Seu personId (para compartilhar com o proprietário da loja)
                </p>
                <p className="mt-1 select-all break-all font-mono text-xs">
                  {user.id}
                </p>
                <p className="mt-2 text-xs text-slate-500">{user.provider}</p>
              </div>
            </details>
            <button
              type="button"
              className="btn-secondary"
              disabled={signingOut}
              onClick={signOut}
            >
              {signingOut ? "Saindo…" : "Sair"}
            </button>
          </div>
        </div>
      </header>
      <main
        id="content"
        className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8"
      >
        <ApiErrorMessage error={logoutError} />
        {children}
      </main>
      <footer className="mx-auto w-full max-w-7xl px-5 py-5 text-xs text-slate-500 sm:px-8">
        StoreLab · Administração de lojas
      </footer>
    </>
  );
}

export function LoginEntry() {
  const { user, status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);
  if (status === "loading")
    return (
      <div className="p-8">
        <Loading text="Consultando sua sessão…" />
      </div>
    );
  return user ? (
    <div className="p-8">
      <Loading text="Abrindo suas lojas…" />
    </div>
  ) : (
    <LoginPanel />
  );
}
