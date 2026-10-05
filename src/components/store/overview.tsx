"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { useStore } from "./store-shell";
import { storePath } from "@/lib/api/resources";
import { canManageStore, roleLabel } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

export function StoreOverview() {
  const { store } = useStore();
  const root = storePath(store.id);
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="O espaço de trabalho da sua loja. Escolha por onde começar."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href={`${root}/products`}
          className="panel p-6 hover:border-emerald-600"
        >
          <h2 className="text-lg font-semibold">Produtos e estoque →</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consulte produtos, registre entradas e saídas e acompanhe os
            movimentos de cada item.
          </p>
        </Link>
        <Link
          href={`${root}/categories`}
          className="panel p-6 hover:border-emerald-600"
        >
          <h2 className="text-lg font-semibold">Categorias →</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Veja como o catálogo está organizado.
          </p>
        </Link>
        {canManageStore(store.role) && (
          <Link
            href={`${root}/members`}
            className="panel p-6 hover:border-emerald-600"
          >
            <h2 className="text-lg font-semibold">Equipe da loja →</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Administre membros e seus papéis nesta loja.
            </p>
          </Link>
        )}
      </div>
      <dl className="panel mt-6 grid gap-5 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Seu papel nesta loja</dt>
          <dd className="mt-1 font-medium">
            {roleLabel[store.role]} ({store.role})
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Criada em</dt>
          <dd className="mt-1">{formatDate(store.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">ID da loja</dt>
          <dd className="mt-1 break-all font-mono text-xs">{store.id}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Criada por (personId)</dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {store.createdBy}
          </dd>
        </div>
      </dl>
      {!store.active && (
        <p className="mt-4 text-sm text-slate-600">
          Esta loja está marcada como inativa. As operações continuam
          disponíveis conforme seu papel.
        </p>
      )}
    </>
  );
}
