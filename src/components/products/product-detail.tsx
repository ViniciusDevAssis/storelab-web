"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { useStore } from "@/components/store/store-shell";
import {
  ApiErrorMessage,
  EmptyState,
  Feedback,
  Loading,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { storePath } from "@/lib/api/resources";
import { useResource } from "@/lib/hooks/use-resource";
import { formatDate, formatInteger, formatMoney } from "@/lib/format";
import { canManageCatalog } from "@/lib/permissions";
import { ProductForm } from "./product-form";
import { MovementForm } from "./movement-form";

export function ProductDetail({ productId }: { productId: string }) {
  const api = useApi();
  const { store } = useStore();
  const product = useResource(
    useCallback(
      (signal) => api.getProduct(store.id, productId, signal),
      [api, store.id, productId],
    ),
  );
  const categories = useResource(
    useCallback(
      (signal) => api.listCategories(store.id, signal),
      [api, store.id],
    ),
  );
  const history = useResource(
    useCallback(
      (signal) => api.listMovements(store.id, productId, signal),
      [api, store.id, productId],
    ),
  );
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState("");
  const item = product.data;
  return (
    <>
      <Link
        className="text-link mb-5 inline-block"
        href={`${storePath(store.id)}/products`}
      >
        ← Produtos
      </Link>
      <Feedback message={message} />
      {product.loading && <Loading text="Carregando produto…" />}
      <ApiErrorMessage error={product.error} retry={product.reload} />
      {item && !product.error && (
        <>
          <PageHeader
            title={item.name}
            description={
              categories.data?.find(
                (category) => category.id === item.categoryId,
              )?.name ?? `Categoria: ${item.categoryId}`
            }
            action={
              canManageCatalog(store.role) &&
              !editing && (
                <button
                  className="btn-secondary"
                  disabled={!categories.data}
                  onClick={() => setEditing(true)}
                >
                  Editar produto
                </button>
              )
            }
          />
          {categories.loading && <Loading text="Carregando categoria…" />}
          <ApiErrorMessage error={categories.error} retry={categories.reload} />
          {editing && canManageCatalog(store.role) && categories.data && (
            <ProductForm
              key={item.updatedAt}
              product={item}
              categories={categories.data}
              onCancel={() => setEditing(false)}
              onSave={async (request) => {
                await api.updateProduct(store.id, productId, request);
                setEditing(false);
                setMessage("Produto atualizado.");
                product.reload();
              }}
            />
          )}
          <section
            className="panel mb-7 p-6"
            aria-label="Informações do produto"
          >
            <div className="flex flex-wrap gap-x-14 gap-y-5">
              <div>
                <p className="text-sm text-slate-500">
                  Preço · moeda não declarada
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatMoney(item.priceInCents)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estoque atual</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatInteger(item.stock)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-500">Status</p>
                <StatusBadge active={item.active} />
              </div>
            </div>
            <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
              {item.description || "Sem descrição."}
            </p>
            <p className="mt-5 text-xs text-slate-500">
              Atualizado em {formatDate(item.updatedAt)}
            </p>
          </section>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Movimentações de estoque
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Até 100 movimentos mais recentes. O saldo inicial não gera
                movimento no histórico.
              </p>
            </div>
            {!moving && (
              <button
                className="btn-primary"
                disabled={!item.active || product.loading}
                onClick={() => setMoving(true)}
              >
                + Registrar movimento
              </button>
            )}
          </div>
          {!item.active && (
            <p className="mb-5 text-sm text-slate-500">
              Produtos inativos não recebem entradas ou saídas de estoque.
            </p>
          )}
          {moving && item.active && (
            <MovementForm
              onCancel={() => setMoving(false)}
              onSave={async (request) => {
                await api.createMovement(store.id, productId, request);
                setMoving(false);
                setMessage("Movimento registrado com sucesso.");
                product.reload();
                history.reload();
              }}
            />
          )}
          {history.loading && <Loading text="Carregando movimentos…" />}
          <ApiErrorMessage error={history.error} retry={history.reload} />
          {history.data && !history.data.length && !history.loading && (
            <EmptyState title="Nenhum movimento registrado">
              As próximas entradas e saídas aparecerão aqui.
            </EmptyState>
          )}
          {!!history.data?.length && (
            <div
              className="table-wrap"
              role="region"
              aria-label="Histórico de movimentos"
              tabIndex={0}
            >
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr>
                    <th>Data e tipo</th>
                    <th>Quantidade</th>
                    <th>Saldo anterior → novo</th>
                    <th>Motivo</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <p className="whitespace-nowrap text-sm">
                          {formatDate(movement.createdAt)}
                        </p>
                        <span
                          className={`badge mt-2 ${movement.type === "IN" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
                        >
                          {movement.type === "IN"
                            ? "Entrada (IN)"
                            : "Saída (OUT)"}
                        </span>
                      </td>
                      <td className="text-sm tabular-nums">
                        {formatInteger(movement.quantity)}
                      </td>
                      <td className="whitespace-nowrap text-sm tabular-nums">
                        {formatInteger(movement.previousStock)} →{" "}
                        {formatInteger(movement.newStock)}
                      </td>
                      <td className="max-w-64 break-words text-sm">
                        {movement.reason || "—"}
                      </td>
                      <td className="max-w-48 break-all font-mono text-xs">
                        {movement.createdBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
