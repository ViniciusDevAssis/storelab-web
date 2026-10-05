"use client";

import { useState, type FormEvent } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { OwnerOnly, useStore } from "./store-shell";
import {
  ApiErrorMessage,
  Feedback,
  Field,
  FormActions,
  PageHeader,
} from "@/components/ui";

function SettingsContent() {
  const api = useApi();
  const { store, reload } = useStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setMessage("");
    try {
      await api.updateStore(store.id, {
        name: String(data.get("name") ?? ""),
        active: data.get("active") === "true",
      });
      setMessage("Configurações salvas.");
      reload();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Atualize o nome e o status desta loja."
      />
      <Feedback message={message} />
      <form
        key={store.updatedAt}
        className="panel max-w-2xl p-6"
        onSubmit={submit}
      >
        <fieldset disabled={pending} className="space-y-5">
          <Field label="Nome da loja" htmlFor="settings-name">
            <input
              className="input"
              id="settings-name"
              name="name"
              required
              maxLength={120}
              defaultValue={store.name}
            />
          </Field>
          <Field label="Status" htmlFor="settings-active">
            <select
              className="input"
              id="settings-active"
              name="active"
              defaultValue={String(store.active)}
            >
              <option value="true">Ativa</option>
              <option value="false">Inativa</option>
            </select>
          </Field>
          <p className="text-sm leading-6 text-slate-600">
            Marcar a loja como inativa altera seu status. Isso não bloqueia as
            operações de catálogo, equipe ou estoque permitidas pela API.
          </p>
          <ApiErrorMessage error={error} />
          <FormActions pending={pending} label="Salvar configurações" />
        </fieldset>
      </form>
    </>
  );
}
export function SettingsPage() {
  return (
    <OwnerOnly>
      <SettingsContent />
    </OwnerOnly>
  );
}
