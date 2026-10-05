"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { useApi } from "@/components/auth/auth-provider";
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
import { storePath } from "@/lib/api/resources";
import { useResource } from "@/lib/hooks/use-resource";
import { roleLabel } from "@/lib/permissions";

export function Dashboard() {
  const api = useApi();
  const stores = useResource(
    useCallback((signal) => api.listStores(signal), [api]),
  );
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    setPending(true);
    setError(null);
    setMessage("");
    try {
      await api.createStore({ name });
      setCreating(false);
      setMessage("Loja criada. Você é o proprietário.");
      stores.reload();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Minhas lojas"
        description="Escolha uma loja para administrar seu catálogo e acompanhar o estoque."
        action={
          !creating && (
            <button
              className="btn-primary"
              onClick={() => {
                setCreating(true);
                setError(null);
              }}
            >
              + Criar loja
            </button>
          )
        }
      />
      <Feedback message={message} />
      {creating && (
        <form className="panel mb-6 max-w-xl space-y-4 p-6" onSubmit={submit}>
          <h2 className="text-lg font-semibold">Nova loja</h2>
          <fieldset disabled={pending} className="space-y-4">
            <Field label="Nome da loja" htmlFor="store-name">
              <input
                autoFocus
                id="store-name"
                name="name"
                required
                maxLength={120}
                className="input"
              />
            </Field>
            <ApiErrorMessage error={error} />
            <FormActions
              pending={pending}
              label="Criar loja"
              onCancel={() => setCreating(false)}
            />
          </fieldset>
        </form>
      )}
      {stores.loading && <Loading text="Carregando suas lojas…" />}
      <ApiErrorMessage error={stores.error} retry={stores.reload} />
      {stores.data && !stores.data.length && !stores.loading && (
        <EmptyState title="Sua primeira loja começa aqui">
          Crie uma loja ou peça a um proprietário para adicionar seu personId.
        </EmptyState>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stores.data?.map((store) => (
          <article className="panel flex flex-col p-6" key={store.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="badge bg-slate-100 text-slate-600">
                {roleLabel[store.role]}
              </span>
              <StatusBadge active={store.active} />
            </div>
            <h2 className="mb-2 mt-6 break-words text-xl font-semibold">
              {store.name}
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Catálogo, estoque e equipe
            </p>
            <Link
              href={storePath(store.id)}
              className="text-link mt-auto border-t border-slate-100 pt-4"
            >
              Entrar na loja <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
