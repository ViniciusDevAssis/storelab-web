"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { useStore } from "@/components/store/store-shell";
import {
  ApiErrorMessage,
  EmptyState,
  Feedback,
  Field,
  Loading,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { productPath, storePath } from "@/lib/api/resources";
import { useResource } from "@/lib/hooks/use-resource";
import { useProductPages } from "@/lib/hooks/use-product-pages";
import { canManageCatalog } from "@/lib/permissions";
import { formatInteger, formatMoney } from "@/lib/format";
import { ProductForm } from "./product-form";

export function ProductsPage() {
  const api = useApi();
  const { store } = useStore();
  const categories = useResource(
    useCallback(
      (signal) => api.listCategories(store.id, signal),
      [api, store.id],
    ),
  );
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const products = useProductPages(api, store.id, {
    categoryId: categoryId || undefined,
    active: active === "" ? undefined : active === "true",
  });
  const canEdit = canManageCatalog(store.role);
  const activeCategories = categories.data?.some((category) => category.active);
  return (
    <>
      <PageHeader
        title="Produtos e estoque"
        description="Consulte o catálogo. Abra um produto para registrar entradas, saídas e ver seu histórico."
        action={
          canEdit &&
          !creating && (
            <button
              className="btn-primary"
              disabled={!activeCategories}
              onClick={() => setCreating(true)}
            >
              + Novo produto
            </button>
          )
        }
      />
      <Feedback message={message} />
      <ApiErrorMessage error={categories.error} retry={categories.reload} />
      {categories.loading && <Loading text="Carregando categorias…" />}
      {canEdit && categories.data && !activeCategories && (
        <p className="mb-5 text-sm text-slate-600">
          Crie ou ative uma{" "}
          <Link
            className="text-link"
            href={`${storePath(store.id)}/categories`}
          >
            categoria
          </Link>{" "}
          para cadastrar produtos.
        </p>
      )}
      {canEdit && creating && categories.data && (
        <ProductForm
          categories={categories.data}
          onCancel={() => setCreating(false)}
          onSave={async (request) => {
            await api.createProduct(store.id, request);
            setCreating(false);
            setMessage(
              "Produto criado. A listagem respeita os filtros selecionados.",
            );
            products.reload();
          }}
        />
      )}
      <div className="panel mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Categoria" htmlFor="filter-category">
          <select
            className="input"
            id="filter-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {!category.active && " (inativa)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" htmlFor="filter-active">
          <select
            className="input"
            id="filter-active"
            value={active}
            onChange={(event) => setActive(event.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </Field>
      </div>
      <ApiErrorMessage error={products.error} retry={products.retry} />
      {!!products.items.length && (
        <div
          className="table-wrap"
          role="region"
          aria-label="Lista de produtos"
          tabIndex={0}
        >
          <table className="w-full min-w-[620px]">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço¹</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.items.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link
                      className="font-semibold text-emerald-800 hover:underline"
                      href={productPath(store.id, product.id)}
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {categories.data?.find(
                        (category) => category.id === product.categoryId,
                      )?.name ?? product.categoryId}
                    </p>
                  </td>
                  <td className="whitespace-nowrap text-sm tabular-nums">
                    {formatMoney(product.priceInCents)}
                  </td>
                  <td className="text-sm tabular-nums">
                    {formatInteger(product.stock)}
                  </td>
                  <td>
                    <StatusBadge active={product.active} />
                  </td>
                  <td>
                    <Link
                      className="text-link whitespace-nowrap"
                      href={productPath(store.id, product.id)}
                    >
                      Ver produto →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {products.loading && <Loading text="Carregando produtos…" />}
      {!products.loading && !products.error && !products.items.length && (
        <EmptyState title="Nenhum produto encontrado">
          Nenhum produto corresponde aos filtros atuais.
        </EmptyState>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          ¹ Valores em unidades monetárias. A API não declara a moeda.
        </p>
        {products.hasMore && !products.error && (
          <button
            className="btn-secondary"
            disabled={products.loading}
            onClick={products.loadMore}
          >
            {products.loading ? "Carregando…" : "Carregar mais"}
          </button>
        )}
      </div>
    </>
  );
}
