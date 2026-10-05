"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { useStore } from "./store-shell";
import {
  ApiErrorMessage,
  EmptyState,
  Feedback,
  Field,
  FormActions,
  Loading,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import type { CategoryResponse } from "@/lib/api/types";
import { useResource } from "@/lib/hooks/use-resource";
import { canManageCatalog } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

function CategoryForm({
  category,
  onDone,
  onCancel,
}: {
  category?: CategoryResponse;
  onDone: () => void;
  onCancel: () => void;
}) {
  const api = useApi();
  const { store } = useStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const name = String(data.get("name") ?? "");
      if (category)
        await api.updateCategory(store.id, category.id, {
          name,
          active: data.get("active") === "true",
        });
      else await api.createCategory(store.id, { name });
      onDone();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="panel mb-6 max-w-2xl p-6" onSubmit={submit}>
      <h2 className="mb-4 text-lg font-semibold">
        {category ? "Editar categoria" : "Nova categoria"}
      </h2>
      <fieldset disabled={pending} className="space-y-5">
        <Field label="Nome" htmlFor="category-name">
          <input
            autoFocus
            className="input"
            id="category-name"
            name="name"
            required
            maxLength={100}
            defaultValue={category?.name}
          />
        </Field>
        {category && (
          <Field label="Status" htmlFor="category-active">
            <select
              className="input"
              id="category-active"
              name="active"
              defaultValue={String(category.active)}
            >
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </select>
          </Field>
        )}
        <ApiErrorMessage error={error} />
        <FormActions
          pending={pending}
          onCancel={onCancel}
          label={category ? "Salvar categoria" : "Criar categoria"}
        />
      </fieldset>
    </form>
  );
}

export function CategoriesPage() {
  const api = useApi();
  const { store } = useStore();
  const categories = useResource(
    useCallback(
      (signal) => api.listCategories(store.id, signal),
      [api, store.id],
    ),
  );
  const [editing, setEditing] = useState<CategoryResponse | "new" | null>(null);
  const [message, setMessage] = useState("");
  const canEdit = canManageCatalog(store.role);
  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organize o catálogo. Desativar uma categoria não desativa seus produtos existentes."
        action={
          canEdit &&
          !editing && (
            <button className="btn-primary" onClick={() => setEditing("new")}>
              + Nova categoria
            </button>
          )
        }
      />
      <Feedback message={message} />
      {canEdit && editing && (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setMessage(
              editing === "new" ? "Categoria criada." : "Categoria atualizada.",
            );
            setEditing(null);
            categories.reload();
          }}
        />
      )}
      {categories.loading && <Loading text="Carregando categorias…" />}
      <ApiErrorMessage error={categories.error} retry={categories.reload} />
      {categories.data && !categories.data.length && !categories.loading && (
        <EmptyState title="Nenhuma categoria cadastrada">
          As categorias organizam os produtos desta loja.
        </EmptyState>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.data?.map((category) => (
          <article
            key={category.id}
            className="panel flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-semibold">{category.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                Atualizada em {formatDate(category.updatedAt)}
              </p>
              <div className="mt-3">
                <StatusBadge active={category.active} />
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                className="btn-secondary"
                disabled={!!editing}
                onClick={() => setEditing(category)}
              >
                Editar<span className="sr-only"> {category.name}</span>
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
