import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { ApiErrorMessage } from "@/components/ui";

function Probe() {
  const auth = useAuth();
  return (
    <>
      <p>{auth.status}</p>
      <p>{auth.user?.name}</p>
      <p>{auth.notice}</p>
      <ApiErrorMessage error={auth.error || auth.logoutError} />
      <button onClick={auth.refreshUser}>Consultar novamente</button>
      <button disabled={auth.signingOut} onClick={auth.signOut}>
        Sair
      </button>
      <button onClick={() => void auth.api.listStores().catch(() => {})}>
        Lojas
      </button>
    </>
  );
}
const person = {
  id: "p",
  name: "Perfil interno",
  email: null,
  provider: "GOOGLE",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

function mount() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("estado visual derivado da sessão backend", () => {
  it("inicia carregando e /auth/me 200 fornece o usuário", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(person));
    vi.stubGlobal("fetch", fetchMock);
    mount();
    expect(screen.getByText("loading")).toBeTruthy();
    expect(await screen.findByText("Perfil interno")).toBeTruthy();
    expect(screen.getByText("authenticated")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0].pathname).toBe("/auth/me");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });
  it("/auth/me 401 indica usuário anônimo sem erro de inicialização", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    mount();
    await screen.findByText("anonymous");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Perfil interno")).toBeNull();
  });
  it("remontar consulta o backend e não confia no perfil anterior", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(person))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const view = mount();
    await screen.findByText("Perfil interno");
    view.unmount();
    mount();
    await screen.findByText("anonymous");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Perfil interno")).toBeNull();
  });
  it("falha de rede não é confundida com anonimato e permite nova consulta", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError("network"))
        .mockResolvedValueOnce(json(person)),
    );
    mount();
    await screen.findByRole("alert");
    expect(screen.getByText("error")).toBeTruthy();
    fireEvent.click(screen.getByText("Consultar novamente"));
    await screen.findByText("Perfil interno");
  });
  it("401 em outra operação remove somente a representação local do usuário", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json(person))
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );
    mount();
    await screen.findByText("Perfil interno");
    fireEvent.click(screen.getByText("Lojas"));
    await screen.findByText("anonymous");
    expect(screen.getByText(/Sua sessão não está autenticada/)).toBeTruthy();
  });
  it("logout envia POST ao backend previsto e só então mostra login", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(person))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      );
    vi.stubGlobal("fetch", fetchMock);
    mount();
    await screen.findByText("Perfil interno");
    fireEvent.click(screen.getByText("Sair"));
    expect(screen.getByText("authenticated")).toBeTruthy();
    expect(fetchMock.mock.calls[1][0].pathname).toBe("/auth/logout");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    await act(async () => finish(new Response(null, { status: 204 })));
    await screen.findByText("anonymous");
    expect(screen.queryByText("Perfil interno")).toBeNull();
  });
  it.each([404, 500])(
    "logout %s não finge que encerrou a sessão",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce(json(person))
          .mockResolvedValueOnce(new Response(null, { status })),
      );
      mount();
      await screen.findByText("Perfil interno");
      fireEvent.click(screen.getByText("Sair"));
      await screen.findByRole("alert");
      expect(screen.getByText("authenticated")).toBeTruthy();
      expect(screen.getByText("Perfil interno")).toBeTruthy();
    },
  );
  it("logout 401 mostra login porque o backend já considera a sessão anônima", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(json(person))
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );
    mount();
    await screen.findByText("Perfil interno");
    fireEvent.click(screen.getByText("Sair"));
    await screen.findByText("anonymous");
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("ignora resposta atrasada de uma consulta cancelada", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    mount();
    fireEvent.click(screen.getByText("Consultar novamente"));
    await screen.findByText("anonymous");
    await act(async () => finish(json(person)));
    await waitFor(() =>
      expect(screen.queryByText("Perfil interno")).toBeNull(),
    );
  });
});
