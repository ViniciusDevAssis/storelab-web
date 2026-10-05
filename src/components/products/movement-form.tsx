"use client";

import { useState, type FormEvent } from "react";
import { ApiErrorMessage, Field, FormActions } from "@/components/ui";
import type { CreateMovementRequest, MovementType } from "@/lib/api/types";
import { integerInput } from "@/lib/format";

export function MovementForm({
  onSave,
  onCancel,
}: {
  onSave: (request: CreateMovementRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await onSave({
        type: data.get("type") as MovementType,
        quantity: integerInput(String(data.get("quantity") ?? "")),
        reason: String(data.get("reason") ?? ""),
      });
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="panel mb-6 p-6" onSubmit={submit}>
      <h2 className="mb-5 text-lg font-semibold">Registrar movimento</h2>
      <fieldset disabled={pending} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tipo" htmlFor="movement-type">
            <select className="input" id="movement-type" name="type">
              <option value="IN">Entrada (IN)</option>
              <option value="OUT">Saída (OUT)</option>
            </select>
          </Field>
          <Field label="Quantidade" htmlFor="movement-quantity">
            <input
              autoFocus
              className="input"
              id="movement-quantity"
              name="quantity"
              type="number"
              min={1}
              max={Number.MAX_SAFE_INTEGER}
              step={1}
              required
            />
          </Field>
        </div>
        <Field label="Motivo (opcional)" htmlFor="movement-reason">
          <input
            className="input"
            id="movement-reason"
            name="reason"
            maxLength={300}
          />
        </Field>
        <p className="text-sm text-slate-500">
          Movimentos confirmados não podem ser editados ou removidos. O saldo
          disponível é validado pela API.
        </p>
        <ApiErrorMessage error={error} />
        <FormActions
          pending={pending}
          onCancel={onCancel}
          label="Confirmar movimento"
        />
      </fieldset>
    </form>
  );
}
