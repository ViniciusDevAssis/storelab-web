import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createApi } from "@/lib/api/resources";
import type { ProductQuery, ProductResponse } from "@/lib/api/types";
import { useProductPages } from "@/lib/hooks/use-product-pages";

const product = (id: string): ProductResponse => ({
  id,
  storeId: "s",
  categoryId: "c",
  name: id,
  description: null,
  priceInCents: 100,
  stock: 1,
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const page = (ids: string[], cursor: string | null) =>
  new Response(
    JSON.stringify({
      items: ids.map(product),
      nextCursor: cursor,
      hasMore: cursor !== null,
    }),
  );

describe("paginação por cursor", () => {
  it("usa nextCursor, acumula itens e recomeça quando filtros mudam", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page(["a"], "cursor-1"))
      .mockResolvedValueOnce(page(["b"], null))
      .mockResolvedValueOnce(page(["c"], null));
    vi.stubGlobal("fetch", fetchMock);
    const api = createApi();
    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductPages(api, "s", query),
      { initialProps: { query: {} } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual(["a", "b"]),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0].searchParams.get("cursor")).toBe(
      "cursor-1",
    );
    expect(result.current.hasMore).toBe(false);
    rerender({ query: { active: false, categoryId: "another" } });
    await waitFor(() =>
      expect(result.current.items.map((item) => item.id)).toEqual(["c"]),
    );
    expect(fetchMock.mock.calls[2][0].searchParams.has("cursor")).toBe(false);
    expect(fetchMock.mock.calls[2][0].searchParams.get("active")).toBe("false");
  });
  it("mantém itens e cursor após falha de próxima página", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page(["a"], "cursor-1"))
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(page(["a", "b"], null));
    vi.stubGlobal("fetch", fetchMock);
    const api = createApi();
    const { result } = renderHook(() => useProductPages(api, "s", {}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toHaveLength(1);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(fetchMock.mock.calls[2][0].searchParams.get("cursor")).toBe(
      "cursor-1",
    );
  });
  it("ignora resposta atrasada do filtro anterior", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(page(["novo"], null));
    vi.stubGlobal("fetch", fetchMock);
    const api = createApi();
    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductPages(api, "s", query),
      { initialProps: { query: {} } },
    );
    rerender({ query: { active: false } });
    await waitFor(() => expect(result.current.items[0]?.id).toBe("novo"));
    await act(async () => finish(page(["antigo"], null)));
    expect(result.current.items[0].id).toBe("novo");
  });
});
