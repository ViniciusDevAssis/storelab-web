import { describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiFetch, normalizeApiError } from "@/lib/api/client";
import { createApi } from "@/lib/api/resources";

describe("cliente HTTP e erros", () => {
  it("preserva o envelope e as violações de validação", () => {
    expect(
      normalizeApiError(
        400,
        {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          path: "stores",
          timestamp: "2026-01-01T00:00:00Z",
          validationErrors: [
            { field: "create.request.name", message: "must not be blank" },
            { field: 2 },
          ],
        },
        "/stores",
      ),
    ).toEqual({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      path: "stores",
      timestamp: "2026-01-01T00:00:00Z",
      validationErrors: [
        { field: "create.request.name", message: "must not be blank" },
      ],
    });
  });
  it("trata 401 sem JSON e esconde detalhes internos de 500", () => {
    expect(normalizeApiError(401, null, "/stores").message).toContain(
      "Entre novamente",
    );
    expect(
      normalizeApiError(
        500,
        {
          message: "sensitive stack trace",
          validationErrors: [{ field: "secret", message: "internal" }],
        },
        "/stores",
      ),
    ).toMatchObject({
      message:
        "Não foi possível concluir a operação. Tente novamente mais tarde.",
      validationErrors: [],
    });
  });
  it("envia cookies, preserva active=false e codifica o cursor", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ items: [], nextCursor: null, hasMore: false }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    await createApi().listProducts("store 1", {
      active: false,
      cursor: "a+/=",
      categoryId: "cat & 1",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url.pathname).toBe("/stores/store%201/products");
    expect(url.searchParams.get("cursor")).toBe("a+/=");
    expect(url.searchParams.get("active")).toBe("false");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(init.headers).toEqual({ Accept: "application/json" });
    expect(init).toMatchObject({
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  });
  it("aceita remoção 204 sem tentar ler JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(createApi().removeMember("s", "p")).resolves.toBeUndefined();
  });
  it("notifica expiração em 401 mesmo quando a API retorna corpo não JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })),
    );
    const unauthorized = vi.fn();
    await expect(createApi(unauthorized).listStores()).rejects.toBeInstanceOf(
      ApiRequestError,
    );
    expect(unauthorized).toHaveBeenCalledOnce();
  });
  it("preserva conflitos do backend e não encerra sessão em 403/409", async () => {
    const unauthorized = vi.fn();
    for (const status of [403, 409]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              code: "CONFLICT",
              message: "Insufficient stock",
            }),
            { status },
          ),
        ),
      );
      await expect(
        createApi(unauthorized).createMovement("s", "p", {
          type: "OUT",
          quantity: 3,
        }),
      ).rejects.toThrow("Insufficient stock");
    }
    expect(unauthorized).not.toHaveBeenCalled();
  });
  it("não repete POST automaticamente após uma falha de rede", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      apiFetch("/stores/s/products/p/inventory-movements", {
        method: "POST",
        body: { type: "IN", quantity: 1 },
      }),
    ).rejects.toThrow("consulte os dados");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("preserva as 18 operações existentes do contrato", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response("{}")));
    vi.stubGlobal("fetch", fetchMock);
    const api = createApi();
    await api.getMe();
    await api.listStores();
    await api.createStore({ name: "Loja" });
    await api.getStore("s");
    await api.updateStore("s", { active: false });
    await api.listMembers("s");
    await api.addMember("s", { personId: "u", role: "EMPLOYEE" });
    await api.updateMember("s", "u", { role: "MANAGER" });
    await api.removeMember("s", "u");
    await api.listCategories("s");
    await api.createCategory("s", { name: "Categoria" });
    await api.updateCategory("s", "c", { active: false });
    await api.listProducts("s");
    await api.createProduct("s", {
      categoryId: "c",
      name: "Produto",
      priceInCents: 100,
      initialStock: 0,
    });
    await api.getProduct("s", "p");
    await api.updateProduct("s", "p", { description: "" });
    await api.listMovements("s", "p");
    await api.createMovement("s", "p", { type: "IN", quantity: 2 });
    expect(
      fetchMock.mock.calls.map(
        ([url, init]) => `${init.method} ${url.pathname}`,
      ),
    ).toEqual([
      "GET /auth/me",
      "GET /stores",
      "POST /stores",
      "GET /stores/s",
      "PATCH /stores/s",
      "GET /stores/s/members",
      "POST /stores/s/members",
      "PATCH /stores/s/members/u",
      "DELETE /stores/s/members/u",
      "GET /stores/s/categories",
      "POST /stores/s/categories",
      "PATCH /stores/s/categories/c",
      "GET /stores/s/products",
      "POST /stores/s/products",
      "GET /stores/s/products/p",
      "PATCH /stores/s/products/p",
      "GET /stores/s/products/p/inventory-movements",
      "POST /stores/s/products/p/inventory-movements",
    ]);
    expect(fetchMock.mock.calls[16][0].search).toBe("");
  });
});
