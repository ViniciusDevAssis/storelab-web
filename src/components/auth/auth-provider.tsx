"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { ApiRequestError } from "@/lib/api/client";
import { createApi, type StoreLabApi } from "@/lib/api/resources";
import type { MeResponse } from "@/lib/api/types";

interface AuthState {
  user: MeResponse | null;
  status: "loading" | "authenticated" | "anonymous" | "error";
  error: unknown;
  notice: string;
}
type AuthAction =
  | { type: "loading" }
  | { type: "loaded"; user: MeResponse }
  | { type: "anonymous"; notice?: string }
  | { type: "error"; error: unknown };
const initial: AuthState = {
  user: null,
  status: "loading",
  error: null,
  notice: "",
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "loading":
      return initial;
    case "loaded":
      // Um resultado antigo não deve reabrir a interface após um 401 ou logout.
      return state.status === "loading"
        ? { ...initial, user: action.user, status: "authenticated" }
        : state;
    case "anonymous":
      return { ...initial, status: "anonymous", notice: action.notice ?? "" };
    case "error":
      return { ...initial, status: "error", error: action.error };
  }
}
interface AuthContextValue extends AuthState {
  api: StoreLabApi;
  refreshUser: () => void;
  signOut: () => Promise<void>;
  signingOut: boolean;
  logoutError: unknown;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Este contexto guarda a resposta da API e estado visual, nunca credenciais.
  const [state, dispatch] = useReducer(authReducer, initial);
  const [revision, refreshUser] = useReducer((value: number) => value + 1, 0);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<unknown>(null);
  const api = useMemo(
    () =>
      createApi(() =>
        dispatch({
          type: "anonymous",
          notice:
            "Sua sessão não está autenticada ou expirou. Entre novamente para continuar.",
        }),
      ),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "loading" });
    // /auth/me é consultado em cada montagem; nenhum perfil local comprova uma sessão.
    createApi()
      .getMe(controller.signal)
      .then((user) => {
        if (!controller.signal.aborted) dispatch({ type: "loaded", user });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiRequestError && error.detail.status === 401) {
          dispatch({ type: "anonymous" });
        } else {
          dispatch({ type: "error", error });
        }
      });
    return () => controller.abort();
  }, [revision]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    setLogoutError(null);
    try {
      await createApi().logout();
      dispatch({ type: "anonymous" });
    } catch (error) {
      if (error instanceof ApiRequestError && error.detail.status === 401) {
        dispatch({ type: "anonymous" });
      } else {
        // Uma falha (inclusive endpoint ainda inexistente) não significa sessão encerrada.
        setLogoutError(error);
      }
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, api, refreshUser, signOut, signingOut, logoutError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve estar dentro de AuthProvider.");
  return value;
}

export function useApi(): StoreLabApi {
  return useAuth().api;
}
