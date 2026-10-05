"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApi } from "@/components/auth/auth-provider";
import { OwnerOnly, useStore } from "./store-shell";
import {
  ApiErrorMessage,
  EmptyState,
  Feedback,
  Field,
  FormActions,
  Loading,
  PageHeader,
} from "@/components/ui";
import type { MemberResponse, Role } from "@/lib/api/types";
import { useResource } from "@/lib/hooks/use-resource";
import { roleLabel } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

function RoleOptions() {
  return (
    <>
      <option value="EMPLOYEE">Colaborador (EMPLOYEE)</option>
      <option value="MANAGER">Gerente (MANAGER)</option>
      <option value="OWNER">Proprietário (OWNER)</option>
    </>
  );
}

function MemberForm({
  member,
  onDone,
  onCancel,
}: {
  member?: MemberResponse;
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
      const role = data.get("role") as Role;
      if (member) await api.updateMember(store.id, member.personId, { role });
      else
        await api.addMember(store.id, {
          personId: String(data.get("personId") ?? "").trim(),
          role,
        });
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
        {member ? "Alterar papel" : "Adicionar membro"}
      </h2>
      <fieldset disabled={pending} className="space-y-5">
        {member ? (
          <p className="break-all font-mono text-sm">{member.personId}</p>
        ) : (
          <Field
            label="personId"
            htmlFor="member-person"
            hint="ID interno StoreLab de uma pessoa que já acessou a API. Não é o email nem o ID do Google/Apple."
          >
            <input
              autoFocus
              className="input font-mono"
              id="member-person"
              name="personId"
              required
              aria-describedby="member-person-hint"
            />
          </Field>
        )}
        <Field label="Papel nesta loja" htmlFor="member-role">
          <select
            className="input"
            id="member-role"
            name="role"
            defaultValue={member?.role ?? "EMPLOYEE"}
          >
            <RoleOptions />
          </select>
        </Field>
        <ApiErrorMessage error={error} />
        <FormActions
          pending={pending}
          onCancel={onCancel}
          label={member ? "Salvar papel" : "Adicionar membro"}
        />
      </fieldset>
    </form>
  );
}

function MembersContent() {
  const api = useApi();
  const { store, reload: reloadStore } = useStore();
  const members = useResource(
    useCallback((signal) => api.listMembers(store.id, signal), [api, store.id]),
  );
  const [editing, setEditing] = useState<MemberResponse | "new" | null>(null);
  const [removing, setRemoving] = useState<MemberResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  async function removeMember() {
    if (!removing || pending) return;
    setPending(true);
    setError(null);
    try {
      await api.removeMember(store.id, removing.personId);
      setRemoving(null);
      setMessage("Membro removido.");
      members.reload();
      reloadStore();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Membros"
        description="Gerencie quem trabalha nesta loja e o papel de cada pessoa."
        action={
          !editing &&
          !removing && (
            <button className="btn-primary" onClick={() => setEditing("new")}>
              + Adicionar membro
            </button>
          )
        }
      />
      <Feedback message={message} />
      <p className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        Nesta versão, membros são adicionados por <strong>personId</strong>. Não
        há busca por nome/email nem convites. Peça à pessoa o ID exibido no menu
        do perfil dela. A API fornece apenas o ID e o papel dos membros.
      </p>
      {editing && (
        <MemberForm
          key={editing === "new" ? "new" : editing.personId}
          member={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setMessage(
              editing === "new" ? "Membro adicionado." : "Papel atualizado.",
            );
            setEditing(null);
            members.reload();
            reloadStore();
          }}
        />
      )}
      {removing && (
        <section className="panel mb-6 p-6" aria-label="Confirmar remoção">
          <h2 className="font-semibold">Remover membro desta loja?</h2>
          <p className="my-3 break-all font-mono text-sm">
            {removing.personId}
          </p>
          <p className="text-sm text-slate-600">
            A API preserva pelo menos um OWNER na loja.
          </p>
          <ApiErrorMessage error={error} />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={removeMember}
            >
              {pending ? "Removendo…" : "Confirmar remoção"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={pending}
              onClick={() => setRemoving(null)}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
      {members.loading && <Loading text="Carregando membros…" />}
      <ApiErrorMessage error={members.error} retry={members.reload} />
      {members.data && !members.data.length && !members.loading && (
        <EmptyState title="Nenhum membro retornado" />
      )}
      {!!members.data?.length && (
        <div
          className="table-wrap"
          role="region"
          aria-label="Membros da loja"
          tabIndex={0}
        >
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th>personId</th>
                <th>Papel</th>
                <th>Desde</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.data.map((member) => (
                <tr key={member.personId}>
                  <td className="max-w-64 break-all font-mono text-xs">
                    {member.personId}
                  </td>
                  <td className="text-sm">
                    {roleLabel[member.role]}
                    <span className="mt-1 block text-xs text-slate-500">
                      {member.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm">
                    {formatDate(member.createdAt)}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!!editing || !!removing}
                        onClick={() => setEditing(member)}
                      >
                        Alterar
                        <span className="sr-only"> {member.personId}</span>
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={!!editing || !!removing}
                        onClick={() => {
                          setRemoving(member);
                          setError(null);
                        }}
                      >
                        Remover
                        <span className="sr-only"> {member.personId}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// O componente interno só monta para OWNER; ocultar um link não protegeria uma URL direta.
export function MembersPage() {
  return (
    <OwnerOnly>
      <MembersContent />
    </OwnerOnly>
  );
}
