import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthGate } from "@/components/auth/auth-gate";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe("início do login pelo backend", () => {
  it.each([
    ["Entrar com Google", "/auth/google/login"],
    ["Entrar com Apple", "/auth/apple/login"],
  ])("%s navega somente para o destino previsto na API", async (name, path) => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "https://api.example.test/storelab/",
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AuthProvider>
        <AuthGate>
          <p>Conteúdo privado</p>
        </AuthGate>
      </AuthProvider>,
    );
    const link = await screen.findByRole("link", { name });
    // Um link nativo inicia navegação de documento, não fetch nem protocolo social.
    const navigation = vi.fn((event: MouseEvent) => event.preventDefault());
    link.addEventListener("click", navigation);
    fireEvent.click(link);
    expect(navigation).toHaveBeenCalledOnce();
    expect(link.getAttribute("href")).toBe(
      `https://api.example.test/storelab${path}`,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(screen.queryByText("Conteúdo privado")).toBeNull();
    expect(
      screen.getByText(/destinos destes botões são previstos/),
    ).toBeTruthy();
  });
});
