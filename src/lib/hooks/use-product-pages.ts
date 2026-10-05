"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { StoreLabApi } from "@/lib/api/resources";
import type {
  PagedResponse,
  ProductQuery,
  ProductResponse,
} from "@/lib/api/types";

interface State {
  items: ProductResponse[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: unknown;
}
type Action =
  | { type: "reset" }
  | { type: "start" }
  | { type: "error"; error: unknown }
  | { type: "page"; page: PagedResponse<ProductResponse>; append: boolean };
const initial: State = {
  items: [],
  cursor: null,
  hasMore: false,
  loading: true,
  error: null,
};

function reducer(state: State, action: Action): State {
  if (action.type === "reset") return initial;
  if (action.type === "start") return { ...state, loading: true, error: null };
  if (action.type === "error")
    return { ...state, loading: false, error: action.error };
  // Mudanças concorrentes no catálogo não devem duplicar um produto já exibido.
  const merged = new Map(
    (action.append ? state.items : []).map((item) => [item.id, item]),
  );
  action.page.items.forEach((item) => merged.set(item.id, item));
  return {
    items: [...merged.values()],
    cursor: action.page.nextCursor,
    hasMore: action.page.hasMore,
    loading: false,
    error: null,
  };
}

export function useProductPages(
  api: StoreLabApi,
  storeId: string,
  query: ProductQuery,
) {
  const { categoryId, active } = query;
  const [state, dispatch] = useReducer(reducer, initial);
  const [version, reload] = useReducer((value: number) => value + 1, 0);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);

  const fetchPage = useCallback(
    async (nextCursor?: string) => {
      if (pending.current) return;
      pending.current = true;
      const controller = new AbortController();
      request.current = controller;
      dispatch({ type: "start" });
      try {
        const page = await api.listProducts(
          storeId,
          { categoryId, active, limit: 20, cursor: nextCursor },
          controller.signal,
        );
        if (!controller.signal.aborted)
          dispatch({ type: "page", page, append: !!nextCursor });
      } catch (error) {
        if (!controller.signal.aborted) dispatch({ type: "error", error });
      } finally {
        if (!controller.signal.aborted) pending.current = false;
      }
    },
    [api, storeId, categoryId, active],
  );

  useEffect(() => {
    pending.current = false;
    dispatch({ type: "reset" });
    void fetchPage();
    const controller = request.current;
    // O cursor pertence à consulta: mudar Store/filtros cancela a anterior e recomeça.
    return () => {
      controller?.abort();
      request.current?.abort();
    };
  }, [fetchPage, version]);

  return {
    ...state,
    loadMore: () => {
      if (state.hasMore && state.cursor) void fetchPage(state.cursor);
    },
    retry: () => {
      void fetchPage(
        state.items.length ? (state.cursor ?? undefined) : undefined,
      );
    },
    reload: () => reload(),
  };
}
