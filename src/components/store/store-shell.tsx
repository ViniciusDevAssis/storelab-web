"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { ApiErrorMessage, Loading, StatusBadge } from "@/components/ui";
import type { StoreResponse } from "@/lib/api/types";
import { storePath } from "@/lib/api/resources";
import { useResource } from "@/lib/hooks/use-resource";
import { canManageStore, roleLabel } from "@/lib/permissions";

const StoreContext = createContext<{
  store: StoreResponse;
  reload: () => void;
} | null>(null);

export function StoreNavigation({ store }: { store: StoreResponse }) {
  const pathname = usePathname();
  const root = storePath(store.id);
  const links = [
    { href: root, label: "Visão geral" },
    { href: `${root}/products`, label: "Produtos e estoque" },
    { href: `${root}/categories`, label: "Categorias" },
    ...(canManageStore(store.role)
      ? [
          { href: `${root}/members`, label: "Membros" },
          { href: `${root}/settings`, label: "Configurações" },
        ]
      : []),
  ];
  return (
    <nav
      aria-label="Navegação da loja"
      className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      {links.map(({ href, label }) => {
        const selected =
          href === root ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${selected ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-950"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StoreShell({
  storeId,
  children,
}: {
  storeId: string;
  children: ReactNode;
}) {
  const api = useApi();
  const resource = useResource(
    useCallback((signal) => api.getStore(storeId, signal), [api, storeId]),
  );
  return (
    <>
      <Link href="/dashboard" className="text-link">
        ← Minhas lojas
      </Link>
      {resource.loading && <Loading text="Carregando loja e permissões…" />}
      <ApiErrorMessage error={resource.error} retry={resource.reload} />
      {resource.data && !resource.error && (
        <StoreContext.Provider
          value={{ store: resource.data, reload: resource.reload }}
        >
          <div className="mb-5 mt-6 flex flex-wrap items-center gap-3">
            <span className="min-w-0 max-w-full break-words text-lg font-semibold">
              {resource.data.name}
            </span>
            <StatusBadge active={resource.data.active} />
            <span className="badge border border-slate-200 bg-white">
              {roleLabel[resource.data.role]}
            </span>
          </div>
          <StoreNavigation store={resource.data} />
          {children}
        </StoreContext.Provider>
      )}
    </>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value)
    throw new Error("A tela da loja deve estar dentro de StoreShell.");
  return value;
}

export function OwnerOnly({ children }: { children: ReactNode }) {
  const { store } = useStore();
  return canManageStore(store.role) ? (
    children
  ) : (
    <div className="panel p-6" role="alert">
      <h1 className="text-xl font-semibold">Acesso restrito ao proprietário</h1>
      <p className="mt-2 text-sm text-slate-600">
        Seu papel nesta loja não permite administrar membros ou configurações.
      </p>
      <Link href={storePath(store.id)} className="text-link mt-4 inline-block">
        Voltar à loja
      </Link>
    </div>
  );
}
