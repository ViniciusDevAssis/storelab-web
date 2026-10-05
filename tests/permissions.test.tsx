import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import {
  OwnerOnly,
  StoreNavigation,
  StoreShell,
} from "@/components/store/store-shell";
import type { Role, StoreResponse } from "@/lib/api/types";
import { canManageCatalog } from "@/lib/permissions";

vi.mock("next/navigation", () => ({ usePathname: () => "/stores/s" }));
const store = (role: Role): StoreResponse => ({
  id: "s",
  name: "Loja",
  active: false,
  role,
  createdBy: "p",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("autorização visual por Store", () => {
  it.each(["OWNER", "MANAGER", "EMPLOYEE"] as const)(
    "mostra navegação correta para %s mesmo em Store inativa",
    (role) => {
      render(<StoreNavigation store={store(role)} />);
      expect(
        screen.getByRole("link", { name: "Produtos e estoque" }),
      ).toBeTruthy();
      expect(screen.getByRole("link", { name: "Categorias" })).toBeTruthy();
      expect(!!screen.queryByRole("link", { name: "Membros" })).toBe(
        role === "OWNER",
      );
      expect(!!screen.queryByRole("link", { name: "Configurações" })).toBe(
        role === "OWNER",
      );
      expect(canManageCatalog(role)).toBe(role !== "EMPLOYEE");
    },
  );
  it("recalcula links ao trocar da loja OWNER para outra EMPLOYEE", () => {
    const view = render(<StoreNavigation store={store("OWNER")} />);
    view.rerender(
      <StoreNavigation store={{ ...store("EMPLOYEE"), id: "outra" }} />,
    );
    expect(screen.queryByRole("link", { name: "Membros" })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Produtos e estoque" })
        .getAttribute("href"),
    ).toBe("/stores/outra/products");
  });
  it("não monta conteúdo OWNER em acesso direto por EMPLOYEE", async () => {
    const mounted = vi.fn();
    function PrivateContent() {
      mounted();
      return <p>Conteúdo restrito</p>;
    }
    function Probe() {
      const { user } = useAuth();
      return user ? (
        <StoreShell storeId="s">
          <OwnerOnly>
            <PrivateContent />
          </OwnerOnly>
        </StoreShell>
      ) : (
        <p>Consultando sessão</p>
      );
    }
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((url: URL) =>
          Promise.resolve(
            new Response(
              JSON.stringify(
                url.pathname === "/auth/me"
                  ? { id: "p", name: "Pessoa", email: null, provider: "GOOGLE" }
                  : store("EMPLOYEE"),
              ),
            ),
          ),
        ),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("Acesso restrito ao proprietário");
    expect(mounted).not.toHaveBeenCalled();
  });
});
