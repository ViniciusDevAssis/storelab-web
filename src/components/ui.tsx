import type { ReactNode } from "react";
import { ApiRequestError } from "@/lib/api/client";

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-lg bg-emerald-800 text-sm text-white"
      >
        SL
      </span>
      StoreLab<span className="text-emerald-700">.</span>
    </span>
  );
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-full">
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
export function Loading({ text = "Carregando dados…" }: { text?: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-2 py-5 text-sm text-slate-600"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-emerald-600" />
      {text}
    </p>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`badge ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
    >
      <span aria-hidden="true">●</span> {active ? "Ativo" : "Inativo"}
    </span>
  );
}
export function Feedback({ message }: { message: string }) {
  return message ? (
    <p
      role="status"
      className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
    >
      {message}
    </p>
  ) : null;
}
export function ApiErrorMessage({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  const detail = error instanceof ApiRequestError ? error.detail : null;
  const title =
    detail?.status === 401
      ? "Entre novamente"
      : detail?.status === 403
        ? "Acesso não permitido nesta loja"
        : detail?.status === 404
          ? "Recurso não encontrado"
          : "Não foi possível concluir";
  return (
    <div
      role="alert"
      className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 break-words">
        {error instanceof Error
          ? error.message
          : "Ocorreu uma falha inesperada. Tente novamente."}
      </p>
      {!!detail?.validationErrors.length && (
        <ul className="mt-2 list-inside list-disc">
          {detail.validationErrors.map((item, i) => (
            <li key={`${item.field}-${i}`}>
              <span className="font-medium">
                {item.field.split(".").at(-1)}
              </span>
              : {item.message}
            </li>
          ))}
        </ul>
      )}
      {retry && (
        <button type="button" className="btn-secondary mt-3" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
export function FormActions({
  pending,
  onCancel,
  label = "Salvar",
}: {
  pending: boolean;
  onCancel?: () => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Salvando…" : label}
      </button>
      {onCancel && (
        <button
          className="btn-secondary"
          type="button"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
