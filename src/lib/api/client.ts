import type { ApiError } from "./types";
import { apiUrl } from "./config";

export class ApiRequestError extends Error {
  constructor(public readonly detail: ApiError) {
    super(detail.message);
    this.name = "ApiRequestError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Falhas HTTP também podem retornar corpo vazio/HTML, fora do envelope da API.
export function normalizeApiError(
  status: number,
  body: unknown,
  path: string,
): ApiError {
  const value = isRecord(body) ? body : {};
  const fallback: Record<number, string> = {
    401: "Sessão não autenticada ou expirada. Entre novamente.",
    403: "Você não tem permissão para esta ação nesta loja.",
    404: "Recurso não encontrado.",
    409: "A operação conflita com o estado atual do recurso.",
  };
  const violations = Array.isArray(value.validationErrors)
    ? value.validationErrors
    : [];
  return {
    status,
    code: typeof value.code === "string" ? value.code : "HTTP_ERROR",
    message:
      status >= 500
        ? "Não foi possível concluir a operação. Tente novamente mais tarde."
        : typeof value.message === "string"
          ? value.message
          : (fallback[status] ?? "A API não pôde concluir a solicitação."),
    path: typeof value.path === "string" ? value.path : path,
    timestamp:
      typeof value.timestamp === "string"
        ? value.timestamp
        : new Date().toISOString(),
    validationErrors:
      status >= 500
        ? []
        : violations.filter(
            (v): v is { field: string; message: string } =>
              isRecord(v) &&
              typeof v.field === "string" &&
              typeof v.message === "string",
          ),
  };
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = apiUrl(path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      // O navegador envia o cookie da API; JavaScript não lê nem cria a sessão.
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(
      "Não foi possível conectar à API. Verifique sua conexão, a URL da API e a configuração CORS. Se você estava salvando, consulte os dados antes de repetir a operação.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiRequestError(normalizeApiError(response.status, body, path));
  if (body === null)
    throw new Error("A API retornou uma resposta JSON inválida.");
  return body as T;
}
