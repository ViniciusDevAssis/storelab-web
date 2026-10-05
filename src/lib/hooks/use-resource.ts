"use client";

import { useCallback, useEffect, useReducer } from "react";

interface State<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
}
type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: unknown };

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [version, reload] = useReducer((value: number) => value + 1, 0);
  const [state, dispatch] = useReducer(
    (state: State<T>, action: Action<T>): State<T> => {
      if (action.type === "start")
        return { ...state, loading: true, error: null };
      if (action.type === "success")
        return { data: action.data, loading: false, error: null };
      return { ...state, loading: false, error: action.error };
    },
    { data: null, error: null, loading: true },
  );
  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "start" });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) dispatch({ type: "success", data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) dispatch({ type: "error", error });
      });
    // Cancelar evita que uma resposta da Store anterior atualize a nova tela.
    return () => controller.abort();
  }, [load, version]);
  return { ...state, reload: useCallback(() => reload(), []) };
}
